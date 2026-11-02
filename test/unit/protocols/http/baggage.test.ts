/*
Copyright 2026 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import fetch, { Headers, Response } from "node-fetch";
import { CommunicationProtocolEnum, DaprClient, HTTPClient, HttpMethod, withBaggage } from "../../../../src";

describe("HTTP baggage", () => {
  const client = new DaprClient({
    communicationProtocol: CommunicationProtocolEnum.HTTP,
    daprApiToken: "test-token",
  });
  const transport = client.daprClient;
  if (!(transport instanceof HTTPClient)) {
    throw new Error("Expected HTTP client");
  }
  transport.setIsInitialized(true);
  let request: jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>>;

  beforeEach(() => {
    request = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(async () => new Response("{}"));
    jest.spyOn(transport, "getClient").mockResolvedValue(Object.assign(request, fetch));
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.stop());

  it("injects baggage without changing caller headers, trace context, authentication or serialization", async () => {
    const headers = Object.freeze({
      traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      tracestate: "vendor=value",
      "x-custom": "value",
    });
    await withBaggage({ tenant: "acme inc" }, async () => {
      await Promise.resolve();
      await client.invoker.invoke("app", "method", HttpMethod.POST, { hello: "world" }, { headers });
    });
    const sent = new Headers(request.mock.calls[0][1]?.headers);
    expect(sent.get("baggage")).toBe("tenant=acme%20inc");
    expect(sent.get("dapr-api-token")).toBe("test-token");
    expect(sent.get("user-agent")).toMatch(/^dapr-sdk-js\/.+ http\/1$/);
    for (const [key, value] of Object.entries(headers)) {
      expect(sent.get(key)).toBe(value);
    }
    expect(request.mock.calls[0][1]?.body).toBe('{"hello":"world"}');
    expect(new Headers(headers).has("baggage")).toBe(false);

    await client.invoker.invoke("app", "method", HttpMethod.GET, undefined, { headers });
    expect(new Headers(request.mock.calls[1][1]?.headers).has("baggage")).toBe(false);
  });

  it.each(["baggage", "Baggage", "BAGGAGE"])("preserves an explicit %s header", async (key) => {
    await withBaggage({ tenant: "context" }, () =>
      client.invoker.invoke("app", "method", HttpMethod.GET, undefined, { headers: { [key]: "tenant=explicit" } }),
    );
    expect(new Headers(request.mock.calls[0][1]?.headers).get("baggage")).toBe("tenant=explicit");
  });

  it("adds no baggage outside a context or for an empty context", async () => {
    await client.metadata.get();
    await withBaggage({}, () => client.metadata.get());
    for (const [, options] of request.mock.calls) {
      expect(new Headers(options?.headers).has("baggage")).toBe(false);
    }
  });

  it("propagates baggage to alternate API versions and streaming requests without mutating headers", async () => {
    const headers = new Headers({ "content-type": "application/octet-stream" });
    await withBaggage({ tenant: "stream" }, async () => {
      await transport.executeWithApiVersion("v1.0-alpha1", "/test", { method: "GET" });
      await transport.executeStreamWithApiVersion("v1.0-alpha1", "/test", { method: "GET", headers });
    });
    for (const [, options] of request.mock.calls) {
      expect(new Headers(options?.headers).get("baggage")).toBe("tenant=stream");
      expect(new Headers(options?.headers).get("dapr-api-token")).toBe("test-token");
    }
    expect(headers.has("baggage")).toBe(false);
    await transport.executeStreamWithApiVersion("v1.0-alpha1", "/test", { method: "GET", headers });
    expect(new Headers(request.mock.calls[2][1]?.headers).has("baggage")).toBe(false);
  });

  it("preserves explicit streaming baggage", async () => {
    await withBaggage({ tenant: "context" }, () =>
      transport.executeStreamWithApiVersion("v1.0-alpha1", "/test", {
        method: "GET",
        headers: { Baggage: "tenant=explicit" },
      }),
    );
    expect(new Headers(request.mock.calls[0][1]?.headers).get("baggage")).toBe("tenant=explicit");
  });

  it("does not leak baggage after a failed request", async () => {
    request.mockResolvedValueOnce(new Response("failure", { status: 500 }));
    await expect(withBaggage({ tenant: "failed" }, () => client.metadata.get())).rejects.toThrow("failure");
    await client.metadata.get();
    expect(new Headers(request.mock.calls[1][1]?.headers).has("baggage")).toBe(false);
  });
});

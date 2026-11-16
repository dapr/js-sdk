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
import { withTraceContext } from "../../../../src/utils/TraceContext.util";

const parent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
const traceHeaders = { traceparent: parent, tracestate: "vendor=value" };

describe("HTTP trace propagation", () => {
  const client = new DaprClient({ communicationProtocol: CommunicationProtocolEnum.HTTP, daprApiToken: "test-token" });
  const transport = client.daprClient as HTTPClient;
  transport.setIsInitialized(true);
  let request: jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
  beforeEach(() => {
    request = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(async () => new Response("{}"));
    jest.spyOn(transport, "getClient").mockResolvedValue(Object.assign(request, fetch));
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.stop());

  it("propagates invocation and pubsub context alongside baggage and authentication", async () => {
    await withTraceContext(traceHeaders, () =>
      withBaggage({ tenant: "one" }, async () => {
        await Promise.resolve();
        await client.invoker.invoke("app", "method", HttpMethod.POST, { hello: "world" });
        await client.pubsub.publish("pubsub", "topic", { hello: "world" });
      }),
    );
    expect(request).toHaveBeenCalledTimes(2);
    for (const [, options] of request.mock.calls) {
      const headers = new Headers(options?.headers);
      expect(headers.get("traceparent")).toBe(parent);
      expect(headers.get("tracestate")).toBe("vendor=value");
      expect(headers.get("baggage")).toBe("tenant=one");
      expect(headers.get("dapr-api-token")).toBe("test-token");
      expect(options?.body).toBe('{"hello":"world"}');
    }
    await client.metadata.get();
    expect(new Headers(request.mock.calls[2][1]?.headers).has("traceparent")).toBe(false);
  });

  it.each(["traceparent", "Traceparent", "TRACEPARENT"])(
    "respects explicit %s without pairing it with inherited tracestate",
    async (key) => {
      const headers = Object.freeze({ [key]: "explicit", "x-custom": "value" });
      await withTraceContext(traceHeaders, () =>
        client.invoker.invoke("app", "method", HttpMethod.GET, undefined, { headers }),
      );
      const sent = new Headers(request.mock.calls[0][1]?.headers);
      expect(sent.get("traceparent")).toBe("explicit");
      expect(sent.has("tracestate")).toBe(false);
      expect(sent.get("x-custom")).toBe("value");
      expect(headers).not.toHaveProperty("tracestate");
    },
  );

  it("propagates streaming requests and respects an explicit streaming context", async () => {
    await withTraceContext(traceHeaders, async () => {
      await transport.executeStreamWithApiVersion("v1.0-alpha1", "/test", { method: "GET" });
      await transport.executeStreamWithApiVersion("v1.0-alpha1", "/test", {
        method: "GET",
        headers: { Traceparent: "explicit" },
      });
    });
    expect(new Headers(request.mock.calls[0][1]?.headers).get("traceparent")).toBe(parent);
    expect(new Headers(request.mock.calls[0][1]?.headers).get("tracestate")).toBe("vendor=value");
    expect(new Headers(request.mock.calls[1][1]?.headers).get("traceparent")).toBe("explicit");
    expect(new Headers(request.mock.calls[1][1]?.headers).has("tracestate")).toBe(false);
  });

  it("does not propagate invalid contexts or leak a failed request's context", async () => {
    request.mockResolvedValueOnce(new Response("failure", { status: 500 }));
    await expect(withTraceContext(traceHeaders, () => client.metadata.get())).rejects.toThrow("failure");
    await withTraceContext({ traceparent: "invalid", tracestate: "vendor=value" }, () => client.metadata.get());
    await client.metadata.get();
    expect(new Headers(request.mock.calls[0][1]?.headers).get("traceparent")).toBe(parent);
    for (const [, options] of request.mock.calls.slice(1)) {
      expect(new Headers(options?.headers).has("traceparent")).toBe(false);
      expect(new Headers(options?.headers).has("tracestate")).toBe(false);
    }
  });
});

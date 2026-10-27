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

import http from "node:http";
import https from "node:https";
import { Readable } from "node:stream";
import fetch, { Headers, Response } from "node-fetch";
import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import { DaprClientOptions } from "../../../../src/types/DaprClientOptions";
import { THTTPExecuteParams } from "../../../../src/types/http/THTTPExecuteParams.type";
import { Settings } from "../../../../src/utils/Settings.util";
import { SDK_VERSION } from "../../../../src/version";
import { CustomSerializer } from "../../../fixtures/CustomSerializer";

jest.mock("node-fetch", () => ({
  ...jest.requireActual<typeof import("node-fetch")>("node-fetch"),
  __esModule: true,
  default: jest.fn(),
}));

describe("HTTPClient", () => {
  const request = jest.mocked(fetch);
  let clients: HTTPClient[];

  beforeEach(() => {
    clients = [];
    request.mockReset().mockImplementation(async () => new Response("{}"));
    jest.spyOn(Settings, "getDefaultHost").mockReturnValue("127.0.0.1");
    jest.spyOn(Settings, "getDefaultHttpPort").mockReturnValue("3500");
    jest.spyOn(Settings, "getDefaultHttpEndpoint").mockReturnValue("");
  });

  afterEach(async () => {
    await Promise.all(clients.map((client) => client.stop()));
    jest.restoreAllMocks();
  });

  function createClient(options: Partial<DaprClientOptions> = {}): HTTPClient {
    const client = new HTTPClient(options);
    clients.push(client);
    return client;
  }

  it.each<[Partial<DaprClientOptions>, string, string]>([
    [{}, "", "http://127.0.0.1:3500"],
    [{}, "https://environment.test:8443", "https://environment.test:8443"],
    [{ daprHost: "sidecar.test" }, "https://environment.test:8443", "http://sidecar.test:3500"],
    [{ daprPort: "3600" }, "https://environment.test:8443", "http://127.0.0.1:3600"],
    [
      { daprHost: "https://sidecar.test", daprPort: "3600" },
      "https://environment.test:8443",
      "https://sidecar.test:3600",
    ],
  ])("resolves options %j before the endpoint setting %s", async (options, endpoint, expected) => {
    jest.mocked(Settings.getDefaultHttpEndpoint).mockReturnValue(endpoint);
    const client = createClient(options);

    await expect(client.execute("/metadata", null, false)).resolves.toEqual({});
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(`${expected}/v1.0/metadata`, expect.objectContaining({ method: "GET" }));
    expect(request.mock.calls[0][1]?.agent?.constructor).toBe(expected.startsWith("https") ? https.Agent : http.Agent);
    expect(client.getIsInitialized()).toBe(false);
  });

  it("initializes lazily through the sidecar readiness check and reuses the initialized client", async () => {
    const client = createClient();
    expect(client.getIsInitialized()).toBe(false);

    await expect(client.getClient()).resolves.toBe(fetch);
    expect(client.getIsInitialized()).toBe(true);
    expect(request).toHaveBeenCalledWith(
      "http://127.0.0.1:3500/v1.0/metadata",
      expect.objectContaining({ method: "GET" }),
    );
    await expect(client.getClient()).resolves.toBe(fetch);
    expect(request).toHaveBeenCalledTimes(1);

    client.setIsInitialized(false);
    await expect(client.getClient()).resolves.toBe(fetch);
    expect(client.getIsInitialized()).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("can bypass initialization without marking the client ready", async () => {
    const client = createClient();
    const start = jest.spyOn(client, "start");

    await expect(client.getClient(false)).resolves.toBe(fetch);
    expect(start).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    expect(client.getIsInitialized()).toBe(false);
  });

  it("propagates initialization failures and retries instead of marking a failed client ready", async () => {
    const client = createClient();
    const failure = new Error("sidecar failed to start");
    const ready = jest.spyOn(client, "_startAwaitSidecarStarted").mockRejectedValueOnce(failure);

    await expect(client.getClient()).rejects.toBe(failure);
    expect(client.getIsInitialized()).toBe(false);
    expect(request).not.toHaveBeenCalled();

    await expect(client.getClient()).resolves.toBe(fetch);
    expect(client.getIsInitialized()).toBe(true);
    expect(ready).toHaveBeenCalledTimes(2);
  });

  it.each<[THTTPExecuteParams | null | undefined, string, string | undefined]>([
    [undefined, "GET", undefined],
    [null, "GET", undefined],
    [{ method: "" }, "GET", undefined],
    [{ method: "", body: "payload" }, "POST", "payload"],
    [{ method: "pAtCh", body: { value: 1 } }, "PATCH", '{"value":1}'],
  ])("normalizes the method and body for %j", async (params, method, body) => {
    const client = createClient();
    await client.execute("/test", params, false);

    expect(request).toHaveBeenCalledWith("http://127.0.0.1:3500/v1.0/test", expect.objectContaining({ method }));
    expect(request.mock.calls[0][1]?.body).toBe(body);
  });

  it.each([
    [undefined, "v1.0"],
    ["v1.0-alpha1", "v1.0-alpha1"],
  ])("defaults omitted request parameters for API version %s", async (version, expected) => {
    const client = createClient();
    client.setIsInitialized(true);

    await expect(client.executeWithApiVersion(version, "/metadata")).resolves.toEqual({});
    expect(request).toHaveBeenCalledWith(
      `http://127.0.0.1:3500/${expected}/metadata`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("infers POST when an API-version request provides only a body", async () => {
    const client = createClient();
    client.setIsInitialized(true);

    await expect(client.executeWithApiVersion("v1.0-alpha1", "/test", { body: { value: 1 } })).resolves.toEqual({});
    expect(request).toHaveBeenCalledWith(
      "http://127.0.0.1:3500/v1.0-alpha1/test",
      expect.objectContaining({ method: "POST", body: '{"value":1}' }),
    );
  });

  it.each([
    { status: 200, body: '{"value":1}', expected: { value: 1 } },
    { status: 204, body: "", expected: "" },
    { status: 299, body: "false", expected: false },
    { status: 300, body: '"text"', expected: "text" },
    { status: 399, body: "plain text", expected: "plain text" },
  ])("preserves response parsing for status $status", async ({ status, body, expected }) => {
    request.mockResolvedValueOnce(new Response(body, { status }));
    await expect(createClient().execute("/test", null, false)).resolves.toEqual(expected);
  });

  it("returns exact response text when requested, even for valid JSON with unsafe integers", async () => {
    const body = ' { "count": 9007199254740993 }\n';
    request.mockResolvedValueOnce(new Response(body));

    await expect(createClient().execute("/test", { method: "GET", responseType: "text" }, false)).resolves.toBe(body);
  });

  it.each([199, 400, 503])("preserves status %s and the raw error body without retries", async (status) => {
    const body = '{"errorCode":"ERR_TEST","message":"provider failure"}';
    request.mockResolvedValueOnce(new Response(body, { status, statusText: "Rejected" }));

    await expect(createClient().execute("/test", null, false)).rejects.toThrow(
      new Error(JSON.stringify({ error: "Rejected", error_msg: body, status })),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each(["", undefined])("uses custom serialization for %j only when a body is provided", async (body) => {
    const serializer = new CustomSerializer();
    const serialize = jest.spyOn(serializer, "serialize");
    const client = createClient();

    await client.execute("/test", { method: "POST", body, serializer }, false);
    const options = request.mock.calls[0][1];
    if (body === undefined) {
      expect(serialize).not.toHaveBeenCalled();
      expect(options?.body).toBeUndefined();
      expect(new Headers(options?.headers).has("content-type")).toBe(false);
    } else {
      expect(serialize).toHaveBeenCalledWith(body);
      expect(options?.body).toBe("custom:IiI=");
      expect(new Headers(options?.headers).get("content-type")).toBe("text/plain");
    }
  });

  it("does not issue an HTTP request when custom serialization fails", async () => {
    const serializer = new CustomSerializer();
    const failure = new Error("serialization failed");
    jest.spyOn(serializer, "serialize").mockImplementationOnce(() => {
      throw failure;
    });

    await expect(createClient().execute("/test", { method: "POST", body: "", serializer }, false)).rejects.toBe(
      failure,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it.each(["http", "https"])(
    "preserves raw streams and uses the %s agent without requiring a token",
    async (scheme) => {
      const client = createClient({ daprHost: `${scheme}://sidecar.test`, daprPort: "3500" });
      client.setIsInitialized(true);
      const body = Readable.from([Buffer.from([0, 128, 255])]);
      const headers = new Headers({ "content-type": "application/octet-stream", "x-custom": "value" });
      const controller = new AbortController();
      const params = Object.freeze({
        method: "POST",
        body,
        headers,
        signal: controller.signal,
        redirect: "follow" as const,
      });
      const response = new Response(Buffer.from([255, 0]));
      const readText = jest.spyOn(response, "text");
      request.mockResolvedValueOnce(response);

      await expect(client.executeStreamWithApiVersion("v1.0-alpha1", "/stream", params)).resolves.toBe(response);
      expect(request).toHaveBeenCalledWith(
        `${scheme}://sidecar.test:3500/v1.0-alpha1/stream`,
        expect.objectContaining({ method: "POST", body, signal: controller.signal, redirect: "error" }),
      );
      const options = request.mock.calls[0][1];
      expect(options?.agent?.constructor).toBe(scheme === "https" ? https.Agent : http.Agent);
      const sentHeaders = new Headers(options?.headers);
      expect(sentHeaders.get("user-agent")).toBe(`dapr-sdk-js/v${SDK_VERSION} http/1`);
      expect(sentHeaders.get("x-custom")).toBe("value");
      expect(sentHeaders.get("content-type")).toBe("application/octet-stream");
      expect(sentHeaders.has("dapr-api-token")).toBe(false);
      expect(sentHeaders.has("baggage")).toBe(false);
      expect(headers.has("user-agent")).toBe(false);
      expect(params.redirect).toBe("follow");
      expect(readText).not.toHaveBeenCalled();
      expect(response.bodyUsed).toBe(false);
    },
  );

  it.each([302, 503])("rejects streaming status %s with the original error details", async (status) => {
    const client = createClient();
    client.setIsInitialized(true);
    const body = '{"message":"stream failed"}';
    request.mockResolvedValueOnce(new Response(body, { status, statusText: "Rejected" }));

    await expect(client.executeStreamWithApiVersion("v1.0-alpha1", "/stream", { method: "GET" })).rejects.toThrow(
      new Error(JSON.stringify({ error: "Rejected", error_msg: body, status })),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });
});

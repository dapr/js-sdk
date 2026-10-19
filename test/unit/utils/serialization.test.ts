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

import { CommunicationProtocolEnum, DaprClient, JsonSerializer } from "../../../src";
import { serializeGrpc, serializeHttp } from "../../../src/utils/Serializer.util";
import { deserializeGrpc } from "../../../src/utils/Deserializer.util";
import { CustomSerializer } from "../../fixtures/CustomSerializer";
import HTTPServerImpl from "../../../src/implementation/Server/HTTPServer/HTTPServerImpl";
import express from "express";
import { getBulkPublishEntries } from "../../../src/utils/Client.util";
import {
  serializeJsonValue,
  deserializeJsonValue,
  isJsonContentType,
} from "../../../src/serialization/Serialization.util";

describe("application serialization", () => {
  const json = new JsonSerializer();
  const custom = new CustomSerializer();

  it.each([
    { value: { count: 1 }, contentType: "application/json", encoded: '{"count":1}' },
    { value: [1, false], contentType: "application/json", encoded: "[1,false]" },
    { value: "hello", contentType: "text/plain", encoded: "hello" },
    { value: "", contentType: "text/plain", encoded: "" },
    { value: 0, contentType: "text/plain", encoded: "0" },
    { value: false, contentType: "text/plain", encoded: "false" },
    { value: Buffer.from([0, 255]), contentType: "application/octet-stream", encoded: Buffer.from([0, 255]) },
    { value: new Uint8Array([0, 255]), contentType: "application/octet-stream", encoded: Buffer.from([0, 255]) },
    {
      value: { id: "id", source: "test", type: "test", specversion: "1.0", data: { count: 1 } },
      contentType: "application/cloudevents+json",
      encoded: '{"id":"id","source":"test","type":"test","specversion":"1.0","data":{"count":1}}',
    },
  ])(
    "retains legacy HTTP and gRPC inference without a provider: $contentType / $value",
    ({ value, contentType, encoded }) => {
      const http = serializeHttp(value);
      const grpc = serializeGrpc(value);
      expect(http.contentType).toBe(contentType);
      expect(grpc.contentType).toBe(contentType);
      expect(http.serializedData).toEqual(typeof encoded === "string" ? encoded : value);
      expect(grpc.serializedData).toEqual(Buffer.from(encoded));
    },
  );

  it("keeps provider-less bulk content-type inference and explicit entry overrides", () => {
    const entries = getBulkPublishEntries([
      { count: 1 },
      "hello",
      Buffer.from([0, 255]),
      { entryID: "explicit", event: { count: 2 }, contentType: "text/plain" },
    ]);
    expect(entries.map((entry) => entry.contentType)).toEqual([
      "application/json",
      "text/plain",
      "application/octet-stream",
      "text/plain",
    ]);
  });

  it("defaults a registered provider's missing media type to JSON without changing its codec", () => {
    const provider = { serialize: json.serialize.bind(json), deserialize: json.deserialize.bind(json) };
    expect(serializeHttp("hello", undefined, provider)).toEqual({
      serializedData: '"hello"',
      contentType: "application/json",
    });
    expect(serializeGrpc("hello", undefined, provider)).toEqual({
      serializedData: Buffer.from('"hello"'),
      contentType: "application/json",
    });
  });

  it.each([null, false, 0, "", "hello", [], { unicode: "\u00e9", nested: [1, true] }])(
    "preserves JSON semantics for %p",
    (value) => {
      expect(json.serialize(value)).toBe(JSON.stringify(value));
      expect(json.deserialize(json.serialize(value))).toEqual(value);
    },
  );

  it("rejects unsupported and malformed JSON instead of silently defaulting", () => {
    expect(() => json.serialize(undefined)).toThrow(TypeError);
    expect(() => json.serialize(1n)).toThrow(TypeError);
    expect(() => json.deserialize("invalid")).toThrow(SyntaxError);
  });

  it.each([false, 0, "", null, { count: 1234567890123456789n }])(
    "uses the same custom payload for HTTP and gRPC: %p",
    (value) => {
      const http = serializeHttp(value, undefined, custom);
      const grpc = serializeGrpc(value, undefined, custom);
      expect(http).toEqual({ serializedData: custom.serialize(value), contentType: "text/plain" });
      expect(grpc.serializedData.toString()).toBe(http.serializedData);
      expect(grpc.contentType).toBe(http.contentType);
      expect(deserializeGrpc(grpc.contentType, grpc.serializedData, custom)).toEqual(value);
      expect(serializeGrpc(value, "application/custom", custom).contentType).toBe("application/custom");
    },
  );

  it("does not swallow provider errors", () => {
    expect(() => deserializeGrpc("text/plain", Buffer.from("invalid"), custom)).toThrow("Invalid custom payload");
  });

  it("preserves explicit bulk media types while defaulting untyped entries to the provider", () => {
    const entries = getBulkPublishEntries(
      [{ count: 1 }, { entryID: "explicit", event: { count: 2 }, contentType: "application/json" }],
      "text/plain",
    );
    expect(entries.map((entry) => entry.contentType)).toEqual(["text/plain", "application/json"]);
    expect(serializeJsonValue({ count: 1 }, json, "text/plain")).toBe('{"count":1}');
  });

  it("preserves structured JSON when a JSON provider is explicitly registered", () => {
    for (const value of [null, false, 0, "", [], { count: 42 }]) {
      expect(serializeJsonValue(value, json)).toEqual(value);
      expect(deserializeJsonValue(value, json)).toEqual(value);
    }
    expect(isJsonContentType("application/vnd.example+json; charset=utf-8")).toBe(true);
    expect(isJsonContentType("APPLICATION/JSON")).toBe(true);
    expect(isJsonContentType("application/notjson")).toBe(false);
    expect(() => deserializeJsonValue({}, custom)).toThrow(TypeError);
  });

  it.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])(
    "keeps providers instance-scoped and preserves them through client creation (%s)",
    async (communicationProtocol) => {
      const client = new DaprClient({ communicationProtocol, serializer: custom });
      const other = new DaprClient({ communicationProtocol });
      const copy = DaprClient.create(client.daprClient);
      expect(client.options.serializer).toBe(custom);
      expect(client.daprClient.options.serializer).toBe(custom);
      expect(copy.options.serializer).toBe(custom);
      expect(other.options.serializer).toBeUndefined();
      await client.stop();
      await other.stop();
      await copy.stop();
    },
  );

  it("decodes HTTP CloudEvent text, base64 and custom JSON payloads without decoding the envelope", () => {
    const server = new HTTPServerImpl(express(), undefined, custom);
    const value = { count: 42n };
    const envelope = { id: "event-id", source: "test", type: "test", specversion: "1.0" };
    expect(
      server.extractDataFromSubscribeRequest({
        body: { ...envelope, data: custom.serialize(value), datacontenttype: "text/plain" },
      }),
    ).toEqual(value);
    expect(
      server.extractDataFromSubscribeRequest({
        body: { ...envelope, data_base64: Buffer.from(custom.serialize(value)).toString("base64") },
      }),
    ).toEqual(value);
    const jsonServer = new HTTPServerImpl(express(), undefined, json);
    expect(
      jsonServer.extractDataFromSubscribeRequest({
        body: { ...envelope, data: false, datacontenttype: "application/json" },
      }),
    ).toBe(false);
    expect(() =>
      server.extractDataFromSubscribeRequest({
        body: { ...envelope, data: "invalid", datacontenttype: "text/plain" },
      }),
    ).toThrow("Invalid custom payload");
    const raw = { data: false, data_base64: "application data", datacontenttype: "text/plain" };
    expect(
      jsonServer.extractDataFromSubscribeRequest({
        body: raw,
        headers: { "content-type": "application/json" },
      }),
    ).toEqual(raw);
  });
});

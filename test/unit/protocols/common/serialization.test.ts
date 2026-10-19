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

import { CommunicationProtocolEnum, DaprClient, HttpMethod } from "../../../../src";
import fetch, { Response } from "node-fetch";
import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import { CustomSerializer } from "../../../fixtures/CustomSerializer";

const mockClient = {
  saveState: jest.fn(),
  getState: jest.fn(),
  getBulkState: jest.fn(),
  queryStateAlpha1: jest.fn(),
  executeStateTransaction: jest.fn(),
  invokeService: jest.fn(),
  publishEvent: jest.fn(),
  bulkPublishEvent: jest.fn(),
  bulkPublishEventAlpha1: jest.fn(),
  invokeBinding: jest.fn(),
  getSecret: jest.fn(),
  getConfiguration: jest.fn(),
};
jest.mock("node-fetch", () => ({
  ...jest.requireActual("node-fetch"),
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@connectrpc/connect", () => ({
  ...jest.requireActual("@connectrpc/connect"),
  createClient: () => mockClient,
}));

describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])(
  "%s building-block serialization defaults",
  (communicationProtocol) => {
    let client: DaprClient;
    beforeEach(() => {
      jest.resetAllMocks();
      client = new DaprClient({ communicationProtocol });
      client.daprClient.setIsInitialized(true);
      jest
        .mocked(fetch)
        .mockImplementation(
          async (url) =>
            new Response(String(url).endsWith("/metadata") ? JSON.stringify({ runtimeVersion: "1.17.0" }) : "{}"),
        );
    });
    afterEach(async () => client.stop());

    it("retains state-specific value encodings without injecting content-type metadata", async () => {
      const values = ["plain", "", 0, false, null, { count: 1 }, Buffer.from("binary")];
      await client.state.save(
        "store",
        values.map((value, i) => ({ key: String(i), value })),
      );
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        const body = jest.mocked(fetch).mock.calls[0][1]?.body;
        expect(typeof body).toBe("string");
        expect(JSON.parse(String(body))).toEqual(
          values.map((value, i) =>
            expect.objectContaining({ key: String(i), value: JSON.parse(JSON.stringify(value)) }),
          ),
        );
      } else {
        expect(mockClient.saveState).toHaveBeenCalledWith(
          expect.objectContaining({
            states: values.map((value, i) =>
              expect.objectContaining({
                key: String(i),
                value: Buffer.from(typeof value === "object" ? JSON.stringify(value) : value.toString()),
                metadata: {},
              }),
            ),
          }),
        );
      }
      expect(client.options.serializer).toBeUndefined();
    });

    it.each(["plain", '{"count":1}', "false", "0", '""', ""])(
      "keeps state read JSON parsing and raw-text fallback for %p",
      async (encoded) => {
        jest.mocked(fetch).mockResolvedValue(new Response(encoded));
        mockClient.getState.mockResolvedValue({ data: Buffer.from(encoded) });
        const expected = encoded === "plain" || encoded === "" ? encoded : JSON.parse(encoded);
        expect(await client.state.get("store", "key")).toEqual(expected);
      },
    );

    it("preserves protocol-specific bulk and query response shapes", async () => {
      const data = { count: 1 };
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        const item = { key: "key", data, etag: "version" };
        jest
          .mocked(fetch)
          .mockResolvedValueOnce(new Response(JSON.stringify([item, { key: "missing", data: null }])))
          .mockResolvedValueOnce(new Response(JSON.stringify({ results: [item], token: "next" })));
        expect(await client.state.getBulk("store", ["key", "missing"])).toEqual([item, { key: "missing", data: null }]);
        expect(await client.state.query("store", { filter: {}, sort: [], page: { limit: 10 } })).toEqual({
          results: [item],
          token: "next",
        });
      } else {
        const bytes = Buffer.from(JSON.stringify(data));
        mockClient.getBulkState.mockResolvedValue({
          items: [
            { key: "key", data: bytes, etag: "version", error: "", metadata: {} },
            { key: "missing", data: Buffer.alloc(0), error: "missing", metadata: {} },
          ],
        });
        mockClient.queryStateAlpha1.mockResolvedValue({
          results: [{ key: "key", data: bytes, etag: "version", error: "" }],
          token: "next",
        });
        expect(await client.state.getBulk("store", ["key", "missing"])).toEqual([
          { key: "key", data, etag: "version" },
          { key: "missing", data: "" },
        ]);
        expect(await client.state.query("store", { filter: {}, sort: [], page: { limit: 10 } })).toEqual({
          results: [{ key: "key", data: bytes, etag: "version", error: "" }],
          token: "next",
        });
      }
    });

    it("does not re-encode transaction values or metadata", async () => {
      await client.state.transaction(
        "store",
        [
          { operation: "upsert", request: { key: "key", value: '"plain"' } },
          { operation: "delete", request: { key: "old" } },
        ],
        { tenant: "a" },
      );
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        expect(JSON.parse(String(jest.mocked(fetch).mock.calls[0][1]?.body))).toMatchObject({
          operations: [{ request: { value: '"plain"' } }, { operation: "delete" }],
          metadata: { tenant: "a" },
        });
      } else {
        expect(mockClient.executeStateTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            operations: [
              expect.objectContaining({ request: expect.objectContaining({ value: Buffer.from('"plain"') }) }),
              expect.objectContaining({ request: expect.objectContaining({ value: Buffer.alloc(0) }) }),
            ],
            metadata: { tenant: "a" },
          }),
        );
      }
    });

    it("retains invocation content-type handling instead of imposing global JSON defaults", async () => {
      mockClient.invokeService.mockResolvedValue({ data: { value: Buffer.from("{}") } });
      await client.invoker.invoke(
        "app",
        "method",
        HttpMethod.POST,
        { count: 1 },
        { headers: { "Content-Type": "text/plain" } },
      );
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: "[object Object]",
            headers: expect.objectContaining({ "Content-Type": "text/plain" }),
          }),
        );
      } else {
        expect(mockClient.invokeService).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.objectContaining({
              contentType: "application/json",
              data: expect.objectContaining({ value: Buffer.from('{"count":1}') }),
            }),
          }),
        );
      }
    });

    it("preserves invocation response error behavior", async () => {
      jest.mocked(fetch).mockResolvedValue(new Response("plain"));
      mockClient.invokeService.mockResolvedValue({ data: { value: Buffer.from("plain") } });
      const result = client.invoker.invoke("app", "method", HttpMethod.GET);
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        await expect(result).resolves.toBe("plain");
      } else {
        await expect(result).rejects.toThrow("COULD_NOT_PARSE_RESULT");
      }
    });

    if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
      it.each([
        { value: { count: 1 }, body: '{"count":1}', contentType: "application/json" },
        { value: "plain", body: "plain", contentType: "text/plain" },
        { value: false, body: undefined, contentType: undefined },
        { value: 0, body: undefined, contentType: undefined },
        { value: "", body: undefined, contentType: undefined },
        { value: null, body: undefined, contentType: undefined },
        { value: undefined, body: undefined, contentType: undefined },
      ])("retains HTTP workflow payload defaults for $value", async ({ value, body, contentType }) => {
        await client.workflow.scheduleNewWorkflow("workflow", value, "id");
        await client.workflow.raiseEvent("id", "event", value);
        for (const [, options] of jest.mocked(fetch).mock.calls) {
          expect(options?.body).toBe(body);
          expect(options?.headers).toEqual(
            contentType
              ? expect.objectContaining({ "Content-Type": contentType })
              : expect.not.objectContaining({ "Content-Type": expect.anything() }),
          );
        }
      });
    }

    it.each(["", undefined])("preserves default single-publish body omission for %p", async (value) => {
      mockClient.publishEvent.mockResolvedValue({});
      await client.pubsub.publish("pubsub", "topic", value);
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        expect(jest.mocked(fetch).mock.calls[0][1]?.body).toBeUndefined();
      } else {
        expect(mockClient.publishEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            data: new Uint8Array(0),
            dataContentType: "",
          }),
        );
      }
    });

    it("retains single and bulk pub/sub wire formats for JSON, text and binary data", async () => {
      const messages = [
        { entryID: "object", event: { count: 1 }, contentType: "text/plain" },
        { entryID: "text", event: "plain" },
        { entryID: "binary", event: Buffer.from("bytes") },
      ];
      mockClient.publishEvent.mockResolvedValue({});
      mockClient.bulkPublishEvent.mockResolvedValue({ failedEntries: [] });
      mockClient.bulkPublishEventAlpha1.mockResolvedValue({ failedEntries: [] });
      for (const { event } of messages) {
        await client.pubsub.publish("pubsub", "topic", event);
      }
      expect(await client.pubsub.publishBulk("pubsub", "topic", messages)).toEqual({ failedMessages: [] });
      const encoded = ['{"count":1}', "plain", Buffer.from("bytes")];
      const mediaTypes = ["application/json", "text/plain", "application/octet-stream"];
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        encoded.forEach((body, i) =>
          expect(fetch).toHaveBeenNthCalledWith(
            i + 1,
            expect.any(String),
            expect.objectContaining({
              body,
              headers: expect.objectContaining({ "Content-Type": mediaTypes[i] }),
            }),
          ),
        );
        expect(JSON.parse(String(jest.mocked(fetch).mock.calls[4][1]?.body))).toEqual(
          messages.map((message, i) => ({
            ...message,
            event: JSON.parse(JSON.stringify(message.event)),
            contentType: message.contentType ?? mediaTypes[i],
            metadata: {},
          })),
        );
      } else {
        encoded.forEach((body, i) =>
          expect(mockClient.publishEvent).toHaveBeenNthCalledWith(
            i + 1,
            expect.objectContaining({
              data: Buffer.from(body),
              dataContentType: mediaTypes[i],
            }),
          ),
        );
        expect(mockClient.bulkPublishEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            entries: encoded.map((body, i) =>
              expect.objectContaining({
                entryId: messages[i].entryID,
                event: Buffer.from(body),
                contentType: mediaTypes[i],
              }),
            ),
          }),
        );
      }
    });

    it.each([false, true])(
      "keeps bindings and secrets outside the application codec (registered: %s)",
      async (registered) => {
        const serializer = new CustomSerializer();
        const encode = jest.spyOn(serializer, "serialize");
        const decode = jest.spyOn(serializer, "deserialize");
        if (registered) {
          client.options.serializer = serializer;
          client.daprClient.options.serializer = serializer;
        }
        mockClient.invokeBinding.mockResolvedValue({ data: Buffer.from("{}"), metadata: {} });
        mockClient.getSecret.mockResolvedValue({ data: { key: "plain" } });
        jest
          .mocked(fetch)
          .mockResolvedValueOnce(new Response("{}"))
          .mockResolvedValueOnce(new Response('{"key":"plain"}'));
        await client.binding.send("binding", "create", { count: 1 });
        expect(await client.secret.get("secrets", "key")).toEqual({ key: "plain" });
        if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
          expect(fetch).toHaveBeenNthCalledWith(
            1,
            expect.any(String),
            expect.objectContaining({
              body: '{"operation":"create","data":{"count":1},"metadata":{}}',
            }),
          );
          await expect(client.configuration.get("config", ["key"])).rejects.toThrow();
        } else {
          expect(mockClient.invokeBinding).toHaveBeenCalledWith(
            expect.objectContaining({
              data: Buffer.from('{"count":1}'),
            }),
          );
          mockClient.getConfiguration.mockResolvedValue({
            items: { key: { value: "plain", version: "1", metadata: {} } },
          });
          expect(await client.configuration.get("config", ["key"])).toMatchObject({
            items: { key: { value: "plain", version: "1" } },
          });
        }
        expect(encode).not.toHaveBeenCalled();
        expect(decode).not.toHaveBeenCalled();
      },
    );
  },
);

describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])(
  "%s state serialization",
  (communicationProtocol) => {
    const serializer = new CustomSerializer();
    const value = { count: 42n };
    const encoded = serializer.serialize(value);
    let client: DaprClient;
    beforeEach(() => {
      jest.clearAllMocks();
      client = new DaprClient({ communicationProtocol, serializer });
      client.daprClient.setIsInitialized(true);
    });
    afterEach(async () => client.stop());

    it("serializes only saved values, preserving keys, metadata, etags and the caller's value", async () => {
      const states = [{ key: "key", value, etag: "version", metadata: { tenant: "a" } }];
      const http =
        communicationProtocol === CommunicationProtocolEnum.HTTP
          ? jest.spyOn(client.daprClient as HTTPClient, "execute").mockResolvedValue("")
          : undefined;
      expect(await client.state.save("store", states)).toEqual({});
      if (http) {
        expect(http).toHaveBeenCalledWith(
          expect.stringContaining("/state/store"),
          expect.objectContaining({
            body: [expect.objectContaining({ key: "key", value: encoded, etag: "version", metadata: { tenant: "a" } })],
          }),
        );
      } else {
        const saved = mockClient.saveState.mock.calls[0][0];
        expect(saved.storeName).toBe("store");
        expect(saved.states[0]).toMatchObject({
          key: "key",
          etag: { value: "version" },
          metadata: { tenant: "a" },
        });
        expect(Buffer.from(saved.states[0].value).toString()).toBe(JSON.stringify(encoded));
      }
      expect(states[0].value).toBe(value);
    });

    it("decodes query results and bulk values without losing errors or continuation tokens", async () => {
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        jest.spyOn(client.daprClient as HTTPClient, "executeWithApiVersion").mockResolvedValue({
          results: [
            { key: "key", data: encoded, etag: "version" },
            { key: "missing", data: null, error: "missing" },
          ],
          token: "next",
        });
        jest.spyOn(client.daprClient as HTTPClient, "execute").mockResolvedValue([
          { key: "key", data: encoded, etag: "version" },
          { key: "missing", data: null, error: "missing" },
        ]);
      } else {
        const items = [
          { key: "key", data: Buffer.from(JSON.stringify(encoded)), etag: "version", error: "" },
          { key: "missing", data: Buffer.alloc(0), error: "missing" },
        ];
        mockClient.queryStateAlpha1.mockResolvedValue({ results: items, token: "next" });
        mockClient.getBulkState.mockResolvedValue({ items });
      }
      const query = { filter: {}, sort: [], page: { limit: 10 } };
      expect(await client.state.query("store", query)).toMatchObject({
        results: [
          { key: "key", data: value, etag: "version" },
          { key: "missing", error: "missing" },
        ],
        token: "next",
      });
      expect(await client.state.getBulk("store", ["key", "missing"])).toMatchObject([
        { key: "key", data: value, etag: "version" },
        { key: "missing", error: "missing" },
      ]);
      if (communicationProtocol === CommunicationProtocolEnum.GRPC) {
        expect(mockClient.queryStateAlpha1.mock.calls[0][0].query).toBe(JSON.stringify(query));
      }
    });

    it("propagates deserialization failures rather than returning encoded data", async () => {
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        jest.spyOn(client.daprClient as HTTPClient, "execute").mockResolvedValue('"invalid"');
      } else {
        mockClient.getState.mockResolvedValue({ data: Buffer.from('"invalid"') });
      }
      await expect(client.state.get("store", "key")).rejects.toThrow("Invalid custom payload");
    });

    it("handles an empty custom serialization distinctly from absent state", async () => {
      const emptySerializer = {
        contentType: "text/plain",
        serialize: () => "",
        deserialize: <T>() => value as T,
      };
      client.options.serializer = emptySerializer;
      client.daprClient.options.serializer = emptySerializer;
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        jest
          .spyOn(client.daprClient as HTTPClient, "execute")
          .mockResolvedValueOnce('""')
          .mockResolvedValueOnce("");
      } else {
        mockClient.getState
          .mockResolvedValueOnce({ data: Buffer.from('""') })
          .mockResolvedValueOnce({ data: Buffer.alloc(0) });
      }
      expect(await client.state.get("store", "key")).toEqual(value);
      expect(await client.state.get("store", "absent")).toBe("");
    });
  },
);

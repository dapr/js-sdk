/*
Copyright 2022 The Dapr Authors
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

import { create } from "@bufbuild/protobuf";
import StateConcurrencyEnum from "../../../src/enum/StateConcurrency.enum";
import StateConsistencyEnum from "../../../src/enum/StateConsistency.enum";
import { ConfigurationItem, ConfigurationItemSchema } from "../../../src/proto/dapr/proto/common/v1/common_pb";
import {
  addMetadataToMap,
  createConfigurationType,
  getContentType,
  getBulkPublishEntries,
  getBulkPublishResponse,
  getClientOptions,
  getStateConcurrencyValue,
  getStateConsistencyValue,
  createHTTPQueryParam,
  withAbortSignal,
} from "../../../src/utils/Client.util";
import { PubSubBulkPublishEntry } from "../../../src/types/pubsub/PubSubBulkPublishEntry.type";
import { PubSubBulkPublishApiResponse } from "../../../src/types/pubsub/PubSubBulkPublishApiResponse.type";
import { CommunicationProtocolEnum, DaprClientOptions, LogLevel } from "../../../src";
import { DaprClient } from "../../../src";
import { Settings } from "../../../src/utils/Settings.util";

describe("Client.util", () => {
  describe("withAbortSignal", () => {
    afterEach(() => jest.restoreAllMocks());

    it("returns the original promise when no signal is supplied", () => {
      const pending = Promise.resolve(1);
      expect(withAbortSignal(pending)).toBe(pending);
    });

    it.each(["resolve", "reject"] as const)("removes the listener after %s", async (settlement) => {
      const controller = new AbortController();
      const add = jest.spyOn(controller.signal, "addEventListener");
      const remove = jest.spyOn(controller.signal, "removeEventListener");
      const error = new Error("failure");
      const pending = withAbortSignal(
        settlement === "resolve" ? Promise.resolve(7) : Promise.reject(error),
        controller.signal,
      );
      if (settlement === "resolve") {
        await expect(pending).resolves.toBe(7);
      } else {
        await expect(pending).rejects.toBe(error);
      }
      expect(add).toHaveBeenCalledWith("abort", expect.any(Function), { once: true });
      expect(remove).toHaveBeenCalledWith("abort", add.mock.calls[0][1]);
      expect(remove).toHaveBeenCalledTimes(1);
      controller.abort(new Error("too late"));
      if (settlement === "resolve") {
        await expect(pending).resolves.toBe(7);
      } else {
        await expect(pending).rejects.toBe(error);
      }
      expect(remove).toHaveBeenCalledTimes(1);
    });

    it("observes underlying rejections even when the signal was already aborted", async () => {
      const controller = new AbortController();
      const reason = new Error("cancelled");
      controller.abort(reason);
      await expect(withAbortSignal(Promise.reject(new Error("later failure")), controller.signal)).rejects.toBe(reason);
    });

    it.each([null, 0, "cancelled", { code: "CANCELLED" }])("preserves a pre-aborted reason %j", async (reason) => {
      const controller = new AbortController();
      const add = jest.spyOn(controller.signal, "addEventListener");
      const remove = jest.spyOn(controller.signal, "removeEventListener");
      controller.abort(reason);

      await expect(withAbortSignal(Promise.resolve(7), controller.signal)).rejects.toBe(reason);
      expect(remove).toHaveBeenCalledWith("abort", add.mock.calls[0][1]);
    });

    it.each(["resolve", "reject"] as const)(
      "cancels only one waiter when the shared operation later %s",
      async (settlement) => {
        const shared = deferred<number>();
        const first = new AbortController();
        const second = new AbortController();
        const addFirst = jest.spyOn(first.signal, "addEventListener");
        const removeFirst = jest.spyOn(first.signal, "removeEventListener");
        const addSecond = jest.spyOn(second.signal, "addEventListener");
        const removeSecond = jest.spyOn(second.signal, "removeEventListener");
        const reason = new Error("stop waiting");
        const failure = new Error("operation failed");
        const cancelled = withAbortSignal(shared.promise, first.signal);
        const other = withAbortSignal(shared.promise, second.signal);

        first.abort(reason);
        await expect(cancelled).rejects.toBe(reason);
        expect(removeFirst).toHaveBeenCalledWith("abort", addFirst.mock.calls[0][1]);
        expect(removeSecond).not.toHaveBeenCalled();
        expect(second.signal.aborted).toBe(false);

        if (settlement === "resolve") {
          shared.resolve(7);
          await expect(other).resolves.toBe(7);
        } else {
          shared.reject(failure);
          await expect(other).rejects.toBe(failure);
        }
        await expect(cancelled).rejects.toBe(reason);
        expect(removeSecond).toHaveBeenCalledWith("abort", addSecond.mock.calls[0][1]);
      },
    );

    it("observes a late underlying rejection after the only waiter is cancelled", async () => {
      const shared = deferred<number>();
      const controller = new AbortController();
      const pending = withAbortSignal(shared.promise, controller.signal);
      controller.abort();
      await expect(pending).rejects.toMatchObject({ name: "AbortError" });

      shared.reject(new Error("later failure"));
      await new Promise<void>((resolve) => setImmediate(resolve));
      await expect(pending).rejects.toBe(controller.signal.reason);
    });

    it("honors cancellation before an already-resolved operation's continuation runs", async () => {
      const shared = deferred<number>();
      const controller = new AbortController();
      const reason = new Error("cancel before continuation");
      const pending = withAbortSignal(shared.promise, controller.signal);

      shared.resolve(7);
      controller.abort(reason);

      await expect(pending).rejects.toBe(reason);
      await expect(shared.promise).resolves.toBe(7);
    });
  });

  describe("addMetadataToMap", () => {
    it("should add values to Map", () => {
      const m = new Map<string, string>([]);
      const metadata = {
        key1: "value1",
        key2: "value2",
      };
      addMetadataToMap(m, metadata);

      expect(m.get("key1")).toEqual("value1");
      expect(m.get("key2")).toEqual("value2");
    });

    it("should add nothing to map when metadata is not passed", () => {
      const m = new Map<string, string>([]);
      addMetadataToMap(m);

      expect(m.entries()).toEqual(new Map<string, string>([]).entries());
    });

    it("should add nothing to map when metadata is undefined", () => {
      const m = new Map<string, string>([]);
      addMetadataToMap(m, undefined);

      expect(m.entries()).toEqual(new Map<string, string>([]).entries());
    });

    it("overwrites matching keys, keeps unrelated entries, and ignores inherited metadata", () => {
      const metadata: Record<string, string> = Object.assign(Object.create({ inherited: "ignored" }), {
        key: "new",
        empty: "",
      });
      Object.freeze(metadata);
      const map = new Map([
        ["key", "old"],
        ["unrelated", "keep"],
      ]);

      addMetadataToMap(map, metadata);

      expect([...map]).toEqual([
        ["key", "new"],
        ["unrelated", "keep"],
        ["empty", ""],
      ]);
    });
  });
  describe("createHTTPQueryParam", () => {
    it("converts a KeyValueType to a HTTP query parameters", () => {
      const metadata = {
        key1: "value1",
        key2: "value2",
      };
      const queryParam = createHTTPQueryParam({ data: metadata, type: "metadata" });
      expect(queryParam).toEqual("metadata.key1=value1&metadata.key2=value2");
    });

    it("converts a KeyValueType to a HTTP query parameters with empty metadata", () => {
      const metadata = {};
      const queryParam = createHTTPQueryParam({ data: metadata, type: "metadata" });
      expect(queryParam).toEqual("");
    });

    it("converts a KeyValueType to a HTTP query parameters with no metadata", () => {
      const queryParam = createHTTPQueryParam();
      expect(queryParam).toEqual("");
    });

    it("encodes the query parameters", () => {
      const metadata = {
        "key&with=special!ch#r#cters": "value1&value2",
        key00: "value3 value4",
      };
      const queryParam = createHTTPQueryParam({ data: metadata, type: "metadata" });
      expect(queryParam).toEqual(
        "metadata.key%26with%3Dspecial%21ch%23r%23cters=value1%26value2&metadata.key00=value3+value4",
      );
    });

    it("supports setting non-metadata query parameters", () => {
      const data = {
        key1: "value1",
        key2: "value2",
      };
      const queryParam = createHTTPQueryParam({ data });
      expect(queryParam).toEqual("key1=value1&key2=value2");
    });
    it("mix of data and metadata", () => {
      const data = {
        key1: "value1",
        key2: "value2",
      };
      const metadata = {
        "key&with=special!ch#r#cters": "value1&value2",
        key00: "value3 value4",
      };
      const queryParam = createHTTPQueryParam({ data: metadata, type: "metadata" }, { data });
      expect(queryParam).toEqual(
        "metadata.key%26with%3Dspecial%21ch%23r%23cters=value1%26value2&metadata.key00=value3+value4&key1=value1&key2=value2",
      );
    });

    it("skips absent groups and undefined values without dropping empty, zero, or false values", () => {
      expect(
        createHTTPQueryParam(
          {},
          { data: undefined },
          { data: { key: "value", absent: undefined } },
          { type: "metadata", data: { empty: "", zero: 0, disabled: false, absent: undefined } },
        ),
      ).toBe("key=value&metadata.empty=&metadata.zero=0&metadata.disabled=false");
    });

    it("lets later groups replace duplicate keys without conflating ordinary and metadata keys", () => {
      const first = Object.freeze({ key: "first" });
      expect(
        createHTTPQueryParam(
          { data: first },
          { data: { key: "metadata" }, type: "metadata" },
          { data: { key: "last" } },
          { data: { key: undefined } },
        ),
      ).toBe("key=last&metadata.key=metadata");
      expect(first).toEqual({ key: "first" });
    });
  });

  describe("state option values", () => {
    it.each([
      [StateConsistencyEnum.CONSISTENCY_EVENTUAL, "eventual"],
      [StateConsistencyEnum.CONSISTENCY_STRONG, "strong"],
      [StateConsistencyEnum.CONSISTENCY_UNSPECIFIED, undefined],
      [undefined, undefined],
    ] as const)("maps consistency %s to %s", (input, expected) => {
      expect(getStateConsistencyValue(input)).toBe(expected);
    });

    it.each([
      [StateConcurrencyEnum.CONCURRENCY_FIRST_WRITE, "first-write"],
      [StateConcurrencyEnum.CONCURRENCY_LAST_WRITE, "last-write"],
      [StateConcurrencyEnum.CONCURRENCY_UNSPECIFIED, undefined],
      [undefined, undefined],
    ] as const)("maps concurrency %s to %s", (input, expected) => {
      expect(getStateConcurrencyValue(input)).toBe(expected);
    });
  });

  describe("createConfigurationType", () => {
    it("converts an empty configuration dictionary", () => {
      expect(createConfigurationType({})).toEqual({});
    });

    it("copies item metadata instead of exposing the response's mutable map", () => {
      const item = create(ConfigurationItemSchema, {
        value: "original",
        version: "v1",
        metadata: { tenant: "original" },
      });
      const result = createConfigurationType({ key: item });
      expect(result.key.metadata).not.toBe(item.metadata);

      item.value = "changed";
      item.metadata.tenant = "changed";

      expect(result).toEqual({
        key: { key: "key", value: "original", version: "v1", metadata: { tenant: "original" } },
      });
    });

    it("converts a dictionary to a configuration type", () => {
      const item1 = create(ConfigurationItemSchema, { value: "value1", version: "v1", metadata: { m1: "mv1" } });
      const item2 = create(ConfigurationItemSchema, { value: "value2", version: "v2", metadata: { m2: "mv2" } });

      const m: { [key: string]: ConfigurationItem } = {
        key1: item1,
        key2: item2,
      };

      const config = createConfigurationType(m);
      expect(config).toEqual({
        key1: {
          key: "key1",
          value: "value1",
          metadata: {
            m1: "mv1",
          },
          version: "v1",
        },
        key2: {
          key: "key2",
          value: "value2",
          metadata: {
            m2: "mv2",
          },
          version: "v2",
        },
      });
    });
  });

  describe("getContentType", () => {
    it.each([true, false, 0, 42, -0.5])("returns text/plain for the primitive %s", (value) => {
      expect(getContentType(value)).toBe("text/plain");
    });

    it.each([Buffer.from([0, 255]), new Int8Array([-1, 1]), new ArrayBuffer(2)])(
      "returns application/octet-stream for binary data %p",
      (value) => {
        expect(getContentType(value)).toBe("application/octet-stream");
      },
    );

    it("falls back to binary content for an unnamed class instance", () => {
      const value = new (class {
        value = 1;
      })();
      expect(value.constructor.name).toBe("");
      expect(getContentType(value)).toBe("application/octet-stream");
    });

    it("should return text/plain for a string", () => {
      expect(getContentType("foobar")).toEqual("text/plain");
    });

    it("should return application/octet-stream for a buffer", () => {
      const payload = new Uint8Array(0.01 * 1024 * 1024);
      expect(getContentType(payload)).toEqual("application/octet-stream");
    });

    it("should return application/json for a JSON valid string array", () => {
      const payload = ["a", "b", "c"];
      expect(getContentType(payload)).toEqual("application/json");
    });

    it("should return application/json for a JSON valid number array", () => {
      const payload = [1, 2, 3];
      expect(getContentType(payload)).toEqual("application/json");
    });

    it("should return application/json for an object", () => {
      expect(getContentType({ foo: "bar" })).toEqual("application/json");
    });

    it("should return application/cloudevents+json for a CloudEvent", () => {
      const validCloudEvents = [
        {
          specversion: "1.0",
          type: "com.github.pull_request.opened",
          source: "https://github.com/cloudevents/spec/pull",
          subject: "123",
          id: "A234-1234-1234",
          time: "2018-04-05T17:31:00Z",
          comexampleextension1: "value",
          comexampleothervalue: 5,
          datacontenttype: "text/xml",
          data: '<much wow="xml"/>',
        },
        {
          specversion: "1.0",
          type: "com.github.pull_request.opened",
          source: "https://github.com/cloudevents/spec/pull",
          id: "A234-1234-1234",
        },
      ];

      validCloudEvents.forEach((cloudEvent) => {
        expect(getContentType(cloudEvent)).toEqual("application/cloudevents+json");
      });

      const invalidCloudEvents = [
        {
          specversion: "1.0",
          type: "com.github.pull_request.opened",
          id: "A234-1234-1234",
        },
        {
          type: "com.github.pull_request.opened",
          source: "https://github.com/cloudevents/spec/pull",
          id: "A234-1234-1234",
        },
        {
          foo: "bar",
        },
      ];

      invalidCloudEvents.forEach((cloudEvent) => {
        expect(getContentType(cloudEvent)).toEqual("application/json");
      });
    });
  });

  describe("getBulkPublishEntries", () => {
    it("returns no entries for an empty batch", () => {
      expect(getBulkPublishEntries([], "application/custom")).toEqual([]);
    });

    it("uses the default content type for raw messages and entries without an explicit type", () => {
      const messages = ["raw", { value: 1 }, { event: "wrapped" }, { event: "empty type", contentType: "" }];
      const entries = getBulkPublishEntries(messages, "application/custom");

      expect(entries).toEqual(
        ["raw", { value: 1 }, "wrapped", "empty type"].map((event) => ({
          entryID: expect.any(String),
          event,
          contentType: "application/custom",
          metadata: {},
        })),
      );
      expect(new Set(entries.map((entry) => entry.entryID)).size).toBe(messages.length);
    });

    it("preserves explicit entry fields over defaults without mutating the message", () => {
      const message = Object.freeze({
        entryID: "provided",
        event: Object.freeze({ value: 1 }),
        contentType: "application/explicit",
        metadata: Object.freeze({ tenant: "test" }),
      });
      const [entry] = getBulkPublishEntries([message], "application/default");

      expect(entry).toEqual(message);
      expect(entry).not.toBe(message);
      expect(entry.event).toBe(message.event);
      expect(entry.metadata).toBe(message.metadata);
    });

    it("fills empty entry IDs and content types and gives each entry its own default metadata", () => {
      const messages = [Object.freeze({ entryID: "", event: "", contentType: "" }), ""];
      const entries = getBulkPublishEntries(messages);

      for (const entry of entries) {
        expect(entry).toEqual({
          entryID: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
          event: "",
          contentType: "text/plain",
          metadata: {},
        });
      }
      expect(entries[0].entryID).not.toBe(entries[1].entryID);
      expect(entries[0].metadata).not.toBe(entries[1].metadata);
    });

    it("returns correct responses for string and object array", () => {
      const testCases = [
        {
          input: ["foo", "bar"],
          expectedContentType: "text/plain",
        },
        {
          input: [{ foo: "bar" }, { bar: "foo" }],
          expectedContentType: "application/json",
        },
      ];

      testCases.forEach((testCase) => {
        const entries = getBulkPublishEntries(testCase.input);
        expect(entries.length).toEqual(testCase.input.length);
        entries.forEach((entry) => {
          expect(testCase.input.includes(entry.event as any)).toBeTruthy();
          expect(entry.metadata).toEqual({});
          expect(entry.contentType).toEqual(testCase.expectedContentType);
          expect(entry.entryID.length).toBeGreaterThan(0);
          expect(entries.filter((e) => e.entryID === entry.entryID).length).toEqual(1);
        });
      });
    });

    it("returns correct responses for explicit bulk publish entries", () => {
      const input = [
        {
          entryID: "entry1",
          event: "foo",
          metadata: { key1: "value1" },
          contentType: "text/plain",
        },
        {
          entryID: "entry2",
          event: { foo: "bar" },
          metadata: { key2: "value2" },
          contentType: "application/json",
        },
        {
          event: "baz",
        },
      ];

      const entries = getBulkPublishEntries(input);
      expect(entries.length).toEqual(input.length);
      entries.forEach((entry) => {
        const inputEntry = input.find((e) => e.event === entry.event);
        expect(inputEntry).toBeDefined();
        expect(entry.metadata).toEqual(inputEntry?.metadata ?? {});
        expect(entry.contentType).toEqual(inputEntry?.contentType ?? getContentType(entry.event));
        expect(entry.entryID).toEqual(inputEntry?.entryID ?? expect.any(String));
      });
    });
  });

  describe("getBulkPublishResponse", () => {
    const entries: PubSubBulkPublishEntry[] = [
      {
        entryID: "entry1",
        event: "foo",
        metadata: { key1: "value1" },
        contentType: "text/plain",
      },
      {
        entryID: "entry2",
        event: { foo: "bar" },
        metadata: { key2: "value2" },
        contentType: "application/json",
      },
    ];

    it("returns no failed messages after a successful publish or for an empty failed request", () => {
      expect(getBulkPublishResponse({ entries, response: { failedEntries: [] } })).toEqual({ failedMessages: [] });
      expect(getBulkPublishResponse({ entries: [], error: new Error("request failed") })).toEqual({
        failedMessages: [],
      });
    });

    it("ignores unknown entry IDs while retaining known failures in response order", () => {
      const response = getBulkPublishResponse({
        entries,
        response: {
          failedEntries: [
            { entryID: "unknown", error: "not in the request" },
            { entryID: "entry2", error: "second failed" },
            { entryID: "entry1", error: "first failed" },
          ],
        },
      });

      expect(response.failedMessages).toEqual([
        { message: entries[1], error: new Error("second failed") },
        { message: entries[0], error: new Error("first failed") },
      ]);
      expect(response.failedMessages[0].message).toBe(entries[1]);
      expect(response.failedMessages[1].message).toBe(entries[0]);
    });

    it("returns response with a common error", () => {
      const error = new Error("test error");
      const response = getBulkPublishResponse({ entries: entries, error: error });
      expect(response.failedMessages.length).toEqual(entries.length);
      response.failedMessages.forEach((failedMessage) => {
        expect(entries.includes(failedMessage.message)).toBeTruthy();
        expect(failedMessage.error).toEqual(error);
      });
    });

    it("returns response with individual errors", () => {
      const apiResponse: PubSubBulkPublishApiResponse = {
        failedEntries: [
          {
            entryID: "entry1",
            error: "test error 1",
          },
        ],
      };

      const response = getBulkPublishResponse({ entries: entries, response: apiResponse });
      expect(response.failedMessages.length).toEqual(1);
      expect(response.failedMessages[0].message).toEqual(entries[0]);
      expect(response.failedMessages[0].error).toEqual(new Error(apiResponse.failedEntries[0].error));
    });

    it("maps daprd HTTP failedEntries that use entryId (not entryID)", () => {
      // daprd serializes the field as "entryId"; matching only "entryID" drops failures.
      const response = getBulkPublishResponse({
        entries,
        response: {
          failedEntries: [
            { entryId: "entry1", error: "kafka: Failed to deliver 1 messages" },
            { entryId: "entry2", error: "kafka: Failed to deliver 1 messages" },
          ],
        },
      });

      expect(response.failedMessages).toHaveLength(2);
      expect(response.failedMessages[0].message).toBe(entries[0]);
      expect(response.failedMessages[1].message).toBe(entries[1]);
      expect(response.failedMessages[0].error.message).toBe("kafka: Failed to deliver 1 messages");
    });
  });

  describe("getClientOptions", () => {
    afterEach(() => jest.restoreAllMocks());

    it("preserves explicit false/empty options and custom components without mutating the input", () => {
      const defaultToken = jest.spyOn(Settings, "getDefaultApiToken").mockReturnValue("default-token");
      const input: DaprClientOptions = Object.freeze({
        daprHost: "localhost",
        daprPort: "3500",
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        isKeepAlive: false,
        daprApiToken: "",
        logger: { level: LogLevel.Error },
        actor: {},
        serializer: { serialize: jest.fn(), deserialize: jest.fn() },
        maxBodySizeMb: 16,
      });

      const result = getClientOptions(input, CommunicationProtocolEnum.GRPC, { level: LogLevel.Debug });

      expect(result).toStrictEqual(input);
      expect(result).not.toBe(input);
      expect(result.logger).toBe(input.logger);
      expect(result.actor).toBe(input.actor);
      expect(result.serializer).toBe(input.serializer);
      expect(defaultToken).not.toHaveBeenCalled();
    });

    it("uses the supplied defaults and configured API token when options are omitted", () => {
      const defaultToken = jest.spyOn(Settings, "getDefaultApiToken").mockReturnValue("default-token");
      const logger = { level: LogLevel.Error };

      const result = getClientOptions(undefined, CommunicationProtocolEnum.GRPC, logger);

      expect(result).toEqual({
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        logger,
        daprApiToken: "default-token",
      });
      expect(result.logger).toBe(logger);
      expect(defaultToken).toHaveBeenCalledTimes(1);
    });

    it("returns correct Dapr Client Options for provided options", () => {
      const inOptions: DaprClientOptions = {
        daprHost: "localhost",
        daprPort: "50001",
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        isKeepAlive: true,
        logger: { level: LogLevel.Error },
        maxBodySizeMb: 10,
      };
      const options = getClientOptions(inOptions, CommunicationProtocolEnum.HTTP, undefined);
      expect(options).toEqual(inOptions);
    });

    it("returns correct Dapr Client Options when host not provided", () => {
      const inOptions: Partial<DaprClientOptions> = {
        daprPort: "50001",
        communicationProtocol: CommunicationProtocolEnum.GRPC,
      };

      const options = getClientOptions(inOptions, CommunicationProtocolEnum.HTTP, { level: LogLevel.Error });
      const expectedOptions: Partial<DaprClientOptions> = {
        daprPort: inOptions.daprPort,
        communicationProtocol: inOptions.communicationProtocol,
        logger: { level: LogLevel.Error },
      };
      expect(options).toEqual(expectedOptions);
    });

    it("returns correct Dapr Client Options when host and port not provided", () => {
      const inOptions: Partial<DaprClientOptions> = {
        communicationProtocol: CommunicationProtocolEnum.GRPC,
      };
      const options = getClientOptions(inOptions, CommunicationProtocolEnum.HTTP, undefined);
      const expectedOptions: Partial<DaprClientOptions> = {
        communicationProtocol: CommunicationProtocolEnum.GRPC,
      };
      expect(options).toEqual(expectedOptions);
    });

    it("returns correct Dapr Client Options when token provided in constructor", () => {
      const inOptions: Partial<DaprClientOptions> = {
        daprApiToken: "token",
      };
      const options = getClientOptions(inOptions, CommunicationProtocolEnum.HTTP, undefined);
      expect(options.daprApiToken).toEqual("token");
    });

    it("returns correct Dapr Client Options when token provided in env variable", () => {
      const oldToken = process.env.DAPR_API_TOKEN;
      process.env.DAPR_API_TOKEN = "envtoken";
      const options = getClientOptions(undefined, CommunicationProtocolEnum.HTTP, undefined);
      expect(options.daprApiToken).toEqual("envtoken");
      process.env.DAPR_API_TOKEN = oldToken;
    });

    it("returns correct Dapr Client Options when token provided both in constructor and in env variable", () => {
      process.env.DAPR_API_TOKEN = "envtoken";

      const inOptions: Partial<DaprClientOptions> = {
        daprApiToken: "token",
      };
      const options = getClientOptions(inOptions, CommunicationProtocolEnum.HTTP, undefined);

      expect(options.daprApiToken).toEqual("token");

      delete process.env.DAPR_API_TOKEN;
    });

    it("returns correct Dapr Client Options when undefined options provided", () => {
      const options = getClientOptions(undefined, CommunicationProtocolEnum.GRPC, undefined);
      const expectedOptions: Partial<DaprClientOptions> = {
        communicationProtocol: CommunicationProtocolEnum.GRPC,
      };
      expect(options).toEqual(expectedOptions);
    });

    it("returns correct Dapr Client Options when undefined options provided and default HTTP communication", () => {
      const options = getClientOptions(undefined, CommunicationProtocolEnum.HTTP, undefined);
      const expectedOptions: Partial<DaprClientOptions> = {
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      };
      expect(options).toEqual(expectedOptions);
    });
  });

  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    });
    return { promise, resolve, reject };
  }

  describe("test correct client instantiation", () => {
    let client: DaprClient;
    const daprHost = "127.0.0.1";
    const daprGrpcPort = "50000";
    const daprHttpPort = "3500";

    // We need to start listening on some endpoints already
    // this because Dapr is not dynamic and registers endpoints on boot
    // we put a timeout of 10s since it takes around 4s for Dapr to boot up

    afterAll(async () => {
      await client.stop();
    });

    it("should give preference to host and port in constructor arguments over endpoint environment variables ", async () => {
      process.env.DAPR_HTTP_ENDPOINT = "https://httpdomain.com";
      process.env.DAPR_GRPC_ENDPOINT = "https://grpcdomain.com";

      // HTTP
      client = new DaprClient({
        daprHost,
        daprPort: daprHttpPort,
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(daprHost);
      expect(client.options.daprPort).toEqual(daprHttpPort);

      // GRPC
      client = new DaprClient({
        daprHost,
        daprPort: daprGrpcPort,
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(daprHost);
      expect(client.options.daprPort).toEqual(daprGrpcPort);
    });

    it("should give preference to port with no host in constructor arguments over environment variables ", async () => {
      process.env.DAPR_HTTP_ENDPOINT = "https://httpdomain.com";
      process.env.DAPR_GRPC_ENDPOINT = "https://grpcdomain.com";

      // HTTP
      client = new DaprClient({
        daprPort: daprHttpPort,
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(Settings.getDefaultHost());
      expect(client.options.daprPort).toEqual(daprHttpPort);

      // GRPC
      client = new DaprClient({
        daprPort: daprGrpcPort,
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(Settings.getDefaultHost());
      expect(client.options.daprPort).toEqual(daprGrpcPort);
    });

    it("should give preference to host with no port in constructor arguments over environment variables ", async () => {
      process.env.DAPR_HTTP_ENDPOINT = "https://httpdomain.com";
      process.env.DAPR_GRPC_ENDPOINT = "https://grpcdomain.com";

      // HTTP
      client = new DaprClient({
        daprHost: daprHost,
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(daprHost);
      expect(client.options.daprPort).toEqual(Settings.getDefaultPort(CommunicationProtocolEnum.HTTP));

      // GRPC
      client = new DaprClient({
        daprHost: daprHost,
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(daprHost);
      expect(client.options.daprPort).toEqual(Settings.getDefaultPort(CommunicationProtocolEnum.GRPC));
    });

    it("should use environment variable endpoint for HTTP", async () => {
      process.env.DAPR_HTTP_ENDPOINT = "https://httpdomain.com";
      process.env.DAPR_GRPC_ENDPOINT = "https://grpcdomain.com";
      client = new DaprClient({
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual("httpdomain.com");
      expect(client.options.daprPort).toEqual("443");
    });

    it("should use environment variable endpoint for GRPC", async () => {
      process.env.DAPR_HTTP_ENDPOINT = "https://httpdomain.com";
      process.env.DAPR_GRPC_ENDPOINT = "https://grpcdomain.com";
      client = new DaprClient({
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual("grpcdomain.com");
      expect(client.options.daprPort).toEqual("443");
    });

    it("should use default host and port when no other parameters provided", async () => {
      process.env.DAPR_HTTP_ENDPOINT = "";
      process.env.DAPR_GRPC_ENDPOINT = "";

      // HTTP
      client = new DaprClient({
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(Settings.getDefaultHost());
      expect(client.options.daprPort).toEqual(Settings.getDefaultPort(CommunicationProtocolEnum.HTTP));

      // GRPC
      client = new DaprClient({
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        isKeepAlive: false,
      });

      expect(client.options.daprHost).toEqual(Settings.getDefaultHost());
      expect(client.options.daprPort).toEqual(Settings.getDefaultPort(CommunicationProtocolEnum.GRPC));
    });
  });
});

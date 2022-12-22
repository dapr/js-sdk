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

import { ConfigurationItem } from "../../../src/proto/dapr/proto/common/v1/common_pb";
import {
  createGRPCMetadata,
  createHTTPMetadataQueryParam,
  createConfigurationType,
  getContentType,
  getBulkPublishEntries,
  getBulkPublishResponse,
} from "../../../src/utils/Client.util";
import { Map } from "google-protobuf";
import exp from "constants";
import { PubSubBulkPublishEntry } from "../../../src/types/pubsub/PubSubBulkPublishEntry.type";
import { PubSubBulkPublishApiResponse } from "../../../src/types/pubsub/PubSubBulkPublishApiResponse.type";

describe("Client.util", () => {
  describe("getGRPCMetadata", () => {
    it("converts a KeyValueType to a grpc.Metadata object", () => {
      const metadata = {
        key1: "value1",
        key2: "value2",
      };
      const grpcMetadata = createGRPCMetadata(metadata);
      expect(grpcMetadata.get("key1")).toEqual(["value1"]);
      expect(grpcMetadata.get("key2")).toEqual(["value2"]);
    });

    it("converts a KeyValueType to a grpc.Metadata object with empty metadata", () => {
      const metadata = {};
      const grpcMetadata = createGRPCMetadata(metadata);
      expect(grpcMetadata.toJSON()).toEqual({});
    });

    it("converts a KeyValueType to a HTTP query parameters with no metadata", () => {
      const grpcMetadata = createGRPCMetadata();
      expect(grpcMetadata.toJSON()).toEqual({});
    });

    it("converts a KeyValueType to a HTTP query parameters with undefined metadata", () => {
      const grpcMetadata = createGRPCMetadata(undefined);
      expect(grpcMetadata.toJSON()).toEqual({});
    });
  });
  describe("getHTTPMetadataQueryParam", () => {
    it("converts a KeyValueType to a HTTP query parameters", () => {
      const metadata = {
        key1: "value1",
        key2: "value2",
      };
      const queryParam = createHTTPMetadataQueryParam(metadata);
      expect(queryParam).toEqual("metadata.key1=value1&metadata.key2=value2");
    });

    it("converts a KeyValueType to a HTTP query parameters with empty metadata", () => {
      const metadata = {};
      const queryParam = createHTTPMetadataQueryParam(metadata);
      expect(queryParam).toEqual("");
    });

    it("converts a KeyValueType to a HTTP query parameters with no metadata", () => {
      const queryParam = createHTTPMetadataQueryParam();
      expect(queryParam).toEqual("");
    });

    it("converts a KeyValueType to a HTTP query parameters with undefined metadata", () => {
      const queryParam = createHTTPMetadataQueryParam(undefined);
      expect(queryParam).toEqual("");
    });

    it("encodes the query parameters", () => {
      const metadata = {
        "key&with=special!ch#r#cters": "value1&value2",
        key00: "value3 value4",
      };
      const queryParam = createHTTPMetadataQueryParam(metadata);
      expect(queryParam).toEqual(
        "metadata.key%26with%3Dspecial!ch%23r%23cters=value1%26value2&metadata.key00=value3%20value4",
      );
    });
  });
  describe("createConfigurationType", () => {
    it("converts a dictionary to a configuration type", () => {
      const item1 = new ConfigurationItem();
      item1.setValue("value1");
      item1.setVersion("v1");
      item1.getMetadataMap().set("m1", "mv1");

      const item2 = new ConfigurationItem();
      item2.setValue("value2");
      item2.setVersion("v2");
      item2.getMetadataMap().set("m2", "mv2");

      const m: Map<string, ConfigurationItem> = new Map([
        ["key1", item1],
        ["key2", item2],
      ]);

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
    it("returns text/plain for a string", () => {
      expect(getContentType("foobar")).toEqual("text/plain");
    });

    it("returns application/json for an object", () => {
      expect(getContentType({ foo: "bar" })).toEqual("application/json");
    });

    it("returns application/cloudevents+json for a CloudEvent", () => {
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

    it("returns response with a common error", () => {
      const error = new Error("test error");
      const response = getBulkPublishResponse({ entries: entries, error: error });
      expect(response.failedEntries.length).toEqual(entries.length);
      response.failedEntries.forEach((failedEntry) => {
        expect(entries.includes(failedEntry.entry)).toBeTruthy();
        expect(failedEntry.error).toEqual(error);
      });
    });

    it("returns response with individual errors", () => {
      const apiResponse: PubSubBulkPublishApiResponse = {
        statuses: [
          {
            entryID: "entry1",
            status: "FAIL",
            error: "test error 1",
          },
        ],
      };

      const response = getBulkPublishResponse({ entries: entries, response: apiResponse });
      expect(response.failedEntries.length).toEqual(1);
      expect(response.failedEntries[0].entry).toEqual(entries[0]);
      expect(response.failedEntries[0].error).toEqual(new Error(apiResponse.statuses[0].error));
    });
  });
});

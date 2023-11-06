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
  addMetadataToMap,
  createConfigurationType,
  getContentType,
  getBulkPublishEntries,
  getBulkPublishResponse,
  getClientOptions,
  createHTTPQueryParam,
  parseEndpoint,
} from "../../../src/utils/Client.util";
import { Map } from "google-protobuf";
import { PubSubBulkPublishEntry } from "../../../src/types/pubsub/PubSubBulkPublishEntry.type";
import { PubSubBulkPublishApiResponse } from "../../../src/types/pubsub/PubSubBulkPublishApiResponse.type";
import { CommunicationProtocolEnum, DaprClientOptions, LogLevel } from "../../../src";

describe("Client.util", () => {
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
  });

  describe("getClientOptions", () => {
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
      const expectedOptions: Partial<DaprClientOptions> = inOptions;
      expectedOptions.daprHost = "127.0.0.1";
      expectedOptions.logger = { level: LogLevel.Error };
      expect(options).toEqual(expectedOptions);
    });

    it("returns correct Dapr Client Options when host and port not provided", () => {
      const inOptions: Partial<DaprClientOptions> = {
        communicationProtocol: CommunicationProtocolEnum.GRPC,
      };
      const options = getClientOptions(inOptions, CommunicationProtocolEnum.HTTP, undefined);
      const expectedOptions: Partial<DaprClientOptions> = inOptions;
      expectedOptions.daprHost = "127.0.0.1";
      expectedOptions.daprPort = "50001";
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
        daprHost: "127.0.0.1",
        daprPort: "50001",
        communicationProtocol: CommunicationProtocolEnum.GRPC,
      };
      expect(options).toEqual(expectedOptions);
    });

    it("returns correct Dapr Client Options when undefined options provided and default HTTP communication", () => {
      const options = getClientOptions(undefined, CommunicationProtocolEnum.HTTP, undefined);
      const expectedOptions: Partial<DaprClientOptions> = {
        daprHost: "127.0.0.1",
        daprPort: "3500",
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      };
      expect(options).toEqual(expectedOptions);
    });
  });

  describe("parseEndpoint", () => {
    const testCases = [
      { endpoint: ":5000", scheme: "http", host: "localhost", port: "5000" },
      {
        endpoint: ":5000/v1/dapr",
        scheme: "http",
        host: "localhost",
        port: "5000",
      },

      { endpoint: "localhost", scheme: "http", host: "localhost", port: "80" },
      {
        endpoint: "localhost/v1/dapr",
        scheme: "http",
        host: "localhost",
        port: "80",
      },
      {
        endpoint: "localhost:5000",
        scheme: "http",
        host: "localhost",
        port: "5000",
      },
      {
        endpoint: "localhost:5000/v1/dapr",
        scheme: "http",
        host: "localhost",
        port: "5000",
      },

      {
        endpoint: "http://localhost",
        scheme: "http",
        host: "localhost",
        port: "80",
      },
      {
        endpoint: "http://localhost/v1/dapr",
        scheme: "http",
        host: "localhost",
        port: "80",
      },
      {
        endpoint: "http://localhost:5000",
        scheme: "http",
        host: "localhost",
        port: "5000",
      },
      {
        endpoint: "http://localhost:5000/v1/dapr",
        scheme: "http",
        host: "localhost",
        port: "5000",
      },

      {
        endpoint: "https://localhost",
        scheme: "https",
        host: "localhost",
        port: "443",
      },
      {
        endpoint: "https://localhost/v1/dapr",
        scheme: "https",
        host: "localhost",
        port: "443",
      },
      {
        endpoint: "https://localhost:5000",
        scheme: "https",
        host: "localhost",
        port: "5000",
      },
      {
        endpoint: "https://localhost:5000/v1/dapr",
        scheme: "https",
        host: "localhost",
        port: "5000",
      },

      { endpoint: "127.0.0.1", scheme: "http", host: "127.0.0.1", port: "80" },
      {
        endpoint: "127.0.0.1/v1/dapr",
        scheme: "http",
        host: "127.0.0.1",
        port: "80",
      },
      {
        endpoint: "127.0.0.1:5000",
        scheme: "http",
        host: "127.0.0.1",
        port: "5000",
      },
      {
        endpoint: "127.0.0.1:5000/v1/dapr",
        scheme: "http",
        host: "127.0.0.1",
        port: "5000",
      },

      {
        endpoint: "http://127.0.0.1",
        scheme: "http",
        host: "127.0.0.1",
        port: "80",
      },
      {
        endpoint: "http://127.0.0.1/v1/dapr",
        scheme: "http",
        host: "127.0.0.1",
        port: "80",
      },
      {
        endpoint: "http://127.0.0.1:5000",
        scheme: "http",
        host: "127.0.0.1",
        port: "5000",
      },
      {
        endpoint: "http://127.0.0.1:5000/v1/dapr",
        scheme: "http",
        host: "127.0.0.1",
        port: "5000",
      },

      {
        endpoint: "https://127.0.0.1",
        scheme: "https",
        host: "127.0.0.1",
        port: "443",
      },
      {
        endpoint: "https://127.0.0.1/v1/dapr",
        scheme: "https",
        host: "127.0.0.1",
        port: "443",
      },
      {
        endpoint: "https://127.0.0.1:5000",
        scheme: "https",
        host: "127.0.0.1",
        port: "5000",
      },
      {
        endpoint: "https://127.0.0.1:5000/v1/dapr",
        scheme: "https",
        host: "127.0.0.1",
        port: "5000",
      },

      {
        endpoint: "[2001:db8:1f70:0:999:de8:7648:6e8]",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "80",
      },
      {
        endpoint: "[2001:db8:1f70:0:999:de8:7648:6e8]/v1/dapr",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "80",
      },
      {
        endpoint: "[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "5000",
      },
      {
        endpoint: "[2001:db8:1f70:0:999:de8:7648:6e8]:5000/v1/dapr",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "5000",
      },

      {
        endpoint: "http://[2001:db8:1f70:0:999:de8:7648:6e8]",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "80",
      },
      {
        endpoint: "http://[2001:db8:1f70:0:999:de8:7648:6e8]/v1/dapr",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "80",
      },
      {
        endpoint: "http://[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "5000",
      },
      {
        endpoint: "http://[2001:db8:1f70:0:999:de8:7648:6e8]:5000/v1/dapr",
        scheme: "http",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "5000",
      },

      {
        endpoint: "https://[2001:db8:1f70:0:999:de8:7648:6e8]",
        scheme: "https",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "443",
      },
      {
        endpoint: "https://[2001:db8:1f70:0:999:de8:7648:6e8]/v1/dapr",
        scheme: "https",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "443",
      },
      {
        endpoint: "https://[2001:db8:1f70:0:999:de8:7648:6e8]:5000",
        scheme: "https",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "5000",
      },
      {
        endpoint: "https://[2001:db8:1f70:0:999:de8:7648:6e8]:5000/v1/dapr",
        scheme: "https",
        host: "2001:db8:1f70:0:999:de8:7648:6e8",
        port: "5000",
      },

      { endpoint: "domain.com", scheme: "http", host: "domain.com", port: "80" },
      {
        endpoint: "domain.com/v1/grpc",
        scheme: "http",
        host: "domain.com",
        port: "80",
      },
      {
        endpoint: "domain.com:5000",
        scheme: "http",
        host: "domain.com",
        port: "5000",
      },
      {
        endpoint: "domain.com:5000/v1/dapr",
        scheme: "http",
        host: "domain.com",
        port: "5000",
      },

      {
        endpoint: "http://domain.com",
        scheme: "http",
        host: "domain.com",
        port: "80",
      },
      {
        endpoint: "http://domain.com/v1/dapr",
        scheme: "http",
        host: "domain.com",
        port: "80",
      },
      {
        endpoint: "http://domain.com:5000",
        scheme: "http",
        host: "domain.com",
        port: "5000",
      },
      {
        endpoint: "http://domain.com:5000/v1/dapr",
        scheme: "http",
        host: "domain.com",
        port: "5000",
      },

      {
        endpoint: "https://domain.com",
        scheme: "https",
        host: "domain.com",
        port: "443",
      },
      {
        endpoint: "https://domain.com/v1/dapr",
        scheme: "https",
        host: "domain.com",
        port: "443",
      },
      {
        endpoint: "https://domain.com:5000",
        scheme: "https",
        host: "domain.com",
        port: "5000",
      },
      {
        endpoint: "https://domain.com:5000/v1/dapr",
        scheme: "https",
        host: "domain.com",
        port: "5000",
      },

      {
        endpoint: "abc.domain.com",
        scheme: "http",
        host: "abc.domain.com",
        port: "80",
      },
      {
        endpoint: "abc.domain.com/v1/grpc",
        scheme: "http",
        host: "abc.domain.com",
        port: "80",
      },
      {
        endpoint: "abc.domain.com:5000",
        scheme: "http",
        host: "abc.domain.com",
        port: "5000",
      },
      {
        endpoint: "abc.domain.com:5000/v1/dapr",
        scheme: "http",
        host: "abc.domain.com",
        port: "5000",
      },

      {
        endpoint: "http://abc.domain.com/v1/dapr",
        scheme: "http",
        host: "abc.domain.com",
        port: "80",
      },
      {
        endpoint: "http://abc.domain.com/v1/dapr",
        scheme: "http",
        host: "abc.domain.com",
        port: "80",
      },
      {
        endpoint: "http://abc.domain.com:5000/v1/dapr",
        scheme: "http",
        host: "abc.domain.com",
        port: "5000",
      },
      {
        endpoint: "http://abc.domain.com:5000/v1/dapr/v1/dapr",
        scheme: "http",
        host: "abc.domain.com",
        port: "5000",
      },

      {
        endpoint: "https://abc.domain.com/v1/dapr",
        scheme: "https",
        host: "abc.domain.com",
        port: "443",
      },
      {
        endpoint: "https://abc.domain.com/v1/dapr",
        scheme: "https",
        host: "abc.domain.com",
        port: "443",
      },
      {
        endpoint: "https://abc.domain.com:5000/v1/dapr",
        scheme: "https",
        host: "abc.domain.com",
        port: "5000",
      },
      {
        endpoint: "https://abc.domain.com:5000/v1/dapr/v1/dapr",
        scheme: "https",
        host: "abc.domain.com",
        port: "5000",
      },
    ];

    testCases.forEach(({ endpoint, scheme, host, port }) => {
      it(`should correctly parse ${endpoint}`, () => {
        const result = parseEndpoint(endpoint);
        expect(result[0]).toEqual(scheme);
        expect(result[1]).toEqual(host);
        expect(result[2]).toEqual(port);
      });
    });
  });
});

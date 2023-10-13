/*
Copyright 2023 The Dapr Authors
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

import GRPCClientPubSub from "../../../../src/implementation/Client/GRPCClient/pubsub";
import { PublishEventRequest } from "../../../../src/proto/dapr/proto/runtime/v1/dapr_pb";

describe("grpc/pubsub", () => {
  describe("publish should call publishEvent with correct arguments", () => {
    const getMockClient = (requests: any[]) => {
      const mockPublishEvent = (req: PublishEventRequest, callback: any) => {
        requests.push(req);
        callback(null, {});
      };
      const mockClient = {
        options: () => {
          return { logger: undefined };
        },
        getClient: () => {
          return { publishEvent: mockPublishEvent };
        },
      } as any;
      return mockClient;
    };

    it("should create the correct pubsub request", async () => {
      const requests: PublishEventRequest[] = [];
      const grpcClientPubsub = new GRPCClientPubSub(getMockClient(requests));
      await grpcClientPubsub.publish("my-pubsub", "my-topic", { key: "value" }, { metadata: { mKey: "mValue" } });

      // Check the request
      expect(requests.length).toBe(1);
      const pubsub = requests[0];
      expect(pubsub.getPubsubName()).toBe("my-pubsub");
      expect(pubsub.getTopic()).toBe("my-topic");
      expect(pubsub.getData()).toStrictEqual(Buffer.from(JSON.stringify({ key: "value" })));
      expect(pubsub.getDataContentType()).toBe("application/json");
      expect(pubsub.getMetadataMap().getLength()).toBe(1);
      expect(pubsub.getMetadataMap().get("mKey")).toBe("mValue");
    });

    it("should skip data and content-type when data is not present", async () => {
      const requests: PublishEventRequest[] = [];
      const grpcClientPubsub = new GRPCClientPubSub(getMockClient(requests));
      await grpcClientPubsub.publish("my-pubsub", "my-topic", "", { metadata: { mKey: "mValue" } });

      // Check the request
      expect(requests.length).toBe(1);
      const pubsub = requests[0];
      expect(pubsub.getPubsubName()).toBe("my-pubsub");
      expect(pubsub.getTopic()).toBe("my-topic");
      expect(pubsub.getData()).toStrictEqual("");
      expect(pubsub.getDataContentType()).toBe("");
      expect(pubsub.getMetadataMap().getLength()).toBe(1);
      expect(pubsub.getMetadataMap().get("mKey")).toBe("mValue");
    });

    it("should use the content-type when provided", async () => {
      const requests: PublishEventRequest[] = [];
      const grpcClientPubsub = new GRPCClientPubSub(getMockClient(requests));

      const inData = { key: "value" };
      await grpcClientPubsub.publish("my-pubsub", "my-topic", inData, {
        contentType: "text/plain",
        metadata: { mKey: "mValue" },
      });

      // Check the request
      expect(requests.length).toBe(1);
      const pubsub = requests[0];
      expect(pubsub.getPubsubName()).toBe("my-pubsub");
      expect(pubsub.getTopic()).toBe("my-topic");
      expect(pubsub.getData()).toStrictEqual(Buffer.from(inData.toString()));
      expect(pubsub.getDataContentType()).toBe("text/plain");
      expect(pubsub.getMetadataMap().getLength()).toBe(1);
      expect(pubsub.getMetadataMap().get("mKey")).toBe("mValue");
    });
  });
});

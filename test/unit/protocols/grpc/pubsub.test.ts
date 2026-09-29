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
import { Code, ConnectError } from "@connectrpc/connect";

describe("grpc/pubsub", () => {
  describe("publish should call publishEvent with correct arguments", () => {
    const getMockClient = (requests: any[]) => {
      const mockPublishEvent = async (req: PublishEventRequest) => {
        requests.push(req);
        return {};
      };
      const mockClient = {
        options: { logger: undefined },
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
      expect(pubsub.pubsubName).toBe("my-pubsub");
      expect(pubsub.topic).toBe("my-topic");
      expect(pubsub.data).toStrictEqual(Buffer.from(JSON.stringify({ key: "value" })));
      expect(pubsub.dataContentType).toBe("application/json");
      expect(pubsub.metadata).toEqual({ mKey: "mValue" });
    });

    it("should skip data and content-type when data is not present", async () => {
      const requests: PublishEventRequest[] = [];
      const grpcClientPubsub = new GRPCClientPubSub(getMockClient(requests));
      await grpcClientPubsub.publish("my-pubsub", "my-topic", "", { metadata: { mKey: "mValue" } });

      // Check the request
      expect(requests.length).toBe(1);
      const pubsub = requests[0];
      expect(pubsub.pubsubName).toBe("my-pubsub");
      expect(pubsub.topic).toBe("my-topic");
      expect(pubsub.metadata).toEqual({ mKey: "mValue" });
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
      expect(pubsub.pubsubName).toBe("my-pubsub");
      expect(pubsub.topic).toBe("my-topic");
      expect(pubsub.dataContentType).toBe("text/plain");
      expect(pubsub.metadata).toEqual({ mKey: "mValue" });
    });
  });

  describe("publishBulk should prefer the stable BulkPublishEvent API", () => {
    const getMockClient = (
      bulkPublishEvent: (req: any) => Promise<any>,
      bulkPublishEventAlpha1: (req: any) => Promise<any>,
    ) =>
      ({
        options: { logger: undefined },
        getClient: () => ({ bulkPublishEvent, bulkPublishEventAlpha1 }),
      } as any);

    const messages = [{ hello: "world" }, { hello: "world 2" }];

    it("should call the stable bulkPublishEvent API", async () => {
      const stableRequests: any[] = [];
      const alpha1 = jest.fn();
      const grpcClientPubsub = new GRPCClientPubSub(
        getMockClient(async (req) => {
          stableRequests.push(req);
          return { failedEntries: [] };
        }, alpha1 as any),
      );

      const res = await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages, { mKey: "mValue" });

      expect(res.failedMessages.length).toBe(0);
      expect(alpha1).not.toHaveBeenCalled();
      expect(stableRequests.length).toBe(1);
      expect(stableRequests[0].pubsubName).toBe("my-pubsub");
      expect(stableRequests[0].topic).toBe("my-topic");
      expect(stableRequests[0].entries.length).toBe(2);
      expect(stableRequests[0].metadata).toEqual({ mKey: "mValue" });
    });

    it("should fall back to bulkPublishEventAlpha1 when the stable API is unimplemented", async () => {
      const alpha1Requests: any[] = [];
      const grpcClientPubsub = new GRPCClientPubSub(
        getMockClient(
          async () => {
            throw new ConnectError("unimplemented", Code.Unimplemented);
          },
          async (req) => {
            alpha1Requests.push(req);
            return { failedEntries: [] };
          },
        ),
      );

      const res = await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(0);
      expect(alpha1Requests.length).toBe(1);
      expect(alpha1Requests[0].pubsubName).toBe("my-pubsub");
      expect(alpha1Requests[0].entries.length).toBe(2);
    });

    it("should only probe the stable API once when falling back", async () => {
      const stable = jest.fn(async () => {
        throw new ConnectError("unimplemented", Code.Unimplemented);
      });
      const alpha1 = jest.fn(async () => ({ failedEntries: [] }));
      const grpcClientPubsub = new GRPCClientPubSub(getMockClient(stable as any, alpha1 as any));

      await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages);
      await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(stable).toHaveBeenCalledTimes(1);
      expect(alpha1).toHaveBeenCalledTimes(2);
    });

    it("should not fall back when the stable API fails for another reason", async () => {
      const alpha1 = jest.fn();
      const grpcClientPubsub = new GRPCClientPubSub(
        getMockClient(async () => {
          throw new ConnectError("boom", Code.Internal);
        }, alpha1 as any),
      );

      const res = await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(alpha1).not.toHaveBeenCalled();
      expect(res.failedMessages.length).toBe(2);
    });

    // Dapr forwards unrecognised gRPC methods to service invocation rather than
    // rejecting them with UNIMPLEMENTED, so a pre-1.17 sidecar surfaces the
    // missing RPC as a proxy failure. See dapr/js-sdk#786.
    it("should fall back when the sidecar reports the RPC as a proxy failure", async () => {
      const alpha1Requests: any[] = [];
      const grpcClientPubsub = new GRPCClientPubSub(
        getMockClient(
          async () => {
            throw new ConnectError(
              "failed to proxy request: required metadata dapr-callee-app-id or dapr-app-id not found",
              Code.Unknown,
            );
          },
          async (req) => {
            alpha1Requests.push(req);
            return { failedEntries: [] };
          },
        ),
      );

      const res = await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(0);
      expect(alpha1Requests.length).toBe(1);
    });

    it("should not fall back on an unrelated Unknown error", async () => {
      const alpha1 = jest.fn();
      const grpcClientPubsub = new GRPCClientPubSub(
        getMockClient(async () => {
          throw new ConnectError("redis connection reset", Code.Unknown);
        }, alpha1 as any),
      );

      const res = await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(alpha1).not.toHaveBeenCalled();
      expect(res.failedMessages.length).toBe(2);
    });

    it("should map failed entries returned by the stable API", async () => {
      const grpcClientPubsub = new GRPCClientPubSub(
        getMockClient(
          async (req) => ({
            failedEntries: [{ entryId: req.entries[0].entryId, error: "failed to publish" }],
          }),
          jest.fn() as any,
        ),
      );

      const res = await grpcClientPubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(1);
      expect(res.failedMessages[0].error.message).toBe("failed to publish");
    });
  });
});

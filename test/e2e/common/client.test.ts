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

import { randomUUID } from "crypto";
import { CommunicationProtocolEnum, DaprClient, LogLevel } from "../../../src";
import { LockStatus } from "../../../src/types/lock/UnlockResponse";

const daprHost = "127.0.0.1";
const daprGrpcPort = "50000";
const daprHttpPort = "3500";
const loggerSettings = {
  level: LogLevel.Debug,
};

describe("common/client", () => {
  let httpClient: DaprClient;
  let grpcClient: DaprClient;

  beforeAll(async () => {
    httpClient = new DaprClient(daprHost, daprHttpPort, CommunicationProtocolEnum.HTTP, {
      logger: loggerSettings,
    });
    await httpClient.getDaprClient().getClient();

    grpcClient = new DaprClient(daprHost, daprGrpcPort, CommunicationProtocolEnum.GRPC, {
      logger: loggerSettings,
    });
    await grpcClient.getDaprClient().getClient();
  }, 10 * 1000);

  afterAll(async () => {
    await httpClient.stop();
    await grpcClient.stop();
  });

  // Helper function to run the test for both HTTP and gRPC.
  const runIt = (name: string, fn: (client: DaprClient) => void) => {
    it("http/" + name, () => fn(httpClient));
    it("grpc/" + name, () => fn(grpcClient));
  };

  describe("client", () => {
    runIt("should return isInitialized is true if the sidecar has been started", async (client: DaprClient) => {
      expect(client.getIsInitialized()).toBe(true);
    });
  });

  describe("pubsub", () => {
    const pubSubName = "pubsub-redis";
    const topic = "test-topic";

    const ce = {
      specversion: "1.0",
      type: "com.github.pull.create",
      source: "https://github.com/cloudevents/spec/pull",
      id: "A234-1234-1234",
    };

    runIt("should be able to publish a plain text", async (client: DaprClient) => {
      const res = await client.pubsub.publish(pubSubName, topic, "Hello World");
      expect(res.error).toEqual(undefined);
    });

    runIt("should be able to publish a JSON", async (client: DaprClient) => {
      const res = await client.pubsub.publish(pubSubName, topic, { hello: "world" });
      expect(res.error).toEqual(undefined);
    });

    runIt("should be able to publish a cloud event", async (client: DaprClient) => {
      const res = await client.pubsub.publish(pubSubName, topic, ce);
      expect(res.error).toEqual(undefined);
    });

    runIt("should be able to publish multiple plain text messages", async (client: DaprClient) => {
      const messages = ["Hello World", "Hello World 2"];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(0);
    });

    runIt("should be able to publish multiple JSON messages", async (client: DaprClient) => {
      const messages = [{ hello: "world" }, { hello: "world 2" }];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(0);
    });

    runIt("should be able to publish multiple custom bulk publish messages", async (client: DaprClient) => {
      const messages = [
        {
          entryID: "1",
          event: "Hello World",
          contentType: "text/plain",
        },
        {
          entryID: "2",
          event: { hello: "world" },
          contentType: "application/json",
        },
        {
          entryID: "3",
          event: { ...ce, data: "Hello World", datacontenttype: "text/plain" },
          contentType: "application/cloudevents+json",
        },
      ];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(0);
    });

    runIt("should fail the entire request on duplicate entry IDs", async (client: DaprClient) => {
      const messages = [
        {
          entryID: "1",
          event: "Hello World",
          contentType: "text/plain",
        },
        {
          entryID: "1",
          event: { hello: "world 2" },
          contentType: "application/json",
        },
        {
          entryID: "3",
          event: "Hello World 3",
          contentType: "text/plain",
        },
      ];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(3);
    });
  });

  describe("distributed lock", () => {
    runIt("should be able to acquire a new lock and unlock", async (client: DaprClient) => {
      const resourceId = randomUUID();
      const lock = await client.lock.lock("redislock", resourceId, "owner1", 1000);
      expect(lock.success).toEqual(true);
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.Success);
    });

    runIt("should be not be able to unlock when the lock is not acquired", async (client: DaprClient) => {
      const resourceId = randomUUID();
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.LockDoesNotExist);
    });

    runIt("should be able to acquire a lock after the previous lock is expired", async (client: DaprClient) => {
      const resourceId = randomUUID();
      let lock = await client.lock.lock("redislock", resourceId, "owner1", 5);
      expect(lock.success).toEqual(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      lock = await client.lock.lock("redislock", resourceId, "owner2", 5);
      expect(lock.success).toEqual(false);
    });

    runIt(
      "should not be able to acquire a lock when the same lock is acquired by another owner",
      async (client: DaprClient) => {
        const resourceId = randomUUID();
        const lockOne = await client.lock.lock("redislock", resourceId, "owner1", 5);
        expect(lockOne.success).toEqual(true);
        const lockTwo = await client.lock.lock("redislock", resourceId, "owner2", 5);
        expect(lockTwo.success).toEqual(false);
      },
    );

    runIt(
      "should be able to acquire a lock when a different lock is acquired by another owner",
      async (client: DaprClient) => {
        const lockOne = await client.lock.lock("redislock", randomUUID(), "owner1", 5);
        expect(lockOne.success).toEqual(true);
        const lockTwo = await client.lock.lock("redislock", randomUUID(), "owner2", 5);
        expect(lockTwo.success).toEqual(true);
      },
    );

    runIt(
      "should not be able to acquire a lock when that lock is acquired by another owner/process",
      async (client: DaprClient) => {
        const resourceId = randomUUID();
        const lockOne = await client.lock.lock("redislock", resourceId, "owner3", 5);
        expect(lockOne.success).toEqual(true);
        const lockTwo = await client.lock.lock("redislock", resourceId, "owner4", 5);
        expect(lockTwo.success).toEqual(false);
      },
    );

    runIt(
      "should not be able to unlock a lock when that lock is acquired by another owner/process",
      async (client: DaprClient) => {
        const resourceId = randomUUID();
        const lockOne = await client.lock.lock("redislock", resourceId, "owner5", 5);
        expect(lockOne.success).toEqual(true);
        const unlock = await client.lock.unlock("redislock", resourceId, "owner6");
        expect(unlock.status).toEqual(LockStatus.LockBelongsToOthers);
      },
    );
  });
});

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
import { Network, StartedNetwork, StartedTestContainer } from "testcontainers";
import { DaprContainer, StartedDaprContainer, DAPR_RUNTIME_IMAGE } from "@dapr/testcontainer-node";
import {
  CommunicationProtocolEnum,
  DaprClient,
  LogLevel,
  StateConcurrencyEnum,
  StateConsistencyEnum,
} from "../../../src";
import { sleep } from "../../../src/utils/NodeJS.util";
import { LockStatus } from "../../../src/types/lock/UnlockResponse";
import {
  startRedisContainer,
  startMongoDbContainer,
  buildStateRedisComponent,
  buildPubSubRedisComponent,
  buildLockRedisComponent,
  buildStateMongoDbComponent,
} from "../helpers/containers";

const loggerSettings = {
  level: LogLevel.Debug,
};

describe("common/client/http", () => {
  let network: StartedNetwork;
  let redisContainer: StartedTestContainer;
  let mongoDbContainer: StartedTestContainer;
  let daprContainer: StartedDaprContainer;
  let client: DaprClient;

  beforeAll(async () => {
    network = await new Network().start();
    [redisContainer, mongoDbContainer] = await Promise.all([
      startRedisContainer(network),
      startMongoDbContainer(network),
    ]);

    daprContainer = await new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildStateRedisComponent())
      .withComponent(buildPubSubRedisComponent())
      .withComponent(buildLockRedisComponent())
      .withComponent(buildStateMongoDbComponent())
      .start();

    client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getHttpPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      logger: loggerSettings,
    });
    await client.daprClient.getClient();
  }, 180 * 1000);

  afterAll(async () => {
    await client.stop();
    await daprContainer.stop();
    await mongoDbContainer.stop();
    await redisContainer.stop();
    await network.stop();
  });

  describe("client", () => {
    it("should return isInitialized is true if the sidecar has been started", async () => {
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

    it("should be able to publish a plain text", async () => {
      const res = await client.pubsub.publish(pubSubName, topic, "Hello World");
      expect(res.error).toEqual(undefined);
    });

    it("should be able to publish a JSON", async () => {
      const res = await client.pubsub.publish(pubSubName, topic, { hello: "world" });
      expect(res.error).toEqual(undefined);
    });

    it("should be able to publish a cloud event", async () => {
      const res = await client.pubsub.publish(pubSubName, topic, ce);
      expect(res.error).toEqual(undefined);
    });

    it("should be able to publish multiple plain text messages", async () => {
      const messages = ["Hello World", "Hello World 2"];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(0);
    });

    it("should be able to publish multiple JSON messages", async () => {
      const messages = [{ hello: "world" }, { hello: "world 2" }];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(0);
    });

    it("should be able to publish multiple custom bulk publish messages", async () => {
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

    it("should fail the entire request on duplicate entry IDs", async () => {
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
    it("should be able to acquire a new lock and unlock", async () => {
      const resourceId = randomUUID();
      const lock = await client.lock.lock("redislock", resourceId, "owner1", 1000);
      expect(lock.success).toEqual(true);
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.Success);
    });

    it("should be not be able to unlock when the lock is not acquired", async () => {
      const resourceId = randomUUID();
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.LockDoesNotExist);
    });

    it("should be able to acquire a lock after the previous lock is expired", async () => {
      const resourceId = randomUUID();
      let lock = await client.lock.lock("redislock", resourceId, "owner1", 5);
      expect(lock.success).toEqual(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      lock = await client.lock.lock("redislock", resourceId, "owner2", 5);
      expect(lock.success).toEqual(false);
    });

    it("should not be able to acquire a lock when the same lock is acquired by another owner", async () => {
      const resourceId = randomUUID();
      const lockOne = await client.lock.lock("redislock", resourceId, "owner1", 5);
      expect(lockOne.success).toEqual(true);
      const lockTwo = await client.lock.lock("redislock", resourceId, "owner2", 5);
      expect(lockTwo.success).toEqual(false);
    });

    it("should be able to acquire a lock when a different lock is acquired by another owner", async () => {
      const lockOne = await client.lock.lock("redislock", randomUUID(), "owner1", 5);
      expect(lockOne.success).toEqual(true);
      const lockTwo = await client.lock.lock("redislock", randomUUID(), "owner2", 5);
      expect(lockTwo.success).toEqual(true);
    });

    it("should not be able to acquire a lock when that lock is acquired by another owner/process", async () => {
      const resourceId = randomUUID();
      const lockOne = await client.lock.lock("redislock", resourceId, "owner3", 5);
      expect(lockOne.success).toEqual(true);
      const lockTwo = await client.lock.lock("redislock", resourceId, "owner4", 5);
      expect(lockTwo.success).toEqual(false);
    });

    it("should not be able to unlock a lock when that lock is acquired by another owner/process", async () => {
      const resourceId = randomUUID();
      const lockOne = await client.lock.lock("redislock", resourceId, "owner5", 5);
      expect(lockOne.success).toEqual(true);
      const unlock = await client.lock.unlock("redislock", resourceId, "owner6");
      expect(unlock.status).toEqual(LockStatus.LockBelongsToOthers);
    });
  });

  describe("state", () => {
    const stateStoreName = "state-redis";
    const stateStoreMongoDbName = "state-mongodb";

    beforeEach(async () => {
      await client.state.delete(stateStoreName, "key-1");
      await client.state.delete(stateStoreName, "key-2");
      await client.state.delete(stateStoreName, "key-3");
    });

    it("should be able to save the state", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      const res = await client.state.get(stateStoreName, "key-1");
      expect(res).toEqual("value-1");
    });

    it("should be able to add metadata, etag and options", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
          etag: "1234",
          options: {
            concurrency: StateConcurrencyEnum.CONCURRENCY_FIRST_WRITE,
            consistency: StateConsistencyEnum.CONSISTENCY_STRONG,
          },
          metadata: {
            hello: "world",
            ttlInSeconds: "1",
          },
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      const res1 = await client.state.get(stateStoreName, "key-1");
      expect(res1).toEqual("value-1");

      await sleep(2000);
      const res2 = await client.state.get(stateStoreName, "key-1");
      expect(res2).toBeFalsy();
    });

    it("should be able to save the state with request metadata", async () => {
      await client.state.save(
        stateStoreName,
        [
          {
            key: "key-1",
            value: "value-1",
            metadata: {
              ttlInSeconds: "1",
            },
          },
          {
            key: "key-2",
            value: "value-2",
          },
        ],
        {
          metadata: {
            ttlInSeconds: "3", // this should override the ttl in the state item
          },
        },
      );

      const res1 = await client.state.getBulk(stateStoreName, ["key-1", "key-2"]);
      expect(res1.length).toEqual(2);
      expect(res1.find((r) => r.key === "key-1")?.data).toEqual("value-1");
      expect(res1.find((r) => r.key === "key-2")?.data).toEqual("value-2");

      // wait for the first ttl to expire
      await sleep(1500);

      // key-1 should still be there since its TTL is overridden by the request metadata
      const res2 = await client.state.getBulk(stateStoreName, ["key-1", "key-2"]);
      expect(res2.length).toEqual(2);
      expect(res2.find((r) => r.key === "key-1")?.data).toEqual("value-1");
      expect(res2.find((r) => r.key === "key-2")?.data).toEqual("value-2");

      // wait for the second ttl to expire
      await sleep(2000);

      const res3 = await client.state.getBulk(stateStoreName, ["key-1", "key-2"]);
      expect(res3.length).toEqual(2);
      // HTTP returns undefined, gRPC returns "" for non-existent keys
      expect(res3.find((r) => r.key === "key-1")?.data).toBeFalsy();
      expect(res3.find((r) => r.key === "key-2")?.data).toBeFalsy();
    });

    it("should be able to get the state in bulk", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      const res = await client.state.getBulk(stateStoreName, ["key-3", "key-2"]);

      expect(res).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "key-2", data: "value-2" }),
          expect.objectContaining({ key: "key-3", data: "value-3" }),
        ]),
      );
    });

    it("should be able to delete a key from the state store", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      await client.state.delete(stateStoreName, "key-2");
      const res = await client.state.get(stateStoreName, "key-2");
      expect(res).toEqual("");
    });

    it("should be able to perform a transaction that replaces a key and deletes another", async () => {
      await client.state.transaction(stateStoreName, [
        {
          operation: "upsert",
          request: {
            key: "key-1",
            value: "my-new-data-1",
          },
        },
        {
          operation: "delete",
          request: {
            key: "key-3",
          },
        },
      ]);

      const resTransactionDelete = await client.state.get(stateStoreName, "key-3");
      const resTransactionUpsert = await client.state.get(stateStoreName, "key-1");
      expect(resTransactionDelete).toEqual("");
      expect(resTransactionUpsert).toEqual("my-new-data-1");
    });

    // TODO: Use gRPC describe block when gRPC client supports query state.
    it("should be able to query state", async () => {
      // First save our data
      await client.state.save(stateStoreMongoDbName, [
        {
          key: "key-1",
          value: {
            person: {
              id: 1036,
              org: "Dev Ops",
            },
            city: "Seattle",
            state: "WA",
          },
        },
        {
          key: "key-2",
          value: {
            person: {
              id: 1037,
              org: "Developers",
            },
            city: "Seattle",
            state: "WA",
          },
        },
        {
          key: "key-3",
          value: {
            person: {
              id: 1038,
              org: "Developers",
            },
            city: "Seattle",
            state: "WA",
          },
        },
        {
          key: "key-4",
          value: {
            person: {
              id: 1039,
              org: "Dev Ops",
            },
            city: "Spokane",
            state: "WA",
          },
        },
        {
          key: "key-5",
          value: {
            person: {
              id: 1040,
              org: "Developers",
            },
            city: "Seattle",
            state: "WA",
          },
        },
        {
          key: "key-6",
          value: {
            person: {
              id: 1041,
              org: "Dev Ops",
            },
            city: "Seattle",
            state: "WA",
          },
        },
        {
          key: "key-7",
          value: {
            person: {
              id: 1042,
              org: "Finance",
            },
            city: "Brussels",
            state: "Flemish-Brabant",
          },
        },
        {
          key: "key-8",
          value: {
            person: {
              id: 1043,
              org: "Finance",
            },
            city: "San Francisco",
            state: "CA",
          },
        },
      ]);

      const res = await client.state.query(stateStoreMongoDbName, {
        filter: {
          OR: [
            {
              EQ: { "person.org": "Dev Ops" },
            },
            {
              AND: [
                {
                  EQ: { "person.org": "Finance" },
                },
                {
                  IN: { state: ["CA", "WA"] },
                },
              ],
            },
          ],
        },
        sort: [
          {
            key: "state",
            order: "DESC",
          },
        ],
        page: {
          limit: 10,
        },
      });

      expect(res.results).toBeDefined();
      expect(res.results.length).toEqual(4);
      expect(res.results.map((i) => i.key).indexOf("key-1")).toBeGreaterThan(-1);
      expect(res.results.map((i) => i.key).indexOf("key-4")).toBeGreaterThan(-1);
      expect(res.results.map((i) => i.key).indexOf("key-6")).toBeGreaterThan(-1);
      expect(res.results.map((i) => i.key).indexOf("key-8")).toBeGreaterThan(-1);

      for (let i = 1; i <= 8; i++) {
        await client.state.delete(stateStoreMongoDbName, `key-${i}`);
      }
    });

    it("should return an empty object when result is empty", async () => {
      const result = await client.state.query(stateStoreMongoDbName, {
        filter: { EQ: { state: "statenotfound" } },
        sort: [
          {
            key: "state",
            order: "DESC",
          },
        ],
        page: {
          limit: 10,
        },
      });
      expect(result).toEqual({ results: [] });
    });
  });
});

describe("common/client/grpc", () => {
  let network: StartedNetwork;
  let redisContainer: StartedTestContainer;
  let mongoDbContainer: StartedTestContainer;
  let daprContainer: StartedDaprContainer;
  let client: DaprClient;

  beforeAll(async () => {
    network = await new Network().start();
    [redisContainer, mongoDbContainer] = await Promise.all([
      startRedisContainer(network),
      startMongoDbContainer(network),
    ]);

    daprContainer = await new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildStateRedisComponent())
      .withComponent(buildPubSubRedisComponent())
      .withComponent(buildLockRedisComponent())
      .withComponent(buildStateMongoDbComponent())
      .start();

    client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getGrpcPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      logger: loggerSettings,
    });
    await client.daprClient.getClient();
  }, 180 * 1000);

  afterAll(async () => {
    await client.stop();
    await daprContainer.stop();
    await mongoDbContainer.stop();
    await redisContainer.stop();
    await network.stop();
  });

  describe("client", () => {
    it("should return isInitialized is true if the sidecar has been started", async () => {
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

    it("should be able to publish a plain text", async () => {
      const res = await client.pubsub.publish(pubSubName, topic, "Hello World");
      expect(res.error).toEqual(undefined);
    });

    it("should be able to publish a JSON", async () => {
      const res = await client.pubsub.publish(pubSubName, topic, { hello: "world" });
      expect(res.error).toEqual(undefined);
    });

    it("should be able to publish a cloud event", async () => {
      const res = await client.pubsub.publish(pubSubName, topic, ce);
      expect(res.error).toEqual(undefined);
    });

    it("should be able to publish multiple plain text messages", async () => {
      const messages = ["Hello World", "Hello World 2"];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(0);
    });

    it("should be able to publish multiple JSON messages", async () => {
      const messages = [{ hello: "world" }, { hello: "world 2" }];
      const res = await client.pubsub.publishBulk(pubSubName, topic, messages);
      expect(res.failedMessages.length).toEqual(0);
    });

    it("should be able to publish multiple custom bulk publish messages", async () => {
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

    it("should fail the entire request on duplicate entry IDs", async () => {
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
    it("should be able to acquire a new lock and unlock", async () => {
      const resourceId = randomUUID();
      const lock = await client.lock.lock("redislock", resourceId, "owner1", 1000);
      expect(lock.success).toEqual(true);
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.Success);
    });

    it("should be not be able to unlock when the lock is not acquired", async () => {
      const resourceId = randomUUID();
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.LockDoesNotExist);
    });

    it("should be able to acquire a lock after the previous lock is expired", async () => {
      const resourceId = randomUUID();
      let lock = await client.lock.lock("redislock", resourceId, "owner1", 5);
      expect(lock.success).toEqual(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      lock = await client.lock.lock("redislock", resourceId, "owner2", 5);
      expect(lock.success).toEqual(false);
    });

    it("should not be able to acquire a lock when the same lock is acquired by another owner", async () => {
      const resourceId = randomUUID();
      const lockOne = await client.lock.lock("redislock", resourceId, "owner1", 5);
      expect(lockOne.success).toEqual(true);
      const lockTwo = await client.lock.lock("redislock", resourceId, "owner2", 5);
      expect(lockTwo.success).toEqual(false);
    });

    it("should be able to acquire a lock when a different lock is acquired by another owner", async () => {
      const lockOne = await client.lock.lock("redislock", randomUUID(), "owner1", 5);
      expect(lockOne.success).toEqual(true);
      const lockTwo = await client.lock.lock("redislock", randomUUID(), "owner2", 5);
      expect(lockTwo.success).toEqual(true);
    });

    it("should not be able to acquire a lock when that lock is acquired by another owner/process", async () => {
      const resourceId = randomUUID();
      const lockOne = await client.lock.lock("redislock", resourceId, "owner3", 5);
      expect(lockOne.success).toEqual(true);
      const lockTwo = await client.lock.lock("redislock", resourceId, "owner4", 5);
      expect(lockTwo.success).toEqual(false);
    });

    it("should not be able to unlock a lock when that lock is acquired by another owner/process", async () => {
      const resourceId = randomUUID();
      const lockOne = await client.lock.lock("redislock", resourceId, "owner5", 5);
      expect(lockOne.success).toEqual(true);
      const unlock = await client.lock.unlock("redislock", resourceId, "owner6");
      expect(unlock.status).toEqual(LockStatus.LockBelongsToOthers);
    });
  });

  describe("state", () => {
    const stateStoreName = "state-redis";

    beforeEach(async () => {
      await client.state.delete(stateStoreName, "key-1");
      await client.state.delete(stateStoreName, "key-2");
      await client.state.delete(stateStoreName, "key-3");
    });

    it("should be able to save the state", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      const res = await client.state.get(stateStoreName, "key-1");
      expect(res).toEqual("value-1");
    });

    it("should be able to add metadata, etag and options", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
          etag: "1234",
          options: {
            concurrency: StateConcurrencyEnum.CONCURRENCY_FIRST_WRITE,
            consistency: StateConsistencyEnum.CONSISTENCY_STRONG,
          },
          metadata: {
            hello: "world",
            ttlInSeconds: "1",
          },
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      const res1 = await client.state.get(stateStoreName, "key-1");
      expect(res1).toEqual("value-1");

      await sleep(2000);
      const res2 = await client.state.get(stateStoreName, "key-1");
      expect(res2).toBeFalsy();
    });

    it("should be able to save the state with request metadata", async () => {
      await client.state.save(
        stateStoreName,
        [
          {
            key: "key-1",
            value: "value-1",
            metadata: {
              ttlInSeconds: "1",
            },
          },
          {
            key: "key-2",
            value: "value-2",
          },
        ],
        {
          metadata: {
            ttlInSeconds: "3", // this should override the ttl in the state item
          },
        },
      );

      const res1 = await client.state.getBulk(stateStoreName, ["key-1", "key-2"]);
      expect(res1.length).toEqual(2);
      expect(res1.find((r) => r.key === "key-1")?.data).toEqual("value-1");
      expect(res1.find((r) => r.key === "key-2")?.data).toEqual("value-2");

      // wait for the first ttl to expire
      await sleep(1500);

      // key-1 should still be there since its TTL is overridden by the request metadata
      const res2 = await client.state.getBulk(stateStoreName, ["key-1", "key-2"]);
      expect(res2.length).toEqual(2);
      expect(res2.find((r) => r.key === "key-1")?.data).toEqual("value-1");
      expect(res2.find((r) => r.key === "key-2")?.data).toEqual("value-2");

      // wait for the second ttl to expire
      await sleep(2000);

      const res3 = await client.state.getBulk(stateStoreName, ["key-1", "key-2"]);
      expect(res3.length).toEqual(2);
      // HTTP returns undefined, gRPC returns "" for non-existent keys
      expect(res3.find((r) => r.key === "key-1")?.data).toBeFalsy();
      expect(res3.find((r) => r.key === "key-2")?.data).toBeFalsy();
    });

    it("should be able to get the state in bulk", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      const res = await client.state.getBulk(stateStoreName, ["key-3", "key-2"]);

      expect(res).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "key-2", data: "value-2" }),
          expect.objectContaining({ key: "key-3", data: "value-3" }),
        ]),
      );
    });

    it("should be able to delete a key from the state store", async () => {
      await client.state.save(stateStoreName, [
        {
          key: "key-1",
          value: "value-1",
        },
        {
          key: "key-2",
          value: "value-2",
        },
        {
          key: "key-3",
          value: "value-3",
        },
      ]);

      await client.state.delete(stateStoreName, "key-2");
      const res = await client.state.get(stateStoreName, "key-2");
      expect(res).toEqual("");
    });

    it("should be able to perform a transaction that replaces a key and deletes another", async () => {
      await client.state.transaction(stateStoreName, [
        {
          operation: "upsert",
          request: {
            key: "key-1",
            value: "my-new-data-1",
          },
        },
        {
          operation: "delete",
          request: {
            key: "key-3",
          },
        },
      ]);

      const resTransactionDelete = await client.state.get(stateStoreName, "key-3");
      const resTransactionUpsert = await client.state.get(stateStoreName, "key-1");
      expect(resTransactionDelete).toEqual("");
      expect(resTransactionUpsert).toEqual("my-new-data-1");
    });
  });
});

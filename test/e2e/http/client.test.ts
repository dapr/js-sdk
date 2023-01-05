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

import { DaprClient } from "../../../src";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server

describe("http/client", () => {
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  // we put a timeout of 10s since it takes around 4s for Dapr to boot up
  beforeAll(async () => {
    client = new DaprClient({ daprHost: daprHost, daprPort: daprPort, isKeepAlive: false });
  }, 10 * 1000);

  afterAll(async () => {
    await client.stop();
  });

  describe("sidecar", () => {
    it("should return true if the sidecar has been started", async () => {
      // Note: difficult to test as we start up dapr with dapr run, which starts the sidecar for us automatically
      // there is however a delay between the sidecar being ready and the app starting as they are started asynchronously
      // if Dapr has to connect to a component, it might introduce a delay
      // the test will thus randomly have isStarted = true or isStarted = false depending on the startup delay of the sidecar
      await client.health.isHealthy();
      // expect(isStarted).toBe(false);
    });
  });

  describe("metadata", () => {
    it("should be able to get the metadata of the Dapr sidecar", async () => {
      const res = await client.metadata.get();

      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
    });

    it("should be able to get the capabilities of components via metadata call", async () => {
      const res = await client.metadata.get();
      const redisStateComponent = res.components.filter((component) => component.name == "state-redis");
      const expectedRedisStateCapabilities = ["ETAG", "TRANSACTIONAL", "QUERY_API", "ACTOR"];
      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
      expect(redisStateComponent.length).toEqual(1);
      expect(redisStateComponent[0].capabilities).toEqual(expect.arrayContaining(expectedRedisStateCapabilities));
    });

    it("should be able to set a custom metadata value of the Dapr sidecar", async () => {
      await client.metadata.set("testKey", "Hello World");

      const res = await client.metadata.get();

      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
      expect(res.extended["testKey"]).toEqual("Hello World");
    });
  });

  describe("health", () => {
    it("should return true if Dapr is ready", async () => {
      const res = await client.health.isHealthy();
      expect(res).toEqual(true);
    });
  });

  describe("pubsub", () => {
    const ce = {
      specversion: "1.0",
      type: "com.github.pull.create",
      source: "https://github.com/cloudevents/spec/pull",
      id: "A234-1234-1234",
    };
    it("should be able to publish a plain text", async () => {
      const res = await client.pubsub.publish("pubsub-redis", "test-topic", "Hello World");
      expect(res.error).toEqual(undefined);
    });
    it("should be able to publish a JSON", async () => {
      const res = await client.pubsub.publish("pubsub-redis", "test-topic", { hello: "world" });
      expect(res.error).toEqual(undefined);
    });
    it("should be able to publish a cloud event", async () => {
      const res = await client.pubsub.publish("pubsub-redis", "test-topic", ce);
      expect(res.error).toEqual(undefined);
    });
  });

  describe("secrets", () => {
    it("should be able to correctly fetch the secrets by a single key", async () => {
      const res = await client.secret.get("secret-envvars", "TEST_SECRET_1");
      expect(JSON.stringify(res)).toEqual(`{"TEST_SECRET_1":"secret_val_1"}`);
    });

    it("should be able to correctly fetch the secrets in bulk", async () => {
      const res = await client.secret.getBulk("secret-envvars");
      expect(Object.keys(res).length).toBeGreaterThan(1);
    });
  });

  describe("state", () => {
    beforeEach(async () => {
      await client.state.delete("state-redis", "key-1");
      await client.state.delete("state-redis", "key-2");
      await client.state.delete("state-redis", "key-3");
    });

    it("should be able to save the state", async () => {
      await client.state.save("state-redis", [
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

      const res = await client.state.get("state-redis", "key-1");
      expect(res).toEqual("value-1");
    });

    it("should be able to add metadata, etag and options", async () => {
      await client.state.save("state-redis", [
        {
          key: "key-1",
          value: "value-1",
          etag: "1234",
          options: {
            concurrency: "first-write",
            consistency: "strong",
          },
          metadata: {
            hello: "world",
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

      const res = await client.state.get("state-redis", "key-1");
      expect(res).toEqual("value-1");
    });

    it("should be able to get the state in bulk", async () => {
      await client.state.save("state-redis", [
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

      const res = await client.state.getBulk("state-redis", ["key-3", "key-2"]);

      expect(res).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "key-2", data: "value-2" }),
          expect.objectContaining({ key: "key-3", data: "value-3" }),
        ]),
      );
    });

    it("should be able to delete a key from the state store", async () => {
      await client.state.save("state-redis", [
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

      await client.state.delete("state-redis", "key-2");
      const res = await client.state.get("state-redis", "key-2");
      expect(res).toEqual("");
    });

    it("should be able to perform a transaction that replaces a key and deletes another", async () => {
      await client.state.transaction("state-redis", [
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

      const resTransactionDelete = await client.state.get("state-redis", "key-3");
      const resTransactionUpsert = await client.state.get("state-redis", "key-1");
      expect(resTransactionDelete).toEqual("");
      expect(resTransactionUpsert).toEqual("my-new-data-1");
    });

    it("should be able to query state", async () => {
      // First save our data
      await client.state.save("state-mongodb", [
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

      const res = await client.state.query("state-mongodb", {
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
        await client.state.delete("state-mongodb", `key-${i}`);
      }
    });
  });
});

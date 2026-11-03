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

import { randomUUID } from "node:crypto";
import { GenericContainer, Network, StartedNetwork, StartedTestContainer, Wait } from "testcontainers";
import { Component, DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient } from "../../../src";
import { sleep } from "../../../src/utils/NodeJS.util";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

const storeName = "state-redis-query";
const indexName = "query-metadata-index";

describe("state query metadata through the Dapr runtime", () => {
  let network: StartedNetwork | undefined;
  let redis: StartedTestContainer | undefined;
  let dapr: StartedDaprContainer | undefined;
  const clients: DaprClient[] = [];

  beforeAll(async () => {
    network = await new Network().start();
    // Query indexes require RedisJSON and RediSearch; plain redis:7 does not provide them.
    redis = await new GenericContainer("redis/redis-stack-server:7.2.0-v20")
      .withNetwork(network)
      .withNetworkAliases("redis-query")
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
      .start();
    const component = new Component(storeName, "state.redis", "v1", [
      { name: "redisHost", value: "redis-query:6379" },
      { name: "redisPassword", value: "" },
      { name: "enableTLS", value: "false" },
      {
        name: "queryIndexes",
        value: JSON.stringify([{ name: indexName, indexes: [{ key: "age", type: "NUMERIC" }] }]),
      },
    ]);
    dapr = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withComponent(component)
      .start();
    for (const protocol of [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC]) {
      const client = new DaprClient({
        daprHost: dapr.getHost(),
        daprPort: String(protocol === CommunicationProtocolEnum.HTTP ? dapr.getHttpPort() : dapr.getGrpcPort()),
        communicationProtocol: protocol,
      });
      clients.push(client);
      await client.start();
    }
  }, 180_000);

  afterAll(
    () =>
      runWithCleanupErrorSuppression(async () => {
        await Promise.all(clients.map((client) => client.stop()));
        await dapr?.stop();
        await redis?.stop();
        await network?.stop();
      }),
    60_000,
  );

  describe.each([
    ["HTTP", 0],
    ["gRPC", 1],
  ] as const)("%s", (_name, clientIndex) => {
    const query = { filter: { EQ: { age: 40 + clientIndex } }, sort: [], page: { limit: 10 } };

    it("queries JSON state using the configured Redis index", async () => {
      const client = clients[clientIndex];
      const key = `query-${randomUUID()}`;
      const value = { age: 40 + clientIndex, name: "query metadata" };
      await client.state.save(storeName, [{ key, value }], { metadata: { contentType: "application/json" } });
      let response = await client.state.query(storeName, query, { queryIndexName: indexName });
      // Wait only for indexing visibility, not for runtime errors (which must fail the test).
      for (let attempt = 0; response.results.length === 0 && attempt < 50; attempt++) {
        await sleep(100);
        response = await client.state.query(storeName, query, { queryIndexName: indexName });
      }
      expect(response.results).toHaveLength(1);
      expect(response.results[0].key).toBe(key);
      expect(response.results[0].error ?? "").toBe("");
      // Preserve the SDK's existing protocol-specific query result representation.
      const data =
        clientIndex === 0 ? response.results[0].data : JSON.parse(Buffer.from(response.results[0].data).toString());
      expect(data).toEqual(value);
    }, 30_000);

    it("requires queryIndexName metadata for the Redis query API", async () => {
      await expect(clients[clientIndex].state.query(storeName, query)).rejects.toThrow(/query index not found/i);
    });

    it("passes unknown index names to the runtime instead of silently selecting a default", async () => {
      await expect(
        clients[clientIndex].state.query(storeName, query, { queryIndexName: "missing-index" }),
      ).rejects.toThrow(/query index schema.*not found/i);
    });
  });
});

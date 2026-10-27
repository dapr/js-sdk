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
import { setTimeout as delay } from "node:timers/promises";
import { Code } from "@connectrpc/connect";
import { Component, MeilisearchContainer, VectorHarness } from "@dapr/testcontainer-node";
import {
  CommunicationProtocolEnum,
  DaprClient,
  GRPCClient,
  HTTPClient,
  LogLevel,
  VectorDistanceMetric,
  VectorIndexingOptions,
  VectorQuery,
  VectorRecord,
} from "../../../src";
import {
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { DAPR_TEST_VERSION, evaluateVectorRuntime } from "../helpers/runtimeVersion";

const gate = evaluateVectorRuntime(DAPR_TEST_VERSION);
const describeVector = gate.supported ? describe : describe.skip;
const wait: VectorIndexingOptions = { mode: "waitForCompletion", waitTimeout: "10s", onWaitTimeout: "failRequest" };
const records: VectorRecord[] = [
  {
    id: "a",
    values: [1, 0, 0],
    payload: Buffer.from([0, 255, 128, 123]),
    metadata: { category: "books", price: 30, details: { region: "eu" }, optional: "yes" },
  },
  {
    id: "b",
    values: [0.8, 0.6, 0],
    payload: Buffer.from("opaque \u00e9"),
    metadata: { category: "books", price: 10, details: { region: "us" } },
  },
  {
    id: "c",
    values: [0, 1, 0],
    payload: Buffer.alloc(0),
    metadata: { category: "books", price: 20, details: { region: "eu" } },
  },
  { id: "d", values: [-1, 0, 0], metadata: { category: "videos", price: 5, details: { region: "us" } } },
];

describeVector(`Vector HTTP and gRPC (${gate.reason ?? DAPR_TEST_VERSION})`, () => {
  let harness: VectorHarness | undefined;
  const clients = new Map<CommunicationProtocolEnum, DaprClient>();
  const extraClients: DaprClient[] = [];
  const token = randomUUID();

  beforeAll(async () => {
    harness = new VectorHarness({
      daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE,
      vectorStoreName: "vector-meili",
      meilisearchContainer: new MeilisearchContainer("getmeili/meilisearch:v1.43.0"),
    });
    harness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withEnvironment({ DAPR_API_TOKEN: token })
      .withComponent(new Component("vector-memory", "vector.in-memory", "v1", []))
      .withComponent(
        new Component("vector-delayed", "vector.in-memory", "v1", [{ name: "indexingDelay", value: "300ms" }]),
      );
    await harness.start();
    for (const protocol of [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC]) {
      clients.set(
        protocol,
        new DaprClient({
          communicationProtocol: protocol,
          daprHost: harness.getHost(),
          daprPort: String(protocol === CommunicationProtocolEnum.HTTP ? harness.getHttpPort() : harness.getGrpcPort()),
          daprApiToken: token,
          logger: { level: LogLevel.Error },
        }),
      );
    }
  }, 240_000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      try {
        await Promise.all([...clients.values(), ...extraClients].map((client) => client.stop()));
      } finally {
        await harness?.stop();
      }
    });
  }, 90_000);

  function getClient(protocol: CommunicationProtocolEnum): DaprClient {
    const client = clients.get(protocol);
    if (client === undefined) throw new Error("Vector client was not initialized");
    return client;
  }

  describe.each([
    ["HTTP", CommunicationProtocolEnum.HTTP],
    ["gRPC", CommunicationProtocolEnum.GRPC],
  ] as const)("%s", (_name, protocol) => {
    let client: DaprClient;
    let other: DaprClient;
    beforeAll(() => {
      client = getClient(protocol);
      other = getClient(
        protocol === CommunicationProtocolEnum.HTTP ? CommunicationProtocolEnum.GRPC : CommunicationProtocolEnum.HTTP,
      );
    });

    describe.each(["vector-memory", "vector-meili"])("%s", (store) => {
      let collection: string;
      const created = new Set<string>();
      beforeEach(async () => {
        collection = `sdk-${randomUUID()}`;
        await client.vector.createCollection(store, collection, { dimensions: 3 });
        created.add(collection);
      }, 30_000);
      afterEach(async () => {
        const names = [...created];
        created.clear();
        await Promise.all(names.map((name) => client.vector.deleteCollection(store, name)));
      }, 30_000);

      async function seed(): Promise<void> {
        expect(await client.vector.upsertVectors(store, collection, records, wait)).toEqual({
          ack: "completed",
          failedItems: [],
        });
      }

      it("creates, lists, inspects, and deletes collections across transports", async () => {
        expect(await other.vector.listCollections(store, { metadata: { "key +/?": "value +/%?#\u00e9" } })).toContain(
          collection,
        );
        expect(await other.vector.getCollection(store, collection)).toMatchObject({
          collection,
          recordCount: 0,
          dimensions: 3,
          metric: "cosine",
        });
        await expectStatus(
          client.vector.createCollection(store, collection, { dimensions: 3 }),
          protocol,
          409,
          Code.AlreadyExists,
        );
        await other.vector.deleteCollection(store, collection);
        created.delete(collection);
        expect(await client.vector.listCollections(store)).not.toContain(collection);
        await expectStatus(client.vector.getCollection(store, collection), protocol, 404, Code.NotFound);
      }, 30_000);

      it("round-trips arbitrary bytes and metadata, preserves get order, upserts, and leaves unselected records intact", async () => {
        await seed();
        expect((await other.vector.getCollection(store, collection)).recordCount).toBe(4);
        const found = await other.vector.getVectors(store, collection, ["missing", "c", "a", "b"], {
          includeValues: true,
        });
        expect(found.map((r) => r.id)).toEqual(["c", "a", "b"]);
        if (store === "vector-meili") {
          // The Meilisearch component omits zero-length payloads instead of storing a payload field.
          expect(found[0].payload).toBeUndefined();
        } else {
          expect(found[0].payload).toEqual(new Uint8Array());
        }
        expect(found[1]).toEqual({ ...records[0], payload: Uint8Array.from(records[0].payload!) });
        expect(Buffer.from(found[2].payload!).toString()).toBe("opaque \u00e9");
        expect(found[2].values[0]).toBeCloseTo(0.8, 6);
        expect(found[2].metadata).toEqual(records[1].metadata);
        const omitted = await client.vector.getVectors(store, collection, ["a"]);
        expect(omitted[0].values).toEqual([]);
        expect(omitted[0].payload).toEqual(Uint8Array.from(records[0].payload!));
        expect(await client.vector.getVectors(store, collection, ["missing"])).toEqual([]);
        expect(await client.vector.getVectors(store, collection, [])).toEqual([]);

        const replacement = {
          id: "a",
          values: [0, 0, 1],
          payload: Uint8Array.from([1, 2]),
          metadata: { replacement: true },
        };
        expect(await other.vector.upsertVectors(store, collection, [replacement], wait)).toEqual({
          ack: "completed",
          failedItems: [],
        });
        expect(await client.vector.getVectors(store, collection, ["a"], { includeValues: true })).toEqual([
          replacement,
        ]);
        expect((await client.vector.getCollection(store, collection)).recordCount).toBe(4);
        expect(await client.vector.deleteVectors(store, collection, ["a", "missing"], wait)).toBe("completed");
        expect((await other.vector.getVectors(store, collection, ["a", "b"])).map((r) => r.id)).toEqual(["b"]);
        expect((await client.vector.getCollection(store, collection)).recordCount).toBe(3);
      }, 30_000);

      it("queries by dense vector and ID with inclusion flags, topK, and inclusive raw score thresholds", async () => {
        await seed();
        const result = await client.vector.queryVectors(store, collection, {
          vector: [1, 0, 0],
          topK: 2,
          includeValues: true,
          includePayload: true,
        });
        expect(result.metric).toBe("cosine");
        expect(result.matches.map((m) => m.record.id)).toEqual(["a", "b"]);
        expect(result.matches[0].score).toBeCloseTo(1, 6);
        expect(result.matches[1].score).toBeCloseTo(0.8, 5);
        expect(result.matches[0].record.values).toEqual([1, 0, 0]);
        expect(result.matches[0].record.payload).toEqual(Uint8Array.from(records[0].payload!));
        const byId = await other.vector.queryVectors(store, collection, { byId: "a", topK: 4, scoreThreshold: 0 });
        // Meilisearch's native similar-document query excludes the source record.
        expect(byId.matches.map((m) => m.record.id)).toEqual(store === "vector-meili" ? ["b", "c"] : ["a", "b", "c"]);
        for (const match of byId.matches) {
          expect(match.record.values).toEqual([]);
          expect(match.record.payload).toBeUndefined();
          expect(match.record.metadata).toBeDefined();
        }
        const none = await client.vector.queryVectors(store, collection, {
          byId: "a",
          filter: { category: { $eq: "not-present" } },
          includeValues: false,
          includePayload: false,
        });
        expect(none).toEqual({ metric: "cosine", matches: [] });
        expect(
          (await client.vector.queryVectors(store, collection, { vector: [1, 0, 0], topK: 0 })).matches,
        ).toHaveLength(4);
      }, 30_000);

      const filters: [string, VectorQuery["filter"], string[]][] = [
        ["equality", { category: { $eq: "videos" } }, ["d"]],
        ["inequality", { category: { $ne: "books" } }, ["d"]],
        ["greater than", { price: { $gt: 20 } }, ["a"]],
        ["greater or equal", { price: { $gte: 20 } }, ["a", "c"]],
        ["less than", { price: { $lt: 10 } }, ["d"]],
        ["less or equal", { price: { $lte: 10 } }, ["b", "d"]],
        ["in", { price: { $in: [10, 30] } }, ["a", "b"]],
        ["not in", { price: { $nin: [10, 30] } }, ["c", "d"]],
        ["exists", { optional: { $exists: true } }, ["a"]],
        ["missing", { optional: { $exists: false } }, ["b", "c", "d"]],
        ["nested", { "details.region": { $eq: "eu" } }, ["a", "c"]],
        ["and", { $and: [{ category: { $eq: "books" } }, { price: { $lt: 20 } }] }, ["b"]],
        ["or", { $or: [{ price: { $eq: 30 } }, { category: { $eq: "videos" } }] }, ["a", "d"]],
        ["not", { $not: { category: { $eq: "books" } } }, ["d"]],
      ];
      it.each(filters)(
        "applies portable %s filters to metadata, not payload",
        async (_label, filter, expected) => {
          await seed();
          const result = await client.vector.queryVectors(store, collection, { vector: [1, 0, 0], topK: 10, filter });
          expect(result.matches.map((m) => m.record.id).sort()).toEqual(expected);
        },
        30_000,
      );

      it("returns partial upsert failures, accepts empty writes, and rejects duplicate IDs atomically", async () => {
        const result = await client.vector.upsertVectors(
          store,
          collection,
          [records[0], { id: "dimensions", values: [1, 0] }, { id: "zero", values: [0, 0, 0] }],
          wait,
        );
        expect(result.ack).toBe("completed");
        expect(result.failedItems.map((f) => f.id).sort()).toEqual(["dimensions", "zero"]);
        for (const failure of result.failedItems) {
          expect(failure.error.code).toBe(3);
          expect(failure.error.message).not.toBe("");
        }
        expect(
          (await client.vector.getVectors(store, collection, ["a", "dimensions", "zero"])).map((r) => r.id),
        ).toEqual(["a"]);
        expect(await client.vector.upsertVectors(store, collection, [], wait)).toEqual({
          ack: "completed",
          failedItems: [],
        });
        const invalid = await client.vector.upsertVectors(store, collection, [{ id: "bad", values: [] }], wait);
        expect(invalid.failedItems).toEqual([
          { id: "bad", error: { code: 3, message: expect.any(String), details: expect.any(Array) } },
        ]);
        await expectStatus(
          client.vector.upsertVectors(store, collection, [records[1], records[1], records[2]], wait),
          protocol,
          400,
          Code.InvalidArgument,
        );
        expect((await other.vector.getVectors(store, collection, ["a", "b", "c"])).map((r) => r.id)).toEqual(["a"]);
        expect(await client.vector.upsertVectors(store, collection, [records[1]], wait)).toEqual({
          ack: "completed",
          failedItems: [],
        });
      }, 30_000);

      it("keeps successful and failed batch query results in input order, including runtime validation failures", async () => {
        await seed();
        const results = await client.vector.batchQueryVectors(store, collection, [
          { vector: [1, 0, 0], topK: 1, includePayload: true },
          { vector: [1, 0] },
          { byId: "missing" },
          { vector: [] },
          { byId: "c", topK: 1 },
        ]);
        expect(results).toHaveLength(5);
        expect(results[0].response?.matches.map((m) => m.record.id)).toEqual(["a"]);
        expect(results[1].error?.code).toBe(3);
        expect(results[2].error?.code).toBe(5);
        expect(results[3].error?.code).toBe(3);
        expect(results[3].error?.details.length).toBeGreaterThan(0);
        expect(results[4].response?.matches.map((m) => m.record.id)).toEqual([store === "vector-meili" ? "b" : "c"]);
        const allFailed = await client.vector.batchQueryVectors(store, collection, [
          { byId: "missing" },
          { vector: [1] },
        ]);
        expect(allFailed.map((result) => result.error?.code)).toEqual([5, 3]);
        expect(await client.vector.batchQueryVectors(store, collection, [])).toEqual([]);
        expect(
          (await other.vector.queryVectors(store, collection, { vector: [1, 0, 0], topK: 1 })).matches[0].record.id,
        ).toBe("a");
      }, 30_000);

      it("surfaces provider errors, isolates simultaneous failures, and remains usable", async () => {
        await seed();
        await expectStatus(
          client.vector.queryVectors(store, collection, { vector: [1] }),
          protocol,
          400,
          Code.InvalidArgument,
        );
        await expectStatus(
          client.vector.queryVectors(store, collection, { byId: "missing" }),
          protocol,
          404,
          Code.NotFound,
        );
        await expectStatus(
          client.vector.queryVectors(store, collection, { vector: [] }),
          protocol,
          400,
          Code.InvalidArgument,
        );
        const [success, failure] = await Promise.allSettled([
          client.vector.queryVectors(store, collection, { byId: "a", topK: 2 }),
          client.vector.queryVectors(store, collection, { byId: "a", filter: { category: { $invalid: "books" } } }),
        ]);
        expect(success.status).toBe("fulfilled");
        if (success.status === "fulfilled") expect(success.value.matches).toHaveLength(2);
        expect(failure.status).toBe("rejected");
        expect((await client.vector.getCollection(store, collection)).recordCount).toBe(4);
      }, 30_000);

      it("makes default acceptance writes and deletes visible without claiming immediate completion", async () => {
        expect(["queued", "completed"]).toContain(
          (await client.vector.upsertVectors(store, collection, [records[0]])).ack,
        );
        await eventually(async () => (await other.vector.getVectors(store, collection, ["a"])).length === 1);
        expect(["queued", "completed"]).toContain(await client.vector.deleteVectors(store, collection, ["a"]));
        await eventually(async () => (await other.vector.getVectors(store, collection, ["a"])).length === 0);
      }, 30_000);

      it("reports missing collections for every collection-bound operation", async () => {
        const missing = `missing-${randomUUID()}`;
        for (const operation of [
          () => client.vector.getCollection(store, missing),
          () => client.vector.deleteCollection(store, missing),
          () => client.vector.upsertVectors(store, missing, [records[0]], wait),
          () => client.vector.getVectors(store, missing, ["a"]),
          () => client.vector.deleteVectors(store, missing, ["a"], wait),
          () => client.vector.queryVectors(store, missing, { vector: [1, 0, 0] }),
          () => client.vector.batchQueryVectors(store, missing, [{ vector: [1, 0, 0] }]),
        ])
          await expectStatus(operation(), protocol, 404, Code.NotFound);
        expect((await client.vector.getCollection(store, collection)).collection).toBe(collection);
      }, 30_000);

      it("isolates identical record IDs across concurrent collections and recreates a deleted collection with new dimensions", async () => {
        const sibling = `sibling-${randomUUID()}`;
        await other.vector.createCollection(store, sibling, { dimensions: 3 });
        created.add(sibling);
        const first = { id: "shared", values: [1, 0, 0], payload: Uint8Array.from([1]), metadata: { owner: "first" } };
        const second = {
          id: "shared",
          values: [0, 1, 0],
          payload: Uint8Array.from([2]),
          metadata: { owner: "second" },
        };
        const writes = await Promise.all([
          client.vector.upsertVectors(store, collection, [first], wait),
          other.vector.upsertVectors(store, sibling, [second], wait),
        ]);
        for (const write of writes) expect(write).toEqual({ ack: "completed", failedItems: [] });
        expect(await other.vector.getVectors(store, collection, ["shared"], { includeValues: true })).toEqual([first]);
        expect(await client.vector.getVectors(store, sibling, ["shared"], { includeValues: true })).toEqual([second]);
        expect(await client.vector.listCollections(store)).toEqual(expect.arrayContaining([collection, sibling]));
        await other.vector.deleteCollection(store, collection);
        created.delete(collection);
        expect(await client.vector.getVectors(store, sibling, ["shared"], { includeValues: true })).toEqual([second]);
        await client.vector.createCollection(store, collection, { dimensions: 4 });
        created.add(collection);
        expect(await other.vector.getCollection(store, collection)).toMatchObject({ dimensions: 4, recordCount: 0 });
        expect(await other.vector.getVectors(store, collection, ["shared"])).toEqual([]);
        const wrongShape = await client.vector.upsertVectors(store, collection, [first], wait);
        expect(wrongShape.failedItems).toMatchObject([{ id: "shared", error: { code: Code.InvalidArgument } }]);
        expect(
          await client.vector.upsertVectors(store, collection, [{ id: "shared", values: [0, 0, 0, 1] }], wait),
        ).toEqual({ ack: "completed", failedItems: [] });
        expect(
          (await other.vector.queryVectors(store, collection, { vector: [0, 0, 0, 1] })).matches[0].record.id,
        ).toBe("shared");
        expect(await client.vector.getVectors(store, sibling, ["shared"], { includeValues: true })).toEqual([second]);
      }, 60_000);

      it("filters before topK, combines nested boolean filters with thresholds, and keeps batch options independent", async () => {
        await seed();
        const filtered: VectorQuery = {
          vector: [1, 0, 0],
          topK: 1,
          filter: { $and: [{ category: { $eq: "books" } }, { $not: { price: { $gte: 20 } } }] },
          includeValues: true,
          includePayload: true,
        };
        const result = await client.vector.queryVectors(store, collection, filtered);
        expect(result.matches.map((m) => m.record.id)).toEqual(["b"]);
        expect(result.matches[0].score).toBeCloseTo(0.8, 5);
        const batch = await other.vector.batchQueryVectors(store, collection, [
          filtered,
          { vector: [1, 0, 0], topK: 1, includeValues: false, includePayload: false },
          { ...filtered, scoreThreshold: 0.9 },
          { ...filtered, scoreThreshold: 0.75 },
        ]);
        expect(batch.map((item) => item.response?.matches.map((match) => match.record.id))).toEqual([
          ["b"],
          ["a"],
          [],
          ["b"],
        ]);
        expect(batch[0].response?.matches[0].record.payload).toEqual(Uint8Array.from(records[1].payload!));
        expect(batch[0].response?.matches[0].record.values).toHaveLength(3);
        expect(batch[1].response?.matches[0].record.payload).toBeUndefined();
        expect(batch[1].response?.matches[0].record.values).toEqual([]);
        expect(batch[3].response?.matches[0].record.payload).toEqual(Uint8Array.from(records[1].payload!));
      }, 30_000);

      it("keeps existing records on failed updates, replaces old attributes, and tolerates repeated deletion", async () => {
        await seed();
        const replacement = {
          id: "b",
          values: [0, 0, 1],
          metadata: { replacement: true, nested: { zero: 0, flag: false, nil: null } },
        };
        const result = await client.vector.upsertVectors(
          store,
          collection,
          [{ id: "a", values: [1] }, replacement, { id: "c", values: [0, 0, 0] }],
          wait,
        );
        expect(result.ack).toBe("completed");
        expect(result.failedItems.map((f) => [f.id, f.error.code]).sort()).toEqual([
          ["a", 3],
          ["c", 3],
        ]);
        const actual = await other.vector.getVectors(store, collection, ["b", "a"], { includeValues: true });
        expect(actual[0]).toEqual(replacement);
        expect(actual[1]).toEqual({ ...records[0], payload: Uint8Array.from(records[0].payload!) });
        expect(
          (
            await client.vector.queryVectors(store, collection, {
              vector: [0, 0, 1],
              topK: 10,
              filter: { category: { $eq: "books" } },
            })
          ).matches
            .map((m) => m.record.id)
            .sort(),
        ).toEqual(["a", "c"]);
        expect(
          (
            await client.vector.queryVectors(store, collection, {
              vector: [0, 0, 1],
              filter: { "nested.flag": { $eq: false } },
            })
          ).matches.map((m) => m.record.id),
        ).toEqual(["b"]);
        expect(await client.vector.deleteVectors(store, collection, ["b"], wait)).toBe("completed");
        expect(await other.vector.deleteVectors(store, collection, ["b"], wait)).toBe("completed");
        expect((await client.vector.getVectors(store, collection, ["a", "b", "c", "d"])).map((r) => r.id)).toEqual([
          "a",
          "c",
          "d",
        ]);
        expect((await other.vector.getCollection(store, collection)).recordCount).toBe(3);
      }, 60_000);
    });

    it.each(["vector-memory", "vector-meili"])(
      "round-trips 1536-dimensional embeddings and 64 KiB payload views using %s",
      async (store) => {
        const name = `large-${randomUUID()}`;
        const values = Array.from({ length: 1536 }, (_, i) => Math.fround(((i % 31) - 15) / 31));
        const backing = Buffer.from(Array.from({ length: 65540 }, (_, i) => (i * 37) % 256));
        const payload = backing.subarray(2, -2);
        const attributes = { title: "\u00e9\u6771\u4eac", nested: { tags: [null, true, false, 0, ""] } };
        await client.vector.createCollection(store, name, { dimensions: values.length });
        try {
          expect(
            await client.vector.upsertVectors(
              store,
              name,
              [
                { id: "embedding", values, payload, metadata: attributes },
                { id: "opposite", values: values.map((v) => -v) },
              ],
              { ...wait, waitTimeout: "20s" },
            ),
          ).toEqual({ ack: "completed", failedItems: [] });
          const [found] = await other.vector.getVectors(store, name, ["embedding"], { includeValues: true });
          expect(found.values).toHaveLength(1536);
          expect(Float32Array.from(found.values)).toEqual(Float32Array.from(values));
          expect(found.payload).toEqual(Uint8Array.from(payload));
          expect(found.metadata).toEqual(attributes);
          const result = await client.vector.queryVectors(store, name, {
            vector: values,
            topK: 2,
            scoreThreshold: 0.99,
            includeValues: true,
            includePayload: true,
          });
          expect(result.matches.map((m) => m.record.id)).toEqual(["embedding"]);
          expect(result.matches[0].score).toBeCloseTo(1, 5);
          expect(Float32Array.from(result.matches[0].record.values)).toEqual(Float32Array.from(values));
          expect(result.matches[0].record.payload).toEqual(Uint8Array.from(payload));
          const [defaultRead] = await other.vector.getVectors(store, name, ["embedding"]);
          expect(defaultRead.values).toEqual([]);
          expect(defaultRead.payload).toEqual(Uint8Array.from(payload));
        } finally {
          await client.vector.deleteCollection(store, name);
        }
      },
      60_000,
    );

    it.each([
      ["cosine", [1, 0.8, 0, -1], 0.5, ["a", "b"]],
      ["dotProduct", [1, 0.8, 0, -1], 0.5, ["a", "b"]],
      ["euclidean", [0, Math.sqrt(0.4), Math.sqrt(2), 2], 1, ["a", "b"]],
    ] as const)(
      "uses %s score units, ordering, thresholds, and effective collection metrics",
      async (metric, scores, cutoff, expected) => {
        const name = `metric-${randomUUID()}`;
        await client.vector.createCollection("vector-memory", name, { dimensions: 3, metric });
        try {
          expect((await client.vector.getCollection("vector-memory", name)).metric).toBe(metric);
          await client.vector.upsertVectors("vector-memory", name, records, wait);
          const all = await client.vector.queryVectors("vector-memory", name, { vector: [1, 0, 0], topK: 4 });
          expect(all.metric).toBe(metric);
          expect(all.matches.map((m) => m.record.id)).toEqual(["a", "b", "c", "d"]);
          all.matches.forEach((match, i) => expect(match.score).toBeCloseTo(scores[i], 6));
          const filtered = await client.vector.queryVectors("vector-memory", name, {
            byId: "a",
            scoreThreshold: cutoff,
          });
          expect(filtered.matches.map((m) => m.record.id)).toEqual(expected);
          const inclusive = await client.vector.queryVectors("vector-memory", name, {
            byId: "a",
            scoreThreshold: metric === "euclidean" ? 0 : 1,
          });
          expect(inclusive.matches.map((m) => m.record.id)).toEqual(["a"]);
          const override = await other.vector.queryVectors("vector-memory", name, {
            vector: [2, 0, 0],
            metric: "dotProduct",
          });
          expect(override.metric).toBe("dotProduct");
          expect(override.matches[0].score).toBe(2);
        } finally {
          await client.vector.deleteCollection("vector-memory", name);
        }
      },
      30_000,
    );

    it.each(["cosine", "dotProduct", "euclidean"] as const)(
      "matches an independent %s scoring oracle on non-normalized vectors and mixed batch queries",
      async (metric) => {
        const name = `oracle-${randomUUID()}`;
        const corpus: VectorRecord[] = Array.from({ length: 32 }, (_, i) => ({
          id: `v-${String(i).padStart(2, "0")}`,
          values: Array.from({ length: 8 }, (_, d) =>
            Math.fround(Math.sin((i + 1) * (d + 1) * 1.2345) * (1 + (i % 5))),
          ),
          payload: Uint8Array.from([i, 255 - i]),
          metadata: { bucket: i % 3, rank: i },
        }));
        const query = Array.from({ length: 8 }, (_, d) => Math.fround(Math.cos((d + 1) * 0.73) * 2.3));
        const expected = (rows: VectorRecord[], vector: readonly number[], effective: VectorDistanceMetric) =>
          rows
            .map((record) => ({ id: record.id, score: referenceScore(effective, vector, record.values) }))
            .sort((a, b) => (effective === "euclidean" ? a.score - b.score : b.score - a.score));
        await client.vector.createCollection("vector-memory", name, { dimensions: 8, metric });
        try {
          expect(await client.vector.upsertVectors("vector-memory", name, corpus, wait)).toEqual({
            ack: "completed",
            failedItems: [],
          });
          const ranked = expected(corpus, query, metric);
          const actual = await other.vector.queryVectors("vector-memory", name, { vector: query, topK: corpus.length });
          expect(actual.metric).toBe(metric);
          expect(actual.matches.map((m) => m.record.id)).toEqual(ranked.map((r) => r.id));
          actual.matches.forEach((match, i) => expect(match.score).toBeCloseTo(ranked[i].score, 4));
          const eligible = expected(
            corpus.filter((r) => r.metadata?.bucket === 1 && Number(r.metadata.rank) >= 3),
            query,
            metric,
          );
          const filter: VectorQuery["filter"] = { $and: [{ bucket: { $eq: 1 } }, { $not: { rank: { $lt: 3 } } }] };
          const threshold = (eligible[4].score + eligible[5].score) / 2;
          const batch = await client.vector.batchQueryVectors("vector-memory", name, [
            { vector: query, topK: 3, filter },
            { vector: query.slice(1) },
            { vector: query, topK: corpus.length, filter, scoreThreshold: threshold },
            { byId: corpus[7].id, metric: "dotProduct", topK: 4, includePayload: true },
          ]);
          expect(batch).toHaveLength(4);
          expect(batch[0].response?.matches.map((m) => m.record.id)).toEqual(eligible.slice(0, 3).map((r) => r.id));
          expect(batch[1].error?.code).toBe(Code.InvalidArgument);
          expect(batch[2].response?.matches.map((m) => m.record.id)).toEqual(eligible.slice(0, 5).map((r) => r.id));
          const byId = expected(corpus, corpus[7].values, "dotProduct").slice(0, 4);
          expect(batch[3].response?.metric).toBe("dotProduct");
          expect(batch[3].response?.matches.map((m) => m.record.id)).toEqual(byId.map((r) => r.id));
          batch[3].response?.matches.forEach((match, i) => {
            expect(match.score).toBeCloseTo(byId[i].score, 4);
            expect(match.record.payload).toEqual(corpus.find((r) => r.id === match.record.id)?.payload);
            expect(match.record.values).toEqual([]);
          });
        } finally {
          await client.vector.deleteCollection("vector-memory", name);
        }
      },
      30_000,
    );

    it("preserves escaped collection names and record IDs on both transports", async () => {
      const name = `sdk-${randomUUID()} /%?#\u00e9`;
      const id = "id /%?#\u00e9";
      await client.vector.createCollection("vector-memory", name, { dimensions: 3 });
      try {
        await client.vector.upsertVectors("vector-memory", name, [{ ...records[0], id }], wait);
        expect((await other.vector.getVectors("vector-memory", name, [id]))[0].id).toBe(id);
        expect((await other.vector.getCollection("vector-memory", name)).collection).toBe(name);
        expect((await other.vector.queryVectors("vector-memory", name, { byId: id })).matches[0].record.id).toBe(id);
        await other.vector.deleteVectors("vector-memory", name, [id], wait);
        expect(await client.vector.getVectors("vector-memory", name, [id])).toEqual([]);
      } finally {
        await other.vector.deleteCollection("vector-memory", name);
      }
    }, 30_000);

    it("reports unsupported Meilisearch metrics instead of silently changing their meaning", async () => {
      const name = `metric-${randomUUID()}`;
      for (const metric of ["dotProduct", "euclidean"] satisfies VectorDistanceMetric[]) {
        await expectStatus(
          client.vector.createCollection("vector-meili", name, { dimensions: 3, metric }),
          protocol,
          400,
          Code.InvalidArgument,
        );
      }
      await client.vector.createCollection("vector-meili", name, { dimensions: 3, metric: "cosine" });
      try {
        await client.vector.upsertVectors("vector-meili", name, [records[0]], wait);
        await expectStatus(
          client.vector.queryVectors("vector-meili", name, { byId: "a", metric: "euclidean" }),
          protocol,
          400,
          Code.InvalidArgument,
        );
        const results = await client.vector.batchQueryVectors("vector-meili", name, [
          { byId: "a" },
          { byId: "a", metric: "dotProduct" },
        ]);
        expect(results[0].response?.metric).toBe("cosine");
        expect(results[1].error?.code).toBe(3);
      } finally {
        await client.vector.deleteCollection("vector-meili", name);
      }
    }, 30_000);

    it.each(["continueAsync", "failRequest"] as const)(
      "honors %s on wait expiry while queued writes and deletes continue",
      async (onWaitTimeout) => {
        const name = `delayed-${randomUUID()}`;
        await client.vector.createCollection("vector-delayed", name, { dimensions: 3 });
        try {
          const options: VectorIndexingOptions = {
            mode: "waitForCompletion",
            waitTimeout: "0.000000001s",
            onWaitTimeout,
          };
          const upsert = client.vector.upsertVectors("vector-delayed", name, [records[0]], options);
          if (onWaitTimeout === "continueAsync") {
            await expect(upsert).resolves.toEqual({ ack: "queued", failedItems: [] });
          } else {
            await expectStatus(upsert, protocol, 504, Code.DeadlineExceeded);
          }
          await eventually(async () => (await other.vector.getVectors("vector-delayed", name, ["a"])).length === 1);
          const deletion = client.vector.deleteVectors("vector-delayed", name, ["a"], options);
          if (onWaitTimeout === "continueAsync") {
            await expect(deletion).resolves.toBe("queued");
          } else {
            await expectStatus(deletion, protocol, 504, Code.DeadlineExceeded);
          }
          await eventually(async () => (await other.vector.getVectors("vector-delayed", name, ["a"])).length === 0);
          expect(await client.vector.upsertVectors("vector-delayed", name, [records[0]], wait)).toEqual({
            ack: "completed",
            failedItems: [],
          });
        } finally {
          await client.vector.deleteCollection("vector-delayed", name);
        }
      },
      30_000,
    );

    it("cancels an in-flight write without disrupting concurrent requests or subsequent writes", async () => {
      const name = `cancelled-${randomUUID()}`;
      await client.vector.createCollection("vector-delayed", name, { dimensions: 3 });
      try {
        const controller = new AbortController();
        const pending = client.vector.upsertVectors("vector-delayed", name, [records[0]], {
          ...wait,
          signal: controller.signal,
        });
        await delay(50);
        expect((await other.vector.getCollection("vector-delayed", name)).collection).toBe(name);
        controller.abort();
        await expect(pending).rejects.toMatchObject(
          protocol === CommunicationProtocolEnum.GRPC ? { code: Code.Canceled } : { name: "AbortError" },
        );
        expect(await client.vector.upsertVectors("vector-delayed", name, [records[1]], wait)).toEqual({
          ack: "completed",
          failedItems: [],
        });
        expect((await other.vector.getVectors("vector-delayed", name, ["b"])).map((r) => r.id)).toEqual(["b"]);
      } finally {
        await client.vector.deleteCollection("vector-delayed", name);
      }
    }, 30_000);

    it("verifies SDK writes and reads against native Meilisearch records", async () => {
      const name = `native-${randomUUID()}`;
      await client.vector.createCollection("vector-meili", name, { dimensions: 3 });
      try {
        await client.vector.upsertVectors("vector-meili", name, [records[0]], wait);
        expect(await meiliRequest(`/indexes/${name}/documents/a?retrieveVectors=true`)).toMatchObject({
          id: "a",
          daprPayload: "AP+Aew==",
          daprMetadata: records[0].metadata,
          _vectors: { default: { embeddings: [[1, 0, 0]], regenerate: false } },
        });
        const task = await meiliRequest(`/indexes/${name}/documents`, "POST", [
          {
            id: "native",
            _vectors: { default: [0, 0, 1] },
            daprPayload: "AP+Aew==",
            daprMetadata: { source: "native" },
          },
        ]);
        expect(task.taskUid).toEqual(expect.any(Number));
        await eventually(async () => {
          const state = await meiliRequest(`/tasks/${task.taskUid}`);
          if (state.status === "failed" || state.status === "canceled") {
            throw new Error(`Native Meilisearch indexing failed: ${JSON.stringify(state)}`);
          }
          return state.status === "succeeded";
        });
        expect(await client.vector.getVectors("vector-meili", name, ["native"], { includeValues: true })).toEqual([
          {
            id: "native",
            values: [0, 0, 1],
            payload: Uint8Array.from([0, 255, 128, 123]),
            metadata: { source: "native" },
          },
        ]);
        const result = await client.vector.queryVectors("vector-meili", name, {
          vector: [0, 0, 1],
          topK: 1,
          filter: { source: { $eq: "native" } },
        });
        expect(result.matches[0].record.id).toBe("native");
        expect(result.matches[0].score).toBeCloseTo(1, 6);
      } finally {
        await client.vector.deleteCollection("vector-meili", name);
      }
    }, 30_000);

    it("reports missing stores for all operations, even with empty batches", async () => {
      const missing = `missing-${randomUUID()}`;
      for (const operation of [
        () => client.vector.createCollection(missing, "c", { dimensions: 3 }),
        () => client.vector.getCollection(missing, "c"),
        () => client.vector.listCollections(missing),
        () => client.vector.deleteCollection(missing, "c"),
        () => client.vector.upsertVectors(missing, "c", []),
        () => client.vector.getVectors(missing, "c", []),
        () => client.vector.deleteVectors(missing, "c", []),
        () => client.vector.queryVectors(missing, "c", { vector: [1, 0, 0] }),
        () => client.vector.batchQueryVectors(missing, "c", []),
      ])
        await expectStatus(operation(), protocol, 404, Code.NotFound);
    }, 30_000);

    it("rejects invalid sidecar credentials and pre-cancellation without affecting authenticated requests", async () => {
      const unauthorized = new DaprClient({ ...client.options, daprApiToken: "incorrect-token" });
      extraClients.push(unauthorized);
      if (!(unauthorized.daprClient instanceof HTTPClient || unauthorized.daprClient instanceof GRPCClient)) {
        throw new Error("Expected a supported transport");
      }
      unauthorized.daprClient.setIsInitialized(true);
      await expectStatus(unauthorized.vector.listCollections("vector-memory"), protocol, 401, Code.Unauthenticated);
      const controller = new AbortController();
      controller.abort();
      await expect(client.vector.listCollections("vector-memory", { signal: controller.signal })).rejects.toThrow();
      expect(await client.vector.listCollections("vector-memory")).toEqual(expect.any(Array));
    }, 30_000);
  });

  async function meiliRequest(path: string, method = "GET", body?: unknown): Promise<Record<string, unknown>> {
    const provider = harness?.getStartedDaprContainer().getMeilisearchContainer();
    if (provider === undefined) throw new Error("Meilisearch was not initialized");
    const response = await fetch(`${provider.getHttpEndpoint()}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(provider.getApiKey() ? { Authorization: `Bearer ${provider.getApiKey()}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Native Meilisearch HTTP ${response.status}: ${await response.text()}`);
    const value: unknown = await response.json();
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Native Meilisearch response was not an object");
    }
    return value as Record<string, unknown>;
  }
});

async function expectStatus(
  operation: Promise<unknown>,
  protocol: CommunicationProtocolEnum,
  httpStatus: number,
  grpcCode: Code,
): Promise<void> {
  if (protocol === CommunicationProtocolEnum.HTTP) {
    await expect(operation).rejects.toThrow(`"status":${httpStatus}`);
  } else {
    await expect(operation).rejects.toMatchObject({ code: grpcCode });
  }
}

async function eventually(condition: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await delay(50);
  }
  throw new Error("Vector write did not become visible within 15 seconds");
}

function referenceScore(metric: VectorDistanceMetric, query: readonly number[], candidate: readonly number[]): number {
  if (metric === "euclidean") return Math.sqrt(query.reduce((sum, v, i) => sum + (v - candidate[i]) ** 2, 0));
  const dot = query.reduce((sum, v, i) => sum + v * candidate[i], 0);
  if (metric === "dotProduct") return dot;
  const norm = (values: readonly number[]) => Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return dot / (norm(query) * norm(candidate));
}

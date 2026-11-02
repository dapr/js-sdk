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
import { MeilisearchContainer, SearchHarness } from "@dapr/testcontainer-node";
import {
  CommunicationProtocolEnum,
  DaprClient,
  HTTPClient,
  IndexingOptions,
  SearchDocument,
  SearchQuery,
} from "../../../src";
import {
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { DAPR_TEST_VERSION, evaluateSearchRuntime } from "../helpers/runtimeVersion";

const gate = evaluateSearchRuntime(DAPR_TEST_VERSION);
const describeSearch = gate.supported ? describe : describe.skip;
const store = "searchstore";
const wait: IndexingOptions = {
  mode: "waitForCompletion",
  waitTimeout: "20s",
  onWaitTimeout: "failRequest",
};

interface Product {
  title: string;
  category: string;
  price: number;
  details: { region: string };
  optional?: string;
}

const products: SearchDocument<Product>[] = [
  {
    id: "a",
    content: { title: "Dapr introduction", category: "books", price: 30, details: { region: "eu" }, optional: "yes" },
    metadata: { source: "integration", tag: "\u00e9 +/%?#" },
  },
  {
    id: "b",
    content: { title: "Dapr advanced", category: "books", price: 10, details: { region: "us" } },
  },
  {
    id: "c",
    content: { title: "Dapr reference", category: "books", price: 20, details: { region: "eu" } },
  },
  {
    id: "d",
    content: { title: "Dapr video", category: "videos", price: 5, details: { region: "us" } },
  },
];

describeSearch(`Search HTTP / Meilisearch (${gate.reason ?? DAPR_TEST_VERSION})`, () => {
  let harness: SearchHarness | undefined;
  let client: DaprClient;
  let index: string | undefined;
  const clients: DaprClient[] = [];

  beforeAll(async () => {
    harness = new SearchHarness({
      daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE,
      searchStoreName: store,
      meilisearchContainer: new MeilisearchContainer("getmeili/meilisearch:v1.15.2"),
    });
    const daprApiToken = randomUUID();
    harness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withEnvironment({ DAPR_API_TOKEN: daprApiToken });
    await harness.start();
    client = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      daprHost: harness.getHost(),
      daprPort: String(harness.getHttpPort()),
      daprApiToken,
    });
    clients.push(client);
  }, 180_000);

  beforeEach(async () => {
    const name = `sdk-${randomUUID()}`;
    await client.search.createIndex(store, name, {
      metadata: {
        filterableAttributes: "category,price,details.region,optional",
        sortableAttributes: "price,title",
        searchableAttributes: "title",
      },
    });
    index = name;
  }, 30_000);

  afterEach(async () => {
    if (index !== undefined) {
      const name = index;
      index = undefined;
      await client.search.deleteIndex(store, name);
      expect(await client.search.listIndexes(store)).not.toContain(name);
    }
  }, 30_000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      try {
        await Promise.all(clients.map((entry) => entry.stop()));
      } finally {
        await harness?.stop();
      }
    });
  }, 60_000);

  function currentIndex(): string {
    if (index === undefined) {
      throw new Error("Search index was not initialized");
    }
    return index;
  }

  async function seed(): Promise<void> {
    expect(await client.search.indexDocuments(store, currentIndex(), products, wait)).toEqual({
      ack: "completed",
      failedItems: [],
    });
  }

  it("creates, lists, inspects, updates, and deletes typed documents without losing unselected data", async () => {
    const name = currentIndex();
    expect(await client.search.listIndexes(store)).toContain(name);
    expect(await client.search.getIndex(store, name)).toMatchObject({ index: name, documentCount: 0 });
    await expect(client.search.createIndex(store, name)).rejects.toThrow('"status":409');
    await seed();
    expect((await client.search.getIndex(store, name)).documentCount).toBe(4);

    const documents = await client.search.getDocuments<Product>(store, name, ["missing", "c", "a", "b"], {
      includeContent: true,
    });
    expect(documents.map((document) => document.id)).toEqual(["c", "a", "b"]);
    expect(documents[0].content).toEqual(products[2].content);
    expect(documents[1]).toEqual(products[0]);

    const withoutContent = await client.search.getDocuments<Product>(store, name, ["a"]);
    expect(withoutContent).toEqual([{ id: "a", content: undefined, metadata: products[0].metadata }]);
    expect(await client.search.getDocuments(store, name, ["missing"])).toEqual([]);
    expect(await client.search.getDocuments(store, name, [])).toEqual([]);

    const replacement: Product = {
      title: "Updated Dapr \u00e9 \ud83d\udcda",
      category: "books",
      price: 15,
      details: { region: "eu" },
    };
    expect(
      await client.search.indexDocuments(
        store,
        name,
        [{ id: "a", content: replacement, metadata: { revision: "2" } }],
        wait,
      ),
    ).toEqual({ ack: "completed", failedItems: [] });
    expect(await client.search.getDocuments<Product>(store, name, ["a", "b"], { includeContent: true })).toEqual([
      { id: "a", content: replacement, metadata: { revision: "2" } },
      { ...products[1], metadata: {} },
    ]);
    expect(await client.search.deleteDocuments(store, name, ["a", "missing"], wait)).toBe("completed");
    expect(await client.search.getDocuments(store, name, ["a", "b"])).toEqual([
      { id: "b", content: undefined, metadata: {} },
    ]);
    expect((await client.search.getIndex(store, name)).documentCount).toBe(3);
  }, 30_000);

  it("searches, filters, sorts, projects, highlights, and paginates with opaque tokens", async () => {
    await seed();
    const query: SearchQuery = {
      text: "Dapr",
      filter: { category: { $eq: "books" } },
      topK: 2,
      includeContent: true,
      returnFields: ["title", "price"],
      searchFields: ["title"],
      highlightFields: ["title"],
      sort: [{ field: "price" }],
    };
    const first = await client.search.search<Pick<Product, "title" | "price">>(store, currentIndex(), query);
    expect(first.hits.map((hit) => hit.document.id)).toEqual(["b", "c"]);
    expect(first.totalHits).toBeGreaterThanOrEqual(3);
    expect(first.totalHitsRelation).not.toBe("unspecified");
    expect(first.continuationToken).toEqual(expect.any(String));
    expect(first.continuationToken).not.toBe("");
    for (const hit of first.hits) {
      expect(hit.document.content).toEqual({ title: expect.any(String), price: expect.any(Number) });
      expect(hit.highlights.title).toContain("<em>");
      expect(Number.isFinite(hit.score)).toBe(true);
    }
    const last = await client.search.search(store, currentIndex(), {
      ...query,
      continuationToken: first.continuationToken,
    });
    expect(last.hits.map((hit) => hit.document.id)).toEqual(["a"]);
    expect(last.continuationToken).toBeUndefined();
    const descending = await client.search.search(store, currentIndex(), {
      ...query,
      topK: 10,
      sort: [{ field: "price", order: "desc" }],
    });
    expect(descending.hits.map((hit) => hit.document.id)).toEqual(["a", "c", "b"]);
  }, 30_000);

  it.each([1, 2, 4])(
    "ends pagination on an exactly full final page with topK=%i",
    async (topK) => {
      await seed();
      const expected = ["d", "b", "c", "a"];
      let continuationToken: string | undefined;
      for (let offset = 0; offset < expected.length; offset += topK) {
        const page = await client.search.search(store, currentIndex(), {
          topK,
          sort: [{ field: "price" }],
          continuationToken,
        });
        expect(page.hits.map((hit) => hit.document.id)).toEqual(expected.slice(offset, offset + topK));
        if (offset + topK < expected.length) {
          expect(page.continuationToken).toEqual(expect.any(String));
          expect(page.continuationToken).not.toBe("");
          expect(page.continuationToken).not.toBe(continuationToken);
        } else {
          expect(page.continuationToken).toBeUndefined();
        }
        continuationToken = page.continuationToken;
      }
    },
    30_000,
  );

  it.each([
    ["asc", ["a", "b", "c", "d"]],
    ["desc", ["c", "b", "a", "d"]],
  ] as const)(
    "uses the %s secondary sort to paginate ties across page boundaries",
    async (order, expected) => {
      const documents = [
        { id: "c", content: { title: "Charlie", price: 10 } },
        { id: "d", content: { title: "Delta", price: 20 } },
        { id: "a", content: { title: "Alpha", price: 10 } },
        { id: "b", content: { title: "Beta", price: 10 } },
      ];
      expect(await client.search.indexDocuments(store, currentIndex(), documents, wait)).toEqual({
        ack: "completed",
        failedItems: [],
      });
      const query: SearchQuery = { topK: 2, sort: [{ field: "price" }, { field: "title", order }] };
      const first = await client.search.search(store, currentIndex(), query);
      expect(first.hits.map((hit) => hit.document.id)).toEqual(expected.slice(0, 2));
      expect(first.continuationToken).toEqual(expect.any(String));
      expect(first.continuationToken).not.toBe("");
      const last = await client.search.search(store, currentIndex(), {
        ...query,
        continuationToken: first.continuationToken,
      });
      expect(last.hits.map((hit) => hit.document.id)).toEqual(expected.slice(2));
      expect(last.continuationToken).toBeUndefined();
    },
    30_000,
  );

  it.each(["%not-base64%", Buffer.from("not JSON").toString("base64url")])(
    "rejects invalid continuation token %s without affecting a valid pagination sequence",
    async (continuationToken) => {
      await seed();
      const query: SearchQuery = { topK: 2, sort: [{ field: "price" }] };
      const first = await client.search.search(store, currentIndex(), query);
      expect(first.hits.map((hit) => hit.document.id)).toEqual(["d", "b"]);
      expect(first.continuationToken).toEqual(expect.any(String));
      expect(first.continuationToken).not.toBe("");
      await expect(client.search.search(store, currentIndex(), { ...query, continuationToken })).rejects.toThrow(
        '"status":400',
      );
      const last = await client.search.search(store, currentIndex(), {
        ...query,
        continuationToken: first.continuationToken,
      });
      expect(last.hits.map((hit) => hit.document.id)).toEqual(["c", "a"]);
      expect(last.continuationToken).toBeUndefined();
      expect((await client.search.getIndex(store, currentIndex())).documentCount).toBe(4);
    },
    30_000,
  );

  it("supports native queries, match-all defaults, and searches without matches", async () => {
    await seed();
    const native = await client.search.search<Product>(store, currentIndex(), {
      native: { q: "advanced" },
      includeContent: true,
    });
    expect(native.hits.map((hit) => hit.document.content)).toEqual([products[1].content]);
    const all = await client.search.search(store, currentIndex());
    expect(all.hits).toHaveLength(4);
    expect(all.hits.every((hit) => hit.document.content === undefined)).toBe(true);
    expect(all.hits.find((hit) => hit.document.id === "a")?.document.metadata).toEqual(products[0].metadata);
    const empty = await client.search.search(store, currentIndex(), { text: "zzzznomatcheszzzz" });
    expect(empty.hits).toEqual([]);
    expect(empty.totalHits).toBe(0);
    expect(empty.continuationToken).toBeUndefined();
  }, 30_000);

  const filters: [string, SearchQuery["filter"], string[]][] = [
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
    ["nested path", { "details.region": { $eq: "eu" } }, ["a", "c"]],
    ["and", { $and: [{ category: { $eq: "books" } }, { price: { $lt: 20 } }] }, ["b"]],
    ["or", { $or: [{ price: { $eq: 30 } }, { category: { $eq: "videos" } }] }, ["a", "d"]],
    ["not", { $not: { category: { $eq: "books" } } }, ["d"]],
  ];
  it.each(filters)(
    "supports portable %s filters",
    async (_name, filter, expected) => {
      await seed();
      const result = await client.search.search(store, currentIndex(), { filter, topK: 10 });
      expect(result.hits.map((hit) => hit.document.id).sort()).toEqual(expected);
    },
    30_000,
  );

  it("reports per-item failures while keeping valid documents, including entirely invalid and empty batches", async () => {
    const name = currentIndex();
    const invalid: SearchDocument<unknown>[] = [
      { id: "array", content: [] },
      { id: "null", content: null },
      { id: "number", content: 42 },
      { id: "text", content: "not an object" },
      { id: "absent" },
    ];
    const result = await client.search.indexDocuments<unknown>(store, name, [products[0], ...invalid], wait);
    expect(result.ack).toBe("completed");
    expect(result.failedItems.map((item) => item.id).sort()).toEqual(invalid.map((item) => item.id).sort());
    for (const failure of result.failedItems) {
      expect(failure.errorCode).toBe(3);
      expect(failure.errorMessage.length).toBeGreaterThan(0);
    }
    expect(
      (
        await client.search.getDocuments(store, name, ["a", ...invalid.map((item) => item.id)], {
          includeContent: true,
        })
      ).map((document) => document.id),
    ).toEqual(["a"]);
    const rejected = await client.search.indexDocuments(store, name, invalid);
    expect(rejected.ack).toBe("completed");
    expect(rejected.failedItems).toHaveLength(invalid.length);
    expect(await client.search.indexDocuments(store, name, [])).toEqual({ ack: "completed", failedItems: [] });
    expect((await client.search.getIndex(store, name)).documentCount).toBe(1);
  }, 30_000);

  it("returns queued acknowledgements by default and eventually exposes indexing and deletion", async () => {
    const name = currentIndex();
    expect(await client.search.indexDocuments(store, name, [products[0]])).toEqual({ ack: "queued", failedItems: [] });
    await eventually(async () => (await client.search.getDocuments(store, name, ["a"])).length === 1);
    expect(await client.search.deleteDocuments(store, name, ["a"])).toBe("queued");
    await eventually(async () => (await client.search.getDocuments(store, name, ["a"])).length === 0);
  }, 60_000);

  it.each(["continueAsync", "failRequest"] as const)(
    "honors %s when the provider wait limit expires, without assuming work was canceled",
    async (onWaitTimeout) => {
      const name = currentIndex();
      const options: IndexingOptions = {
        mode: "waitForCompletion",
        waitTimeout: "0.000000001s",
        onWaitTimeout,
      };
      const indexing = client.search.indexDocuments(store, name, [products[0]], options);
      if (onWaitTimeout === "continueAsync") {
        await expect(indexing).resolves.toEqual({ ack: "queued", failedItems: [] });
      } else {
        await expect(indexing).rejects.toThrow('"status":504');
      }
      await eventually(async () => (await client.search.getDocuments(store, name, ["a"])).length === 1);

      const deletion = client.search.deleteDocuments(store, name, ["a"], options);
      if (onWaitTimeout === "continueAsync") {
        await expect(deletion).resolves.toBe("queued");
      } else {
        await expect(deletion).rejects.toThrow('"status":504');
      }
      await eventually(async () => (await client.search.getDocuments(store, name, ["a"])).length === 0);
    },
    60_000,
  );

  it("rejects duplicate write IDs before indexing any document and recovers", async () => {
    await expect(
      client.search.indexDocuments(store, currentIndex(), [products[0], products[0], products[1]], wait),
    ).rejects.toThrow('"status":400');
    expect((await client.search.getIndex(store, currentIndex())).documentCount).toBe(0);
    await seed();
    expect((await client.search.getIndex(store, currentIndex())).documentCount).toBe(4);
  }, 30_000);

  it("preserves provider errors and isolates simultaneous success and failure", async () => {
    await seed();
    await expect(client.search.getIndex(store, `missing-${randomUUID()}`)).rejects.toThrow('"status":404');
    const [valid, invalid] = await Promise.allSettled([
      client.search.search(store, currentIndex(), { text: "Dapr", topK: 10 }),
      client.search.search(store, currentIndex(), { filter: { category: { $invalid: "books" } } }),
    ]);
    expect(valid.status).toBe("fulfilled");
    if (valid.status === "fulfilled") {
      expect(valid.value.hits).toHaveLength(4);
    }
    expect(invalid.status).toBe("rejected");
    if (invalid.status === "rejected") {
      expect(invalid.reason).toBeInstanceOf(Error);
      expect(invalid.reason.message).toContain('"status":400');
    }
    expect((await client.search.search(store, currentIndex())).hits).toHaveLength(4);
  }, 30_000);

  it("surfaces missing stores for every operation", async () => {
    const missing = `missing-${randomUUID()}`;
    const name = currentIndex();
    for (const operation of [
      () => client.search.createIndex(missing, name),
      () => client.search.getIndex(missing, name),
      () => client.search.listIndexes(missing),
      () => client.search.deleteIndex(missing, name),
      () => client.search.indexDocuments(missing, name, products),
      () => client.search.getDocuments(missing, name, ["a"]),
      () => client.search.deleteDocuments(missing, name, ["a"]),
      () => client.search.search(missing, name),
    ]) {
      await expect(operation()).rejects.toThrow("ERR_SEARCH_STORE_NOT_FOUND");
    }
    expect((await client.search.getIndex(store, name)).index).toBe(name);
  });

  it("rejects invalid sidecar credentials and caller cancellation without affecting authenticated requests", async () => {
    const unauthorized = new DaprClient({ ...client.options, daprApiToken: "incorrect-token" });
    clients.push(unauthorized);
    if (!(unauthorized.daprClient instanceof HTTPClient)) {
      throw new Error("Expected HTTP transport");
    }
    unauthorized.daprClient.setIsInitialized(true);
    await expect(unauthorized.search.listIndexes(store)).rejects.toThrow('"status":401');
    const controller = new AbortController();
    controller.abort();
    await expect(
      client.search.indexDocuments(store, currentIndex(), products, { signal: controller.signal }),
    ).rejects.toThrow();
    expect((await client.search.getIndex(store, currentIndex())).documentCount).toBe(0);
    await seed();
    expect((await client.search.search(store, currentIndex())).hits).toHaveLength(4);
  }, 30_000);
});

async function eventually(condition: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (await condition()) {
      return;
    }
    await delay(100);
  }
  throw new Error("Search provider did not make the accepted write visible within 25 seconds");
}

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

import { getEventListeners } from "node:events";
import { createServer, Server, ServerResponse } from "node:http";
import fetch, { Headers, Response } from "node-fetch";
import {
  CommunicationProtocolEnum,
  DaprClient,
  HTTPClient,
  IndexingOptions,
  SearchOptions,
  SearchQuery,
  withBaggage,
} from "../../../../src";

const root = "http://127.0.0.1:3500/v1.0-alpha1/search/store/indexes";

function operations(client: DaprClient, store: string, index: string, options?: SearchOptions) {
  return [
    () => client.search.createIndex(store, index, options),
    () => client.search.getIndex(store, index, options),
    () => client.search.listIndexes(store, options),
    () => client.search.deleteIndex(store, index, options),
    () => client.search.indexDocuments(store, index, [{ id: "a", content: { title: "Dapr" } }], options),
    () => client.search.getDocuments(store, index, ["a"], options),
    () => client.search.deleteDocuments(store, index, ["a"], options),
    () => client.search.search(store, index, undefined, options),
  ];
}

describe("HTTP Search", () => {
  let client: DaprClient;
  let transport: HTTPClient;
  let request: jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>>;

  beforeEach(() => {
    client = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      daprHost: "127.0.0.1",
      daprPort: "3500",
      daprApiToken: "test-token",
    });
    if (!(client.daprClient instanceof HTTPClient)) {
      throw new Error("Expected HTTP transport");
    }
    transport = client.daprClient;
    transport.setIsInitialized(true);
    request = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(async () => new Response("{}"));
    jest.spyOn(transport, "getClient").mockResolvedValue(Object.assign(request, fetch));
  });

  afterEach(async () => {
    await client.stop();
    jest.restoreAllMocks();
  });

  function respond(body: unknown) {
    request.mockResolvedValueOnce(new Response(JSON.stringify(body)));
  }

  function sent(index = 0) {
    const [url, options] = request.mock.calls[index];
    return {
      url,
      method: options?.method,
      body: options?.body === undefined ? undefined : JSON.parse(String(options.body)),
    };
  }

  it("uses the exact index routes and puts metadata in bodies or query strings as required", async () => {
    const metadata = Object.freeze({ "key &": "value +/%?#\u00e9", empty: "" });
    const options = Object.freeze({ metadata });
    const store = "store /%?#\\";
    const index = "index /%?#\\";
    const path = "http://127.0.0.1:3500/v1.0-alpha1/search/store%20%2F%25%3F%23%5C/indexes/index%20%2F%25%3F%23%5C";
    const query = "?metadata.key+%26=value+%2B%2F%25%3F%23%C3%A9&metadata.empty=";
    request.mockResolvedValueOnce(new Response(undefined, { status: 204 }));
    await expect(client.search.createIndex(store, index, options)).resolves.toBeUndefined();
    respond({ index, documentCount: "12", properties: { backend: "meili" } });
    await expect(client.search.getIndex(store, index, options)).resolves.toEqual({
      index,
      documentCount: 12,
      properties: { backend: "meili" },
    });
    respond({ indexes: ["first", "second"] });
    await expect(client.search.listIndexes(store, options)).resolves.toEqual(["first", "second"]);
    await expect(client.search.deleteIndex(store, index, options)).resolves.toBeUndefined();
    expect(sent(0)).toEqual({ url: path, method: "POST", body: { metadata } });
    expect(sent(1)).toEqual({ url: path + query, method: "GET", body: undefined });
    expect(sent(2)).toEqual({
      url: path.slice(0, path.lastIndexOf("/")) + query,
      method: "GET",
      body: undefined,
    });
    expect(sent(3)).toEqual({ url: path + query, method: "DELETE", body: undefined });
  });

  it("preserves empty/default index fields and does not append an empty query string", async () => {
    respond({ index: "index" });
    await expect(client.search.getIndex("store", "index")).resolves.toEqual({
      index: "index",
      documentCount: 0,
      properties: {},
    });
    await expect(client.search.listIndexes("store")).resolves.toEqual([]);
    await client.search.createIndex("store", "index");
    await client.search.deleteIndex("store", "index");
    expect(sent(0)).toEqual({ url: `${root}/index`, method: "GET", body: undefined });
    expect(sent(1)).toEqual({ url: root, method: "GET", body: undefined });
    expect(sent(2)).toEqual({ url: `${root}/index`, method: "POST", body: {} });
    expect(sent(3)).toEqual({ url: `${root}/index`, method: "DELETE", body: undefined });
  });

  it("encodes documents as base64 UTF-8 JSON, separating request and stored metadata", async () => {
    const content = Object.freeze({ title: "Dapr", nested: [null, false, 0, "\u00e9 \ud83d\udcda"] });
    const stored = Object.freeze(JSON.parse('{"__proto__":"stored","source":"unit"}'));
    const documents = Object.freeze([Object.freeze({ id: "a /%?#", content, metadata: stored })]);
    respond({ ack: "INDEX_ACK_COMPLETED", failedItems: [] });
    await expect(
      client.search.indexDocuments("store", "index", documents, { metadata: { tenant: "request" } }),
    ).resolves.toEqual({ ack: "completed", failedItems: [] });
    const body = sent().body;
    expect(sent().url).toBe(`${root}/index/documents`);
    expect(sent().method).toBe("POST");
    expect(body).toEqual({
      documents: [{ id: "a /%?#", content: Buffer.from(JSON.stringify(content)).toString("base64"), metadata: stored }],
      metadata: { tenant: "request" },
    });
    expect(body.documents[0].metadata).toHaveProperty("__proto__", "stored");
    expect(body).not.toHaveProperty("storeName");
    expect(body).not.toHaveProperty("index");
  });

  it("uses the building block's JSON format rather than the client's custom serializer", async () => {
    const serialize = jest.fn(() => "not JSON");
    const deserialize = jest.fn(() => {
      throw new Error("Custom serializer must not be used");
    });
    client.options.serializer = { contentType: "text/plain", serialize, deserialize };
    respond({ ack: "INDEX_ACK_COMPLETED" });
    await client.search.indexDocuments("store", "index", [{ id: "a", content: { title: "Dapr" } }]);
    expect(sent().body.documents[0].content).toBe("eyJ0aXRsZSI6IkRhcHIifQ==");
    respond({ documents: [{ id: "a", content: "eyJ0aXRsZSI6IkRhcHIifQ==" }] });
    await expect(client.search.getDocuments("store", "index", ["a"], { includeContent: true })).resolves.toEqual([
      { id: "a", content: { title: "Dapr" }, metadata: {} },
    ]);
    expect(serialize).not.toHaveBeenCalled();
    expect(deserialize).not.toHaveBeenCalled();
  });

  it.each([undefined, null, false, 0, "text", []].map((value) => [value]))(
    "leaves non-object content %j to the runtime's item-failure model",
    async (content) => {
      respond({ ack: "INDEX_ACK_COMPLETED" });
      await client.search.indexDocuments("store", "index", [{ id: "bad", content }]);
      expect(JSON.parse(Buffer.from(sent().body.documents[0].content, "base64").toString())).toEqual(content ?? null);
    },
  );

  it.each([
    ["INDEX_ACK_QUEUED", "queued"],
    ["INDEX_ACK_COMPLETED", "completed"],
    [1, "queued"],
    [2, "completed"],
  ])("preserves acknowledgement %s for both writes", async (wire, expected) => {
    respond({ ack: wire });
    await expect(client.search.indexDocuments("store", "index", [])).resolves.toEqual({
      ack: expected,
      failedItems: [],
    });
    respond({ ack: wire });
    await expect(client.search.deleteDocuments("store", "index", [])).resolves.toBe(expected);
    expect(sent(0).body).toEqual({ documents: [] });
    expect(sent(1)).toEqual({
      url: `${root}/index/documents/delete`,
      method: "POST",
      body: { ids: [] },
    });
  });

  it.each(["INDEX_ACK_QUEUED", "INDEX_ACK_COMPLETED"])("preserves rich item failures with %s", async (ack) => {
    const details = [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        reason: "INVALID_CONTENT",
        domain: "search",
        metadata: { provider: "meilisearch" },
      },
      { "@type": "type.googleapis.com/custom.Detail", nested: { values: [null, false, 1] } },
    ];
    respond({
      ack,
      failedItems: [
        { id: "bad", error: { code: 3, message: "Expected an object", details } },
        { id: "other", error: { code: 13 } },
      ],
    });
    const response = await client.search.indexDocuments("store", "index", []);
    expect(response.failedItems).toEqual([
      { id: "bad", errorCode: 3, errorMessage: "Expected an object", details },
      { id: "other", errorCode: 13, errorMessage: "", details: [] },
    ]);
  });

  it.each([
    ["continueAsync", "INDEXING_WAIT_TIMEOUT_ACTION_CONTINUE_ASYNC"],
    ["failRequest", "INDEXING_WAIT_TIMEOUT_ACTION_FAIL_REQUEST"],
  ] as const)("maps %s wait policies for indexing and deletion", async (onWaitTimeout, wireAction) => {
    const options: IndexingOptions = Object.freeze({
      mode: "waitForCompletion" as const,
      waitTimeout: "1.001000009s",
      onWaitTimeout,
      metadata: { tenant: "a" },
    });
    respond({ ack: "INDEX_ACK_COMPLETED" });
    await client.search.indexDocuments("store", "index", [{ id: "a", content: {} }], options);
    respond({ ack: "INDEX_ACK_COMPLETED" });
    await client.search.deleteDocuments("store", "index", ["a", "missing"], options);
    for (const i of [0, 1]) {
      expect(sent(i).body.options).toEqual({
        mode: "INDEXING_MODE_WAIT_FOR_COMPLETION",
        waitTimeout: "1.001000009s",
        onWaitTimeout: wireAction,
      });
      expect(sent(i).body.metadata).toEqual({ tenant: "a" });
    }
    expect(sent(1).body.ids).toEqual(["a", "missing"]);
  });

  it.each(["0.000000001s", "315576000000s"])("preserves exact duration boundary %s", async (waitTimeout) => {
    respond({ ack: 2 });
    await client.search.deleteDocuments("store", "index", [], {
      mode: "waitForCompletion",
      waitTimeout,
      onWaitTimeout: "failRequest",
    });
    expect(sent().body.options.waitTimeout).toBe(waitTimeout);
  });

  it("maps explicit acceptance without accidentally requesting completion", async () => {
    respond({ ack: 1 });
    await client.search.indexDocuments("store", "index", [], { mode: "returnOnAcceptance" });
    expect(sent().body.options).toEqual({ mode: "INDEXING_MODE_RETURN_ON_ACCEPTANCE" });
    respond({ ack: 1 });
    await client.search.deleteDocuments("store", "index", [], {});
    expect(sent(1).body).toEqual({ ids: [] });
  });

  it.each([undefined, false, true])(
    "preserves includeContent=%s and returned document order",
    async (includeContent) => {
      respond({
        documents: [
          { id: "b", content: "eyJ0aXRsZSI6IkRhcHIifQ==", metadata: { source: "b" } },
          { id: "a", content: "", metadata: { source: "a" } },
        ],
      });
      await expect(
        client.search.getDocuments<{ title: string }>("store", "index", ["missing", "b", "a"], {
          includeContent,
          metadata: { tenant: "read" },
        }),
      ).resolves.toEqual([
        { id: "b", content: { title: "Dapr" }, metadata: { source: "b" } },
        { id: "a", content: undefined, metadata: { source: "a" } },
      ]);
      expect(sent()).toEqual({
        url: `${root}/index/documents/get`,
        method: "POST",
        body: {
          ids: ["missing", "b", "a"],
          ...(includeContent === undefined ? {} : { includeContent }),
          metadata: { tenant: "read" },
        },
      });
    },
  );

  it("normalizes empty document responses and absent content", async () => {
    await expect(client.search.getDocuments("store", "index", [])).resolves.toEqual([]);
    respond({ documents: [{ id: "a" }, { id: "b", content: null, metadata: null }] });
    await expect(client.search.getDocuments("store", "index", ["a", "b"])).resolves.toEqual([
      { id: "a", content: undefined, metadata: {} },
      { id: "b", content: undefined, metadata: {} },
    ]);
  });

  it("maps every portable query field, projections, highlights, totals, and continuation tokens", async () => {
    const query = Object.freeze<SearchQuery>({
      text: "Dapr",
      filter: { $and: [{ category: { $eq: "books" } }, { "details.price": { $gte: 0 } }] },
      topK: 2,
      continuationToken: "opaque +/%?#",
      returnFields: Object.freeze(["title", "details.price"]),
      includeContent: true,
      searchFields: Object.freeze(["title"]),
      sort: Object.freeze([{ field: "details.price" }, { field: "title", order: "desc" as const }]),
      highlightFields: Object.freeze(["title"]),
    });
    respond({
      hits: [
        {
          document: { id: "b", content: "eyJ0aXRsZSI6IkRhcHIifQ==", metadata: { source: "a" } },
          score: 0.75,
          highlights: { title: "<em>Dapr</em>" },
        },
      ],
      totalHits: "3",
      totalHitsRelation: "TOTAL_HITS_RELATION_ESTIMATE",
      continuationToken: "next-page",
    });
    await expect(client.search.search("store", "index", query, { metadata: { tenant: "query" } })).resolves.toEqual({
      hits: [
        {
          document: { id: "b", content: { title: "Dapr" }, metadata: { source: "a" } },
          score: 0.75,
          highlights: { title: "<em>Dapr</em>" },
        },
      ],
      totalHits: 3,
      totalHitsRelation: "estimate",
      continuationToken: "next-page",
    });
    expect(sent()).toEqual({
      url: `${root}/index/query`,
      method: "POST",
      body: {
        metadata: { tenant: "query" },
        query: {
          ...query,
          sort: [
            { field: "details.price", order: "SORT_ORDER_ASC" },
            { field: "title", order: "SORT_ORDER_DESC" },
          ],
        },
      },
    });
  });

  it("preserves native query objects, including reserved protobuf-looking property names", async () => {
    const native = JSON.parse(
      '{"q":"Dapr","nested":{"@type":"not-a-proto","fields":{"value":[null,false,0]}},"__proto__":{"x":"y"}}',
    );
    await client.search.search("store", "index", { native });
    expect(sent().body.query).toEqual({ native });
    expect(sent().body.query.native).toHaveProperty("__proto__", { x: "y" });
  });

  it("distinguishes omitted queries and optional defaults without inventing totals", async () => {
    await expect(client.search.search("store", "index")).resolves.toEqual({
      hits: [],
      totalHits: undefined,
      totalHitsRelation: "unspecified",
      continuationToken: undefined,
    });
    expect(sent().body).toEqual({});
    await client.search.search("store", "index", {});
    expect(sent(1).body).toEqual({ query: {} });
    await client.search.search("store", "index", {
      text: "",
      topK: 0,
      includeContent: false,
      continuationToken: "",
      returnFields: [],
      searchFields: [],
      highlightFields: [],
      sort: [],
    });
    expect(sent(2).body.query).toEqual({
      text: "",
      topK: 0,
      includeContent: false,
      continuationToken: "",
      returnFields: [],
      searchFields: [],
      highlightFields: [],
      sort: [],
    });
  });

  it("accepts the uint32 page-size boundary", async () => {
    await client.search.search("store", "index", { topK: 4294967295 });
    expect(sent().body.query.topK).toBe(4294967295);
  });

  it.each([
    [undefined, "unspecified"],
    [null, "unspecified"],
    [0, "unspecified"],
    [1, "exact"],
    [2, "lowerBound"],
    [3, "estimate"],
    ["TOTAL_HITS_RELATION_UNSPECIFIED", "unspecified"],
    ["TOTAL_HITS_RELATION_EXACT", "exact"],
    ["TOTAL_HITS_RELATION_LOWER_BOUND", "lowerBound"],
    ["TOTAL_HITS_RELATION_ESTIMATE", "estimate"],
  ])("maps total-hits relation %s", async (wire, expected) => {
    respond({ totalHitsRelation: wire, hits: [{ document: { id: "a" } }] });
    const response = await client.search.search("store", "index");
    expect(response.totalHitsRelation).toBe(expected);
    expect(response.hits).toEqual([
      { document: { id: "a", content: undefined, metadata: {} }, score: 0, highlights: {} },
    ]);
  });

  it.each([0, "0", Number.MAX_SAFE_INTEGER, "9007199254740991"])("preserves safe count %s exactly", async (value) => {
    respond({ index: "index", documentCount: value });
    expect((await client.search.getIndex("store", "index")).documentCount).toBe(Number(value));
    respond({ totalHits: value, continuationToken: "" });
    const result = await client.search.search("store", "index");
    expect(result.totalHits).toBe(Number(value));
    expect(result.continuationToken).toBe("");
  });

  it.each([undefined, null, "", " \t", 0, ".", ".."])(
    "rejects invalid store %j before any HTTP call",
    async (store) => {
      for (const operation of operations(client, store as never, "index")) {
        await expect(operation()).rejects.toThrow();
      }
      expect(request).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, null, "", " \t", 0, ".", ".."])(
    "rejects invalid index %j on every index operation",
    async (index) => {
      const calls = operations(client, "store", index as never);
      for (const i of [0, 1, 3, 4, 5, 6, 7]) {
        await expect(calls[i]()).rejects.toThrow();
      }
      expect(request).not.toHaveBeenCalled();
    },
  );

  it.each([null, undefined, {}, "a", 42])("rejects non-array collections %j", async (value) => {
    await expect(client.search.indexDocuments("store", "index", value as never)).rejects.toThrow();
    await expect(client.search.getDocuments("store", "index", value as never)).rejects.toThrow();
    await expect(client.search.deleteDocuments("store", "index", value as never)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([null, undefined, "", "  ", 0, false])("rejects invalid document IDs %j", async (id) => {
    await expect(client.search.indexDocuments("store", "index", [{ id: id as never }])).rejects.toThrow();
    await expect(client.search.getDocuments("store", "index", [id as never])).rejects.toThrow();
    await expect(client.search.deleteDocuments("store", "index", [id as never])).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([null, undefined, [], "document"].map((value) => [value]))("rejects malformed document %j", async (value) => {
    await expect(client.search.indexDocuments("store", "index", [value as never])).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it("rejects non-serializable content before submitting any part of a batch", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    for (const content of [circular, 1n, () => {}, Symbol("not-json")]) {
      await expect(
        client.search.indexDocuments("store", "index", [
          { id: "good", content: {} },
          { id: "bad", content },
        ]),
      ).rejects.toThrow();
    }
    expect(request).not.toHaveBeenCalled();
  });

  it.each(
    [null, [], "query", { text: "", native: {} }, { text: null }, { continuationToken: 3 }].map((value) => [value]),
  )("rejects invalid query %j", async (query) => {
    await expect(client.search.search("store", "index", query as never)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each(
    [null, [], "filter", 0, new Date(0), { n: NaN }, { n: undefined }, { n: () => {} }, { n: Symbol() }].map(
      (value) => [value],
    ),
  )("rejects non-JSON object query options %j", async (value) => {
    for (const key of ["filter", "native"]) {
      await expect(client.search.search("store", "index", { [key]: value } as never)).rejects.toThrow();
    }
    expect(request).not.toHaveBeenCalled();
  });

  it("rejects cyclic/bigint/sparse JSON but accepts shared references", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    for (const native of [circular, { value: 1n }, { value: Array(1) }]) {
      await expect(client.search.search("store", "index", { native } as never)).rejects.toThrow();
    }
    expect(request).not.toHaveBeenCalled();
    const shared = Object.freeze({ $eq: "book" });
    await client.search.search("store", "index", { filter: { first: shared, second: shared } });
    expect(sent().body.query.filter).toEqual({ first: { $eq: "book" }, second: { $eq: "book" } });
  });

  it.each([-1, 0.5, 4294967296, Infinity, NaN, null, "2"])("rejects invalid topK %s", async (topK) => {
    await expect(client.search.search("store", "index", { topK: topK as never })).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([null, "title", [""], [" "], [null], [3]].map((value) => [value]))(
    "rejects invalid field lists %j",
    async (value) => {
      for (const key of ["returnFields", "searchFields", "highlightFields"]) {
        await expect(client.search.search("store", "index", { [key]: value })).rejects.toThrow();
      }
      expect(request).not.toHaveBeenCalled();
    },
  );

  it.each([null, {}, [null], [{}], [{ field: "" }], [{ field: "title", order: "up" }]].map((value) => [value]))(
    "rejects invalid sort %j",
    async (sort) => {
      await expect(client.search.search("store", "index", { sort: sort as never })).rejects.toThrow();
      expect(request).not.toHaveBeenCalled();
    },
  );

  it.each([null, 0, "true"])("rejects invalid includeContent %j for retrieval and search", async (includeContent) => {
    await expect(
      client.search.getDocuments("store", "index", [], { includeContent: includeContent as never }),
    ).rejects.toThrow();
    await expect(client.search.search("store", "index", { includeContent: includeContent as never })).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each(
    [
      null,
      [],
      { mode: "unknown" },
      { waitTimeout: "1s" },
      { onWaitTimeout: "failRequest" },
      { mode: "returnOnAcceptance", waitTimeout: "1s" },
      { mode: "waitForCompletion" },
      { mode: "waitForCompletion", waitTimeout: "1s" },
      { mode: "waitForCompletion", waitTimeout: "1s", onWaitTimeout: "unknown" },
      ...[undefined, null, 1, "0s", "-1s", "-0.001s", "1ms", "1.0000000001s", "315576000001s"].map((waitTimeout) => ({
        mode: "waitForCompletion",
        waitTimeout,
        onWaitTimeout: "failRequest",
      })),
    ].map((value) => [value]),
  )("rejects invalid write policy %j on both writes", async (options) => {
    await expect(client.search.indexDocuments("store", "index", [], options as never)).rejects.toThrow();
    await expect(client.search.deleteDocuments("store", "index", [], options as never)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([null, [], "metadata", { value: 1 }, { value: undefined }].map((value) => [value]))(
    "rejects invalid metadata %j",
    async (metadata) => {
      for (const operation of operations(client, "store", "index", { metadata: metadata as never })) {
        await expect(operation()).rejects.toThrow();
      }
      await expect(
        client.search.indexDocuments("store", "index", [{ id: "a", metadata: metadata as never }]),
      ).rejects.toThrow();
      expect(request).not.toHaveBeenCalled();
    },
  );

  it.each([null, [], "options"].map((value) => [value]))("rejects invalid common options %j", async (options) => {
    for (const operation of operations(client, "store", "index", options as never)) {
      await expect(operation()).rejects.toThrow();
    }
    expect(request).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 0, 42, "INDEX_ACK_UNSPECIFIED", "unknown"])(
    "never treats invalid acknowledgement %j as success",
    async (ack) => {
      respond({ ack });
      await expect(client.search.indexDocuments("store", "index", [])).rejects.toThrow("acknowledgement");
      respond({ ack });
      await expect(client.search.deleteDocuments("store", "index", [])).rejects.toThrow("acknowledgement");
    },
  );

  it.each([
    null,
    {},
    { id: "a" },
    { id: "a", error: { code: 0 } },
    { id: "a", error: { code: 17 } },
    { id: "a", error: { code: 1.5 } },
    { id: "a", error: { code: "3" } },
    { id: "a", error: { code: 3, message: 1 } },
    { id: "a", error: { code: 3, details: {} } },
    { id: "a", error: { code: 3, details: [{}] } },
    { id: "a", error: { code: 3, details: [{ "@type": "" }] } },
  ])("rejects malformed item failure %j", async (failure) => {
    respond({ ack: 2, failedItems: [failure] });
    await expect(client.search.indexDocuments("store", "index", [])).rejects.toThrow();
  });

  it.each(["", "not-json", null, [], 42, true].map((value) => [value]))(
    "rejects malformed response envelope %j",
    async (response) => {
      for (const operation of [
        () => client.search.getIndex("store", "index"),
        () => client.search.listIndexes("store"),
        () => client.search.getDocuments("store", "index", []),
        () => client.search.indexDocuments("store", "index", []),
        () => client.search.deleteDocuments("store", "index", []),
        () => client.search.search("store", "index"),
      ]) {
        respond(response);
        await expect(operation()).rejects.toThrow();
      }
    },
  );

  it.each([{}, { indexes: "index" }, { indexes: [null] }])(
    "rejects malformed index data where required: %j",
    async (value) => {
      respond(value);
      await expect(client.search.getIndex("store", "index")).rejects.toThrow();
      if ("indexes" in value) {
        respond(value);
        await expect(client.search.listIndexes("store")).rejects.toThrow();
      }
    },
  );

  it.each([
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    "9007199254740992",
    "18446744073709551615",
    "18446744073709551616",
    "-1",
    "1.1",
    "NaN",
    "Infinity",
    "",
    " ",
    "1e3",
    true,
    {},
  ])("rejects invalid or lossy count %j", async (value) => {
    respond({ index: "index", documentCount: value });
    await expect(client.search.getIndex("store", "index")).rejects.toThrow();
    respond({ totalHits: value });
    await expect(client.search.search("store", "index")).rejects.toThrow();
  });

  it.each([
    null,
    {},
    { id: "a", content: {} },
    { id: "a", content: "***" },
    { id: "a", content: "bm90LWpzb24=" },
    { id: "a", content: "eyJ4Ijoi/yJ9" },
    { id: "a", metadata: { source: 1 } },
  ])("rejects malformed documents without returning partial results: %j", async (value) => {
    respond({ documents: [{ id: "good" }, value] });
    await expect(client.search.getDocuments("store", "index", ["good", "bad"])).rejects.toThrow();
    respond({ hits: [{ document: { id: "good" } }, { document: value }] });
    await expect(client.search.search("store", "index")).rejects.toThrow();
  });

  it.each([
    { hits: "invalid" },
    { hits: [null] },
    { hits: [{ document: { id: "a" }, score: "NaN" }] },
    { hits: [{ document: { id: "a" }, highlights: { title: 3 } }] },
    { continuationToken: 1 },
    { totalHitsRelation: 4 },
    { totalHitsRelation: "EXACT" },
  ])("rejects malformed search fields %j and can recover on the next call", async (response) => {
    respond(response);
    await expect(client.search.search("store", "index")).rejects.toThrow();
    await expect(client.search.search("store", "index")).resolves.toMatchObject({ hits: [] });
  });

  it.each([400, 401, 403, 404, 409, 429, 500, 503, 504])(
    "preserves HTTP %i errors on all operations without retries or success fallbacks",
    async (status) => {
      const calls = operations(client, "store", "index");
      const body = JSON.stringify({
        errorCode: "PROVIDER_ERROR",
        message: 'provider detail: "invalid" \u00e9',
        details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason: "INVALID_QUERY" }],
      });
      for (const operation of calls) {
        request.mockResolvedValueOnce(new Response(body, { status, statusText: "Provider failure" }));
        await expect(operation()).rejects.toThrow(
          new Error(JSON.stringify({ error: "Provider failure", error_msg: body, status })),
        );
      }
      expect(request).toHaveBeenCalledTimes(calls.length);
      await expect(client.search.search("store", "index")).resolves.toMatchObject({ hits: [] });
    },
  );

  it("preserves network errors and does not retry writes", async () => {
    const error = new Error("connection closed");
    request.mockRejectedValueOnce(error);
    await expect(client.search.indexDocuments("store", "index", [])).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("propagates authentication, SDK identity, baggage, and signals through the existing HTTP transport", async () => {
    const controller = new AbortController();
    await withBaggage({ tenant: "search tests" }, () =>
      client.search.search("store", "index", undefined, { signal: controller.signal }),
    );
    const headers = new Headers(request.mock.calls[0][1]?.headers);
    expect(headers.get("dapr-api-token")).toBe("test-token");
    expect(headers.get("user-agent")).toMatch(/^dapr-sdk-js\/.+ http\/1$/);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("baggage")).toBe("tenant=search%20tests");
    expect(request.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it("rejects every pre-canceled operation without initializing or contacting the sidecar", async () => {
    const controller = new AbortController();
    const reason = new Error("caller canceled");
    controller.abort(reason);
    for (const operation of operations(client, "store", "index", { signal: controller.signal })) {
      await expect(operation()).rejects.toBe(reason);
    }
    expect(transport.getClient).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it("does not send a request if cancellation occurs during transport initialization", async () => {
    const controller = new AbortController();
    jest.spyOn(transport, "getClient").mockImplementationOnce(async () => {
      controller.abort();
      return Object.assign(request, fetch);
    });
    await expect(client.search.listIndexes("store", { signal: controller.signal })).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it("cancels promptly while initialization is pending and removes its abort listener", async () => {
    const controller = new AbortController();
    const reason = new Error("cancel while waiting");
    const removed = jest.spyOn(controller.signal, "removeEventListener");
    let finish: ((value: typeof fetch) => void) | undefined;
    const initialization = new Promise<typeof fetch>((resolve) => {
      finish = resolve;
    });
    jest.spyOn(transport, "getClient").mockReturnValueOnce(initialization);
    const pending = client.search.listIndexes("store", { signal: controller.signal });
    const rejected = expect(pending).rejects.toBe(reason);
    controller.abort(reason);
    try {
      await rejected;
      expect(removed).toHaveBeenCalledWith("abort", expect.any(Function));
    } finally {
      finish?.(Object.assign(request, fetch));
    }
    await initialization;
    await new Promise((resolve) => setImmediate(resolve));
    expect(request).not.toHaveBeenCalled();
    await expect(client.search.listIndexes("store")).resolves.toEqual([]);
  });

  it("propagates initialization failures and removes listeners on failure and success", async () => {
    const controller = new AbortController();
    const added = jest.spyOn(controller.signal, "addEventListener");
    const removed = jest.spyOn(controller.signal, "removeEventListener");
    const failure = new Error("sidecar unavailable");
    jest.spyOn(transport, "getClient").mockRejectedValueOnce(failure);
    await expect(client.search.listIndexes("store", { signal: controller.signal })).rejects.toBe(failure);
    expect(request).not.toHaveBeenCalled();
    expect(removed).toHaveBeenCalledWith("abort", added.mock.calls[0][1]);
    await expect(client.search.listIndexes("store", { signal: controller.signal })).resolves.toEqual([]);
    expect(removed).toHaveBeenCalledWith("abort", added.mock.calls[1][1]);
  });

  it("cancels only one caller while concurrent requests wait for initialization", async () => {
    const canceledController = new AbortController();
    const activeController = new AbortController();
    const reason = new Error("cancel only this caller");
    let finish!: (value: typeof fetch) => void;
    const initialization = new Promise<typeof fetch>((resolve) => {
      finish = resolve;
    });
    jest.spyOn(transport, "getClient").mockReturnValue(initialization);
    const canceled = client.search.listIndexes("canceled", { signal: canceledController.signal });
    const active = client.search.listIndexes("active", { signal: activeController.signal });
    const withoutSignal = client.search.listIndexes("without-signal");
    const settled = Promise.allSettled([canceled, active, withoutSignal]);

    try {
      canceledController.abort(reason);
      await expect(canceled).rejects.toBe(reason);
      expect(request).not.toHaveBeenCalled();
      expect(getEventListeners(canceledController.signal, "abort")).toHaveLength(0);
      expect(getEventListeners(activeController.signal, "abort")).toHaveLength(1);
    } finally {
      finish(Object.assign(request, fetch));
    }

    expect(await settled).toEqual([
      { status: "rejected", reason },
      { status: "fulfilled", value: [] },
      { status: "fulfilled", value: [] },
    ]);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.map(([url]) => url)).toEqual(
      expect.arrayContaining([
        "http://127.0.0.1:3500/v1.0-alpha1/search/active/indexes",
        "http://127.0.0.1:3500/v1.0-alpha1/search/without-signal/indexes",
      ]),
    );
    expect(activeController.signal.aborted).toBe(false);
    expect(getEventListeners(activeController.signal, "abort")).toHaveLength(0);
  });

  it("isolates cancellation from a later initialization failure for concurrent callers", async () => {
    const canceledController = new AbortController();
    const activeController = new AbortController();
    const reason = new Error("caller canceled");
    const failure = new Error("initialization failed after cancellation");
    let fail!: (error: Error) => void;
    const initialization = new Promise<typeof fetch>((_resolve, reject) => {
      fail = reject;
    });
    const getClient = jest.spyOn(transport, "getClient").mockReturnValue(initialization);
    const canceled = client.search.listIndexes("store", { signal: canceledController.signal });
    const active = client.search.listIndexes("store", { signal: activeController.signal });
    const withoutSignal = client.search.listIndexes("store");
    const settled = Promise.allSettled([canceled, active, withoutSignal]);

    try {
      canceledController.abort(reason);
      await expect(canceled).rejects.toBe(reason);
      expect(request).not.toHaveBeenCalled();
    } finally {
      fail(failure);
    }

    await settled;
    await expect(canceled).rejects.toBe(reason);
    await expect(active).rejects.toBe(failure);
    await expect(withoutSignal).rejects.toBe(failure);
    expect(request).not.toHaveBeenCalled();
    expect(activeController.signal.aborted).toBe(false);
    expect(getEventListeners(canceledController.signal, "abort")).toHaveLength(0);
    expect(getEventListeners(activeController.signal, "abort")).toHaveLength(0);
    await new Promise((resolve) => setImmediate(resolve));

    getClient.mockResolvedValue(Object.assign(request, fetch));
    await expect(client.search.listIndexes("store")).resolves.toEqual([]);
  });
});

describe("Search HTTP cancellation on a real connection", () => {
  let server: Server;
  let client: DaprClient;
  let receive: () => void;
  let received: Promise<void>;
  let stallBody: boolean;
  let stall: boolean;
  let stalledResponses: ServerResponse[];
  let requestsToWaitFor: number;

  beforeEach(async () => {
    stall = true;
    stallBody = false;
    stalledResponses = [];
    requestsToWaitFor = 1;
    received = new Promise((resolve) => {
      receive = resolve;
    });
    server = createServer((_request, response) => {
      if (stall) {
        if (stallBody) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.write('{"hits":[');
        }
        stalledResponses.push(response);
        if (stalledResponses.length === requestsToWaitFor) {
          receive();
        }
      } else {
        response.end('{"hits":[]}');
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Expected TCP listener");
    }
    client = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      daprHost: "127.0.0.1",
      daprPort: String(address.port),
    });
    if (!(client.daprClient instanceof HTTPClient)) {
      throw new Error("Expected HTTP transport");
    }
    client.daprClient.setIsInitialized(true);
  });

  afterEach(async () => {
    await client.stop();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it.each([false, true])("cancels pending HTTP work (partial response body: %s) and recovers", async (partialBody) => {
    stallBody = partialBody;
    const controller = new AbortController();
    const pending = client.search.search("store", "index", undefined, { signal: controller.signal });
    const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await received;
    controller.abort();
    await rejected;
    stall = false;
    await expect(client.search.search("store", "index")).resolves.toMatchObject({ hits: [] });
  });

  it.each([false, true])(
    "does not cancel another in-flight request (partial response bodies: %s)",
    async (partialBody) => {
      stallBody = partialBody;
      requestsToWaitFor = 2;
      const canceledController = new AbortController();
      const activeController = new AbortController();
      const canceled = client.search.search("store", "canceled", undefined, { signal: canceledController.signal });
      const active = client.search.search("store", "active", undefined, { signal: activeController.signal });
      const settled = Promise.allSettled([canceled, active]);
      await received;

      canceledController.abort();
      await expect(canceled).rejects.toMatchObject({ name: "AbortError" });
      expect(activeController.signal.aborted).toBe(false);
      const response = stalledResponses.find((entry) => entry.req.url?.endsWith("/active/query"));
      if (response === undefined) {
        throw new Error("The surviving request did not reach the HTTP server");
      }
      response.end(partialBody ? "]}" : '{"hits":[]}');
      await expect(active).resolves.toMatchObject({ hits: [] });
      await settled;
      expect(getEventListeners(canceledController.signal, "abort")).toHaveLength(0);
      expect(getEventListeners(activeController.signal, "abort")).toHaveLength(0);
      stall = false;
      await expect(client.search.search("store", "index")).resolves.toMatchObject({ hits: [] });
    },
  );
});

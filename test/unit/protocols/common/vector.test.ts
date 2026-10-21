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

import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { EmptySchema } from "@bufbuild/protobuf/wkt";
import {
  CommunicationProtocolEnum,
  DaprClient,
  IClientVector,
  LogLevel,
  VectorIndexingOptions,
  VectorQuery,
} from "../../../../src";
import GRPCClient from "../../../../src/implementation/Client/GRPCClient/GRPCClient";
import GRPCClientVector from "../../../../src/implementation/Client/GRPCClient/vector";
import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import HTTPClientVector from "../../../../src/implementation/Client/HTTPClient/vector";
import { IndexAck } from "../../../../src/proto/dapr/proto/runtime/v1/search_pb";
import * as Proto from "../../../../src/proto/dapr/proto/runtime/v1/vector_pb";

const record = {
  id: "a",
  values: [1, -0.25, 3.5],
  payload: Uint8Array.from([0, 255, 128, 123]),
  metadata: { category: "books", nested: { count: 7, tags: [null, true, "tag"] } },
};
const recordJson = { ...record, payload: "AP+Aew==" };
const queryJson = { matches: [{ record: recordJson, score: 0.75 }], metric: "DISTANCE_METRIC_COSINE" };
const wait: VectorIndexingOptions = {
  mode: "waitForCompletion",
  waitTimeout: "2.000000001s",
  onWaitTimeout: "failRequest",
};
const logger = { level: LogLevel.Error };

function queryResponse() {
  return create(Proto.QueryVectorsResponseAlpha1Schema, {
    matches: [{ record, score: 0.75 }],
    metric: Proto.DistanceMetric.COSINE,
  });
}

async function setup(protocol: CommunicationProtocolEnum) {
  const client = new DaprClient({ communicationProtocol: protocol, logger });
  const grpc = new GRPCClient({ logger });
  const transport = await grpc.getClient(false);
  const rpc = {
    createCollectionAlpha1: jest.spyOn(transport, "createCollectionAlpha1").mockResolvedValue(create(EmptySchema)),
    getCollectionAlpha1: jest.spyOn(transport, "getCollectionAlpha1").mockResolvedValue(
      create(Proto.GetCollectionResponseAlpha1Schema, {
        collection: "collection",
        recordCount: 2n,
        dimensions: 3,
        metric: Proto.DistanceMetric.COSINE,
        properties: { provider: "test" },
      }),
    ),
    listCollectionsAlpha1: jest
      .spyOn(transport, "listCollectionsAlpha1")
      .mockResolvedValue(create(Proto.ListCollectionsResponseAlpha1Schema, { collections: ["collection", "other"] })),
    deleteCollectionAlpha1: jest.spyOn(transport, "deleteCollectionAlpha1").mockResolvedValue(create(EmptySchema)),
    upsertVectorsAlpha1: jest
      .spyOn(transport, "upsertVectorsAlpha1")
      .mockResolvedValue(create(Proto.UpsertVectorsResponseAlpha1Schema, { ack: IndexAck.COMPLETED })),
    getVectorsAlpha1: jest
      .spyOn(transport, "getVectorsAlpha1")
      .mockResolvedValue(create(Proto.GetVectorsResponseAlpha1Schema, { records: [record] })),
    deleteVectorsAlpha1: jest
      .spyOn(transport, "deleteVectorsAlpha1")
      .mockResolvedValue(create(Proto.DeleteVectorsResponseAlpha1Schema, { ack: IndexAck.COMPLETED })),
    queryVectorsAlpha1: jest.spyOn(transport, "queryVectorsAlpha1").mockResolvedValue(queryResponse()),
    batchQueryVectorsAlpha1: jest.spyOn(transport, "batchQueryVectorsAlpha1").mockResolvedValue(
      create(Proto.BatchQueryVectorsResponseAlpha1Schema, {
        results: [
          { result: { case: "response", value: queryResponse() } },
          { result: { case: "error", value: { code: 5, message: "missing record" } } },
        ],
      }),
    ),
  };
  const getClient = jest.spyOn(GRPCClient.prototype, "getClient").mockResolvedValue(transport);
  const execute = jest
    .spyOn(HTTPClient.prototype, "executeWithApiVersion")
    .mockImplementation(async (_, path, params) => {
      if (path.includes("/vectors/get")) return { records: [recordJson] };
      if (path.includes("/vectors/delete")) return { ack: "INDEX_ACK_COMPLETED" };
      if (path.endsWith("/vectors")) return { ack: "INDEX_ACK_COMPLETED", failedItems: [] };
      if (path.endsWith("/batch-query")) {
        return { results: [{ response: queryJson }, { error: { code: 5, message: "missing record" } }] };
      }
      if (path.endsWith("/query")) return queryJson;
      if (params.method === "GET") {
        return /\/collections(?:\?|$)/.test(path)
          ? { collections: ["collection", "other"] }
          : {
              collection: "collection",
              recordCount: "2",
              dimensions: 3,
              metric: "DISTANCE_METRIC_COSINE",
              properties: { provider: "test" },
            };
      }
      return "";
    });
  return { client, vector: client.vector, rpc, execute, getClient, transport };
}

const operations = [
  ["createCollectionAlpha1", (v: IClientVector) => v.createCollection("store", "collection", { dimensions: 3 })],
  ["getCollectionAlpha1", (v: IClientVector) => v.getCollection("store", "collection")],
  ["listCollectionsAlpha1", (v: IClientVector) => v.listCollections("store")],
  ["deleteCollectionAlpha1", (v: IClientVector) => v.deleteCollection("store", "collection")],
  ["upsertVectorsAlpha1", (v: IClientVector) => v.upsertVectors("store", "collection", [record])],
  ["getVectorsAlpha1", (v: IClientVector) => v.getVectors("store", "collection", ["a"])],
  ["deleteVectorsAlpha1", (v: IClientVector) => v.deleteVectors("store", "collection", ["a"])],
  ["queryVectorsAlpha1", (v: IClientVector) => v.queryVectors("store", "collection", { vector: [1, 0, 0] })],
  [
    "batchQueryVectorsAlpha1",
    (v: IClientVector) => v.batchQueryVectors("store", "collection", [{ vector: [1, 0, 0] }, { byId: "missing" }]),
  ],
] as const;

describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])("Vector protocol %s", (protocol) => {
  afterEach(() => jest.restoreAllMocks());

  it("wires the public client and maps collection CRUD, metadata, and escaped path segments", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    expect(vector).toBeInstanceOf(protocol === CommunicationProtocolEnum.HTTP ? HTTPClientVector : GRPCClientVector);
    const storeName = "store /%?#\u00e9";
    const collection = "collection /%?#\u00e9";
    const metadata = { "key +/?": "value +/%?#\u00e9", empty: "" };
    await expect(
      vector.createCollection(storeName, collection, { dimensions: 3, metric: "cosine", metadata }),
    ).resolves.toBeUndefined();
    await expect(vector.getCollection(storeName, collection, { metadata })).resolves.toEqual({
      collection: "collection",
      recordCount: 2,
      dimensions: 3,
      metric: "cosine",
      properties: { provider: "test" },
    });
    expect(await vector.listCollections(storeName, { metadata })).toEqual(["collection", "other"]);
    await expect(vector.deleteCollection(storeName, collection, { metadata })).resolves.toBeUndefined();
    if (protocol === CommunicationProtocolEnum.HTTP) {
      const path = "/vector/store%20%2F%25%3F%23%C3%A9/collections/collection%20%2F%25%3F%23%C3%A9";
      const query = "?metadata.key+%2B%2F%3F=value+%2B%2F%25%3F%23%C3%A9&metadata.empty=";
      expect(execute).toHaveBeenNthCalledWith(1, "v1.0-alpha1", path, {
        method: "POST",
        body: { dimensions: 3, metric: "DISTANCE_METRIC_COSINE", metadata },
        signal: undefined,
      });
      expect(execute).toHaveBeenNthCalledWith(2, "v1.0-alpha1", path + query, { method: "GET", signal: undefined });
      expect(execute).toHaveBeenNthCalledWith(
        3,
        "v1.0-alpha1",
        "/vector/store%20%2F%25%3F%23%C3%A9/collections" + query,
        {
          method: "GET",
          signal: undefined,
        },
      );
      expect(execute).toHaveBeenNthCalledWith(4, "v1.0-alpha1", path + query, { method: "DELETE", signal: undefined });
      expect(rpc.createCollectionAlpha1).not.toHaveBeenCalled();
    } else {
      expect(rpc.createCollectionAlpha1).toHaveBeenCalledWith(
        create(Proto.CreateCollectionRequestAlpha1Schema, {
          storeName,
          collection,
          dimensions: 3,
          metric: 1,
          metadata,
        }),
        { signal: undefined },
      );
      expect(rpc.getCollectionAlpha1).toHaveBeenCalledWith(
        create(Proto.GetCollectionRequestAlpha1Schema, { storeName, collection, metadata }),
        { signal: undefined },
      );
      expect(rpc.listCollectionsAlpha1).toHaveBeenCalledWith(
        create(Proto.ListCollectionsRequestAlpha1Schema, { storeName, metadata }),
        { signal: undefined },
      );
      expect(rpc.deleteCollectionAlpha1).toHaveBeenCalledWith(
        create(Proto.DeleteCollectionRequestAlpha1Schema, { storeName, collection, metadata }),
        { signal: undefined },
      );
      expect(execute).not.toHaveBeenCalled();
    }
  });

  it("upserts binary records with distinct structured and request metadata, and exact nanosecond wait options", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    const signal = new AbortController().signal;
    const options = { ...wait, metadata: { tenant: "request" }, signal };
    expect(await vector.upsertVectors("store", "collection", [record], options)).toEqual({
      ack: "completed",
      failedItems: [],
    });
    if (protocol === CommunicationProtocolEnum.HTTP) {
      expect(execute).toHaveBeenCalledWith("v1.0-alpha1", "/vector/store/collections/collection/vectors", {
        method: "POST",
        body: {
          records: [recordJson],
          metadata: { tenant: "request" },
          options: {
            mode: "INDEXING_MODE_WAIT_FOR_COMPLETION",
            waitTimeout: "2.000000001s",
            onWaitTimeout: "INDEXING_WAIT_TIMEOUT_ACTION_FAIL_REQUEST",
          },
        },
        signal,
      });
    } else {
      expect(rpc.upsertVectorsAlpha1).toHaveBeenCalledWith(
        create(Proto.UpsertVectorsRequestAlpha1Schema, {
          storeName: "store",
          collection: "collection",
          records: [record],
          metadata: { tenant: "request" },
          options: { mode: 1, waitTimeout: { seconds: 2n, nanos: 1 }, onWaitTimeout: 2 },
        }),
        { signal },
      );
    }
    expect(record.values).toEqual([1, -0.25, 3.5]);
    expect(record.payload).toEqual(Uint8Array.from([0, 255, 128, 123]));
  });

  it("retrieves records in server order, preserves binary payloads, and sends explicit false includeValues", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    expect(await vector.getVectors("store", "collection", ["missing", "a"], { includeValues: false })).toEqual([
      record,
    ]);
    if (protocol === CommunicationProtocolEnum.HTTP) {
      expect(execute).toHaveBeenCalledWith("v1.0-alpha1", "/vector/store/collections/collection/vectors/get", {
        method: "POST",
        body: { ids: ["missing", "a"], includeValues: false },
        signal: undefined,
      });
    } else {
      expect(rpc.getVectorsAlpha1).toHaveBeenCalledWith(
        create(Proto.GetVectorsRequestAlpha1Schema, {
          storeName: "store",
          collection: "collection",
          ids: ["missing", "a"],
          includeValues: false,
        }),
        { signal: undefined },
      );
    }
  });

  it.each(["continueAsync", "failRequest"] as const)(
    "deletes with the %s wait policy and returns its acknowledgement",
    async (onWaitTimeout) => {
      const { vector, rpc, execute } = await setup(protocol);
      expect(await vector.deleteVectors("store", "collection", ["a", "missing"], { ...wait, onWaitTimeout })).toBe(
        "completed",
      );
      if (protocol === CommunicationProtocolEnum.HTTP) {
        expect(execute).toHaveBeenCalledWith("v1.0-alpha1", "/vector/store/collections/collection/vectors/delete", {
          method: "POST",
          body: {
            ids: ["a", "missing"],
            options: {
              mode: "INDEXING_MODE_WAIT_FOR_COMPLETION",
              waitTimeout: "2.000000001s",
              onWaitTimeout:
                onWaitTimeout === "continueAsync"
                  ? "INDEXING_WAIT_TIMEOUT_ACTION_CONTINUE_ASYNC"
                  : "INDEXING_WAIT_TIMEOUT_ACTION_FAIL_REQUEST",
            },
          },
          signal: undefined,
        });
      } else {
        expect(rpc.deleteVectorsAlpha1).toHaveBeenCalledWith(
          create(Proto.DeleteVectorsRequestAlpha1Schema, {
            storeName: "store",
            collection: "collection",
            ids: ["a", "missing"],
            options: {
              mode: 1,
              waitTimeout: { seconds: 2n, nanos: 1 },
              onWaitTimeout: onWaitTimeout === "continueAsync" ? 1 : 2,
            },
          }),
          { signal: undefined },
        );
      }
    },
  );

  it("maps every query option, preserving zero/false, nested filters, and unnormalized thresholds", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    const query: VectorQuery = {
      vector: [1, 0, 0],
      topK: 0,
      filter: { $and: [{ category: { $eq: "books" } }, { "nested.count": { $gte: 3 } }] },
      includeValues: false,
      includePayload: true,
      scoreThreshold: 0,
      metric: "dotProduct",
    };
    expect(await vector.queryVectors("store", "collection", query, { metadata: { tenant: "request" } })).toEqual({
      metric: "cosine",
      matches: [{ record, score: 0.75 }],
    });
    if (protocol === CommunicationProtocolEnum.HTTP) {
      expect(execute).toHaveBeenCalledWith("v1.0-alpha1", "/vector/store/collections/collection/query", {
        method: "POST",
        body: {
          metadata: { tenant: "request" },
          query: { ...query, vector: { values: [1, 0, 0] }, metric: "DISTANCE_METRIC_DOT_PRODUCT" },
        },
        signal: undefined,
      });
    } else {
      expect(rpc.queryVectorsAlpha1).toHaveBeenCalledWith(
        create(Proto.QueryVectorsRequestAlpha1Schema, {
          storeName: "store",
          collection: "collection",
          metadata: { tenant: "request" },
          query: {
            kind: { case: "vector", value: { values: [1, 0, 0] } },
            topK: 0,
            filter: query.filter,
            includeValues: false,
            includePayload: true,
            scoreThreshold: 0,
            metric: 2,
          },
        }),
        { signal: undefined },
      );
    }
  });

  it.each([
    ["cosine", 1, "DISTANCE_METRIC_COSINE"],
    ["dotProduct", 2, "DISTANCE_METRIC_DOT_PRODUCT"],
    ["euclidean", 3, "DISTANCE_METRIC_EUCLIDEAN"],
  ] as const)("maps %s for collection creation and query responses", async (metric, numeric, json) => {
    const { vector, rpc, execute } = await setup(protocol);
    await vector.createCollection("store", "collection", { dimensions: 0xffffffff, metric });
    if (protocol === CommunicationProtocolEnum.HTTP) {
      expect(execute.mock.calls[0][2].body).toEqual({ dimensions: 0xffffffff, metric: json });
    } else {
      expect(rpc.createCollectionAlpha1.mock.calls[0][0]).toMatchObject({ dimensions: 0xffffffff, metric: numeric });
    }
    execute.mockResolvedValueOnce({ metric: json });
    rpc.queryVectorsAlpha1.mockResolvedValueOnce(create(Proto.QueryVectorsResponseAlpha1Schema, { metric: numeric }));
    expect(
      await vector.queryVectors("store", "collection", { byId: "a", topK: 0xffffffff, metric, scoreThreshold: -2 }),
    ).toEqual({ metric, matches: [] });
  });

  it("omits unset query options, uses a by-ID oneof, and keeps optional empty payloads distinct from absent payloads", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    await vector.queryVectors("store", "collection", { byId: "a" });
    if (protocol === CommunicationProtocolEnum.HTTP) {
      expect(execute.mock.calls[0][2].body).toEqual({ query: { byId: "a" } });
    } else {
      expect(rpc.queryVectorsAlpha1.mock.calls[0][0]).toEqual(
        create(Proto.QueryVectorsRequestAlpha1Schema, {
          storeName: "store",
          collection: "collection",
          query: { kind: { case: "byId", value: "a" } },
        }),
      );
    }
    execute.mockResolvedValueOnce({ records: [{ id: "absent" }, { id: "empty", payload: "", metadata: {} }] });
    rpc.getVectorsAlpha1.mockResolvedValueOnce(
      create(Proto.GetVectorsResponseAlpha1Schema, {
        records: [{ id: "absent" }, { id: "empty", payload: new Uint8Array(), metadata: {} }],
      }),
    );
    expect(await vector.getVectors("store", "collection", ["absent", "empty"])).toEqual([
      { id: "absent", values: [], payload: undefined, metadata: undefined },
      { id: "empty", values: [], payload: new Uint8Array(), metadata: {} },
    ]);
  });

  it.each([undefined, {}, { mode: "returnOnAcceptance" }] as const)(
    "preserves default/acceptance indexing options %j and queued acknowledgements",
    async (options) => {
      const { vector, rpc, execute } = await setup(protocol);
      execute.mockResolvedValueOnce({ ack: 1 });
      rpc.upsertVectorsAlpha1.mockResolvedValueOnce(create(Proto.UpsertVectorsResponseAlpha1Schema, { ack: 1 }));
      expect(await vector.upsertVectors("store", "collection", [], options)).toEqual({
        ack: "queued",
        failedItems: [],
      });
      if (protocol === CommunicationProtocolEnum.HTTP) {
        expect(execute.mock.calls[0][2].body).toEqual(
          options?.mode ? { options: { mode: "INDEXING_MODE_RETURN_ON_ACCEPTANCE" } } : {},
        );
      } else {
        const request = rpc.upsertVectorsAlpha1.mock.calls[0][0];
        expect(request.records).toEqual([]);
        expect(request.options).toEqual(options?.mode ? expect.objectContaining({ mode: 2 }) : undefined);
      }
    },
  );

  it("preserves item failures and opaque provider error details without an Any schema registry", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    execute.mockResolvedValueOnce({
      ack: "INDEX_ACK_COMPLETED",
      failedItems: [
        {
          id: "bad",
          error: {
            code: 3,
            message: "wrong dimensions",
            details: [{ "@type": "example.net/provider.Detail", reason: "dimensions", retryable: false }],
          },
        },
      ],
    });
    rpc.upsertVectorsAlpha1.mockResolvedValueOnce(
      create(Proto.UpsertVectorsResponseAlpha1Schema, {
        ack: 2,
        failedItems: [
          {
            id: "bad",
            error: {
              code: 3,
              message: "wrong dimensions",
              details: [{ typeUrl: "example.net/provider.Detail", value: Uint8Array.from([8, 7]) }],
            },
          },
        ],
      }),
    );
    expect(await vector.upsertVectors("store", "collection", [record])).toEqual({
      ack: "completed",
      failedItems: [
        {
          id: "bad",
          error: {
            code: 3,
            message: "wrong dimensions",
            details: [
              {
                typeUrl: "example.net/provider.Detail",
                value:
                  protocol === CommunicationProtocolEnum.HTTP
                    ? { reason: "dimensions", retryable: false }
                    : Uint8Array.from([8, 7]),
              },
            ],
          },
        },
      ],
    });
  });

  it("preserves batch order and errors instead of rejecting successful slots", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    const queries: VectorQuery[] = [{ vector: [1, 0, 0] }, { byId: "missing" }];
    expect(await vector.batchQueryVectors("store", "collection", queries, { metadata: { tenant: "a" } })).toEqual([
      { response: { metric: "cosine", matches: [{ record, score: 0.75 }] } },
      { error: { code: 5, message: "missing record", details: [] } },
    ]);
    if (protocol === CommunicationProtocolEnum.HTTP) {
      expect(execute).toHaveBeenCalledWith("v1.0-alpha1", "/vector/store/collections/collection/batch-query", {
        method: "POST",
        body: { queries: [{ vector: { values: [1, 0, 0] } }, { byId: "missing" }], metadata: { tenant: "a" } },
        signal: undefined,
      });
    } else {
      expect(rpc.batchQueryVectorsAlpha1.mock.calls[0][0]).toEqual(
        create(Proto.BatchQueryVectorsRequestAlpha1Schema, {
          storeName: "store",
          collection: "collection",
          metadata: { tenant: "a" },
          queries: [
            { kind: { case: "vector", value: { values: [1, 0, 0] } } },
            { kind: { case: "byId", value: "missing" } },
          ],
        }),
      );
    }
  });

  it("sends empty batches to the runtime and returns genuinely empty results", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    execute.mockResolvedValueOnce({});
    rpc.batchQueryVectorsAlpha1.mockResolvedValueOnce(create(Proto.BatchQueryVectorsResponseAlpha1Schema));
    expect(await vector.batchQueryVectors("store", "collection", [])).toEqual([]);
    execute.mockResolvedValueOnce({});
    rpc.getVectorsAlpha1.mockResolvedValueOnce(create(Proto.GetVectorsResponseAlpha1Schema));
    expect(await vector.getVectors("store", "collection", [])).toEqual([]);
    expect(await vector.deleteVectors("store", "collection", [])).toBe("completed");
  });

  it.each(operations)("propagates %s failures unchanged, does not retry, and recovers", async (method, invoke) => {
    const { vector, rpc, execute } = await setup(protocol);
    const failure = new Error("transport or provider failure");
    execute.mockRejectedValueOnce(failure);
    rpc[method].mockRejectedValueOnce(failure);
    await expect(invoke(vector)).rejects.toBe(failure);
    await invoke(vector);
    expect(protocol === CommunicationProtocolEnum.HTTP ? execute : rpc[method]).toHaveBeenCalledTimes(2);
  });

  it.each([0n, BigInt(Number.MAX_SAFE_INTEGER), BigInt(Number.MAX_SAFE_INTEGER) + 1n, 18446744073709551615n])(
    "checks exact uint64 precision for recordCount=%s",
    async (count) => {
      const { vector, rpc, execute } = await setup(protocol);
      execute.mockResolvedValueOnce({
        collection: "collection",
        dimensions: 3,
        metric: 1,
        recordCount: count.toString(),
      });
      rpc.getCollectionAlpha1.mockResolvedValueOnce(
        create(Proto.GetCollectionResponseAlpha1Schema, {
          collection: "collection",
          dimensions: 3,
          metric: 1,
          recordCount: count,
        }),
      );
      if (count > BigInt(Number.MAX_SAFE_INTEGER)) {
        await expect(vector.getCollection("store", "collection")).rejects.toThrow("safe integer");
      } else {
        expect((await vector.getCollection("store", "collection")).recordCount).toBe(Number(count));
      }
    },
  );

  const invalidCalls: { name: string; method: keyof IClientVector; args: unknown[] }[] = [
    ...["", " ", ".", "..", null, 7].map((name) => ({
      name: `store ${name}`,
      method: "listCollections" as const,
      args: [name],
    })),
    ...["", " ", ".", "..", undefined].map((name) => ({
      name: `collection ${name}`,
      method: "getCollection" as const,
      args: ["store", name],
    })),
    ...[0, -1, 1.5, NaN, Infinity, 0x100000000, "3", null, undefined].map((dimensions) => ({
      name: `dimensions ${dimensions}`,
      method: "createCollection" as const,
      args: ["store", "collection", { dimensions }],
    })),
    { name: "missing create options", method: "createCollection", args: ["store", "collection"] },
    { name: "null options", method: "listCollections", args: ["store", null] },
    { name: "array options", method: "listCollections", args: ["store", []] },
    { name: "null request metadata", method: "listCollections", args: ["store", { metadata: null }] },
    { name: "numeric request metadata", method: "listCollections", args: ["store", { metadata: { key: 1 } }] },
    {
      name: "invalid metric",
      method: "createCollection",
      args: ["store", "collection", { dimensions: 3, metric: "other" }],
    },
    { name: "missing records", method: "upsertVectors", args: ["store", "collection"] },
    { name: "null record", method: "upsertVectors", args: ["store", "collection", [null]] },
    { name: "empty record ID", method: "upsertVectors", args: ["store", "collection", [{ id: "", values: [1] }]] },
    {
      name: "non-binary payload",
      method: "upsertVectors",
      args: ["store", "collection", [{ ...record, payload: "string" }]],
    },
    { name: "array metadata", method: "upsertVectors", args: ["store", "collection", [{ ...record, metadata: [] }]] },
    { name: "null metadata", method: "upsertVectors", args: ["store", "collection", [{ ...record, metadata: null }]] },
    ...[undefined, null, {}, [NaN], [Infinity], [-Infinity], [3.5e38], ["1"], Array(1)].map((values) => ({
      name: `invalid values ${String(values)}`,
      method: "upsertVectors" as const,
      args: ["store", "collection", [{ ...record, values }]],
    })),
    { name: "missing IDs", method: "getVectors", args: ["store", "collection"] },
    { name: "non-string IDs", method: "deleteVectors", args: ["store", "collection", [1]] },
    { name: "empty ID", method: "getVectors", args: ["store", "collection", [""]] },
    { name: "invalid includeValues", method: "getVectors", args: ["store", "collection", ["a"], { includeValues: 0 }] },
    ...[
      undefined,
      null,
      {},
      { vector: [1], byId: "a" },
      { byId: 1 },
      { vector: {} },
      { vector: [1], topK: -1 },
      { vector: [1], topK: 1.5 },
      { vector: [1], topK: 0x100000000 },
      { vector: [1], scoreThreshold: Infinity },
      { vector: [1], includePayload: "false" },
      { vector: [1], includeValues: null },
      { vector: [1], filter: [] },
      { vector: [1], metric: 1 },
    ].map((query, index) => ({
      name: `invalid query ${index}`,
      method: "queryVectors" as const,
      args: ["store", "collection", query],
    })),
    { name: "missing queries", method: "batchQueryVectors", args: ["store", "collection"] },
    {
      name: "invalid batch query source",
      method: "batchQueryVectors",
      args: ["store", "collection", [{ byId: "a" }, {}]],
    },
    ...[
      { mode: "other" },
      { waitTimeout: "1s" },
      { onWaitTimeout: "continueAsync" },
      { mode: "returnOnAcceptance", waitTimeout: "1s" },
      { mode: "waitForCompletion" },
      { mode: "waitForCompletion", waitTimeout: 1 },
      { ...wait, waitTimeout: "0s" },
      { ...wait, waitTimeout: "-1s" },
      { ...wait, waitTimeout: "1ms" },
      { ...wait, waitTimeout: "0.0000000001s" },
      { ...wait, waitTimeout: "315576000001s" },
      { ...wait, onWaitTimeout: "other" },
    ].map((options, index) => ({
      name: `invalid indexing options ${index}`,
      method: "upsertVectors" as const,
      args: ["store", "collection", [record], options],
    })),
  ];
  it.each(invalidCalls)("rejects $name without a network call and remains usable", async ({ method, args }) => {
    const { vector, execute, getClient } = await setup(protocol);
    await expect(Reflect.apply(vector[method], vector, args)).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
    expect(getClient).not.toHaveBeenCalled();
    expect(await vector.listCollections("store")).toEqual(["collection", "other"]);
  });

  it.each(["cycle", "date", "undefined", "bigint", "symbol", "function", "nonfinite", "sparse"] as const)(
    "rejects non-JSON %s values in metadata and filters",
    async (kind) => {
      const { vector, execute, getClient } = await setup(protocol);
      const cycle: Record<string, unknown> = {};
      cycle.self = cycle;
      const value = {
        cycle,
        date: new Date(),
        undefined,
        bigint: 1n,
        symbol: Symbol(),
        function: () => 1,
        nonfinite: NaN,
        sparse: Array(1),
      }[kind];
      await expect(
        Reflect.apply(vector.upsertVectors, vector, [
          "store",
          "collection",
          [{ ...record, metadata: { nested: value } }],
        ]),
      ).rejects.toThrow();
      await expect(
        Reflect.apply(vector.queryVectors, vector, ["store", "collection", { vector: [1], filter: { nested: value } }]),
      ).rejects.toThrow();
      expect(execute).not.toHaveBeenCalled();
      expect(getClient).not.toHaveBeenCalled();
    },
  );

  it.each([0, 99])("rejects unspecified/unknown acknowledgements %i for both writes", async (ack) => {
    const { vector, rpc, execute } = await setup(protocol);
    execute.mockResolvedValue({ ack });
    rpc.upsertVectorsAlpha1.mockResolvedValue(Object.assign(create(Proto.UpsertVectorsResponseAlpha1Schema), { ack }));
    rpc.deleteVectorsAlpha1.mockResolvedValue(Object.assign(create(Proto.DeleteVectorsResponseAlpha1Schema), { ack }));
    await expect(vector.upsertVectors("store", "collection", [record])).rejects.toThrow("acknowledgement");
    await expect(vector.deleteVectors("store", "collection", ["a"])).rejects.toThrow("acknowledgement");
  });

  it.each([0, 99])("rejects unspecified/unknown effective metrics %i", async (metric) => {
    const { vector, rpc, execute } = await setup(protocol);
    execute.mockResolvedValueOnce({ metric });
    rpc.queryVectorsAlpha1.mockResolvedValueOnce(Object.assign(queryResponse(), { metric }));
    await expect(vector.queryVectors("store", "collection", { byId: "a" })).rejects.toThrow("distance metric");
    expect((await vector.queryVectors("store", "collection", { byId: "a" })).matches).toHaveLength(1);
  });

  it.each(["missing record", "nonfinite score", "nonfinite values", "empty ID"] as const)(
    "rejects a query response with %s, never returning a partial result",
    async (fault) => {
      const { vector, rpc, execute } = await setup(protocol);
      const badRecord = fault === "empty ID" ? { id: "" } : { ...record, values: [NaN] };
      rpc.queryVectorsAlpha1.mockResolvedValueOnce(
        create(Proto.QueryVectorsResponseAlpha1Schema, {
          metric: 1,
          matches: [
            { record, score: 1 },
            fault === "missing record"
              ? {}
              : fault === "nonfinite score"
              ? { record, score: Infinity }
              : { record: badRecord },
          ],
        }),
      );
      execute.mockResolvedValueOnce({
        metric: 1,
        matches: [
          { record: recordJson, score: 1 },
          fault === "missing record"
            ? {}
            : fault === "nonfinite score"
            ? { record: recordJson, score: "Infinity" }
            : { record: fault === "empty ID" ? { id: "" } : { id: "bad", values: ["NaN"] } },
        ],
      });
      await expect(vector.queryVectors("store", "collection", { vector: [1] })).rejects.toThrow();
      expect((await vector.queryVectors("store", "collection", { vector: [1] })).matches).toHaveLength(1);
    },
  );

  it.each([undefined, 0, -1, 17, 1.5])("rejects invalid item and batch error code %s", async (code) => {
    const { vector, rpc, execute } = await setup(protocol);
    const error = code === undefined ? undefined : { code };
    execute.mockResolvedValueOnce({ ack: 2, failedItems: [{ id: "a", error }] });
    rpc.upsertVectorsAlpha1.mockResolvedValueOnce(
      create(Proto.UpsertVectorsResponseAlpha1Schema, { ack: 2, failedItems: [{ id: "a", error }] }),
    );
    await expect(vector.upsertVectors("store", "collection", [record])).rejects.toThrow();
    execute.mockResolvedValueOnce({ results: [{ error: error ?? {} }] });
    rpc.batchQueryVectorsAlpha1.mockResolvedValueOnce(
      create(Proto.BatchQueryVectorsResponseAlpha1Schema, {
        results: [{ result: { case: "error", value: error ?? {} } }],
      }),
    );
    await expect(vector.batchQueryVectors("store", "collection", [{ byId: "a" }])).rejects.toThrow();
  });

  it.each([0, 1, 3])("rejects a batch with %i slots for two queries", async (count) => {
    const { vector, rpc, execute } = await setup(protocol);
    execute.mockResolvedValueOnce({ results: Array.from({ length: count }, () => ({ response: queryJson })) });
    rpc.batchQueryVectorsAlpha1.mockResolvedValueOnce(
      create(Proto.BatchQueryVectorsResponseAlpha1Schema, {
        results: Array.from({ length: count }, () => ({
          result: { case: "response" as const, value: queryResponse() },
        })),
      }),
    );
    await expect(vector.batchQueryVectors("store", "collection", [{ byId: "a" }, { byId: "b" }])).rejects.toThrow(
      "results for 2 queries",
    );
  });

  it("rejects empty batch result discriminants", async () => {
    const { vector, rpc, execute } = await setup(protocol);
    execute.mockResolvedValueOnce({ results: [{}] });
    rpc.batchQueryVectorsAlpha1.mockResolvedValueOnce(
      create(Proto.BatchQueryVectorsResponseAlpha1Schema, { results: [{}] }),
    );
    await expect(vector.batchQueryVectors("store", "collection", [{ byId: "a" }])).rejects.toThrow("response or error");
  });

  it("uses a request snapshot if the caller later mutates the batch array", async () => {
    const { vector } = await setup(protocol);
    const queries: VectorQuery[] = [{ byId: "a" }, { byId: "missing" }];
    const pending = vector.batchQueryVectors("store", "collection", queries);
    queries.push({ byId: "later" });
    expect(await pending).toHaveLength(2);
  });
});

describe("Vector transport edge cases", () => {
  afterEach(() => jest.restoreAllMocks());

  it("encodes float32 vectors and opaque bytes through the real protobuf serializer", async () => {
    const { vector, rpc } = await setup(CommunicationProtocolEnum.GRPC);
    await vector.upsertVectors("store", "collection", [{ ...record, values: [0.1, 1e-40, -3.4028234663852886e38] }]);
    const request = create(Proto.UpsertVectorsRequestAlpha1Schema, rpc.upsertVectorsAlpha1.mock.calls[0][0]);
    const decoded = fromBinary(
      Proto.UpsertVectorsRequestAlpha1Schema,
      toBinary(Proto.UpsertVectorsRequestAlpha1Schema, request),
    );
    expect(decoded.records[0].values).toEqual([Math.fround(0.1), Math.fround(1e-40), -3.4028234663852886e38]);
    expect(decoded.records[0].payload).toEqual(record.payload);
  });

  it("rejects pre-cancelled gRPC requests without initializing the transport", async () => {
    const { vector, getClient, rpc } = await setup(CommunicationProtocolEnum.GRPC);
    const controller = new AbortController();
    const reason = new Error("cancelled");
    controller.abort(reason);
    await expect(vector.listCollections("store", { signal: controller.signal })).rejects.toBe(reason);
    expect(getClient).not.toHaveBeenCalled();
    expect(rpc.listCollectionsAlpha1).not.toHaveBeenCalled();
  });

  it("cancels a gRPC initialization wait without cancelling another caller", async () => {
    const { vector, getClient, rpc, transport } = await setup(CommunicationProtocolEnum.GRPC);
    let resolve!: (value: typeof transport) => void;
    getClient.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const controller = new AbortController();
    const pending = vector.listCollections("store", { signal: controller.signal });
    const other = vector.listCollections("store");
    const reason = new Error("stop waiting");
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    resolve(transport);
    expect(await other).toEqual(["collection", "other"]);
    expect(rpc.listCollectionsAlpha1).toHaveBeenCalledTimes(1);
  });

  it("propagates gRPC initialization errors", async () => {
    const { vector, getClient, rpc } = await setup(CommunicationProtocolEnum.GRPC);
    const failure = new Error("initialization failed");
    getClient.mockRejectedValueOnce(failure);
    await expect(vector.listCollections("store", { signal: new AbortController().signal })).rejects.toBe(failure);
    expect(rpc.listCollectionsAlpha1).not.toHaveBeenCalled();
  });

  it.each([null, [], "not-json", { records: [{ id: "a", payload: "!not-base64!" }] }, { records: "invalid" }])(
    "rejects malformed HTTP record envelopes %j",
    async (response) => {
      const { vector, execute } = await setup(CommunicationProtocolEnum.HTTP);
      // Deliberately bypass the transport's declared response type to model a broken sidecar.
      execute.mockImplementationOnce(async () => response!);
      await expect(vector.getVectors("store", "collection", ["a"])).rejects.toThrow();
    },
  );

  it("rejects HTTP batch slots with both discriminants and malformed provider details", async () => {
    const { vector, execute } = await setup(CommunicationProtocolEnum.HTTP);
    execute.mockResolvedValueOnce({ results: [{ response: queryJson, error: { code: 3 } }] });
    await expect(vector.batchQueryVectors("store", "collection", [{ byId: "a" }])).rejects.toThrow("exactly one");
    execute.mockResolvedValueOnce({ ack: 2, failedItems: [{ id: "a", error: { code: 3, details: [{}] } }] });
    await expect(vector.upsertVectors("store", "collection", [record])).rejects.toThrow("@type");
  });

  it("tolerates future HTTP fields and preserves JSON keys such as __proto__ as data", async () => {
    const { vector, execute } = await setup(CommunicationProtocolEnum.HTTP);
    const metadata = JSON.parse('{"__proto__":{"safe":true},"constructor":"data","nested":{"x":0}}');
    execute.mockResolvedValueOnce({ records: [{ id: "a", metadata, future: true }], future: "ignored" });
    const records = await vector.getVectors("store", "collection", ["a"]);
    expect(records[0].metadata).toEqual(metadata);
    expect(Object.prototype).not.toHaveProperty("safe");
  });

  it("rejects negative HTTP counts instead of manufacturing a successful collection result", async () => {
    const { vector, execute } = await setup(CommunicationProtocolEnum.HTTP);
    execute.mockResolvedValueOnce({ collection: "c", dimensions: 1, metric: 1, recordCount: "-1" });
    await expect(vector.getCollection("store", "c")).rejects.toThrow();
  });
});

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

import { once } from "node:events";
import {
  constants,
  createServer,
  Http2Server,
  IncomingHttpHeaders,
  ServerHttp2Session,
  ServerHttp2Stream,
} from "node:http2";
import { create, DescMessage, fromBinary, fromJson, JsonObject, toBinary, toJson } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import {
  CommunicationProtocolEnum,
  DaprClient,
  GRPCClient,
  IClientVector,
  LogLevel,
  VectorIndexingOptions,
  withBaggage,
} from "../../../../src";
import * as Proto from "../../../../src/proto/dapr/proto/runtime/v1/vector_pb";
import { StatusSchema } from "../../../../src/proto/google/rpc/status_pb";

const scope = { storeName: "store", collection: "collection" };
const metadata = { tenant: "request", empty: "" };
const record = { id: "a", values: [1, -2, 3], payload: Uint8Array.from([0, 255, 128]), metadata: { active: false } };
const recordJson = { ...record, payload: "AP+A" };
const wait: VectorIndexingOptions = {
  mode: "waitForCompletion",
  waitTimeout: "1.000000001s",
  onWaitTimeout: "continueAsync",
};
const indexingJson = {
  mode: "INDEXING_MODE_WAIT_FOR_COMPLETION",
  waitTimeout: "1.000000001s",
  onWaitTimeout: "INDEXING_WAIT_TIMEOUT_ACTION_CONTINUE_ASYNC",
};

function encode(schema: DescMessage, json: JsonObject): Uint8Array {
  return toBinary(schema, fromJson(schema, json));
}

type WireCase = {
  method: string;
  schema: DescMessage;
  request: JsonObject;
  response: Uint8Array;
  result: unknown;
  invoke: (vector: IClientVector, signal?: AbortSignal) => Promise<unknown>;
};

const cases: WireCase[] = [
  {
    method: "CreateCollectionAlpha1",
    schema: Proto.CreateCollectionRequestAlpha1Schema,
    request: { ...scope, metadata, dimensions: 3, metric: "DISTANCE_METRIC_COSINE" },
    response: new Uint8Array(),
    result: undefined,
    invoke: (v, signal) =>
      v.createCollection("store", "collection", { dimensions: 3, metric: "cosine", metadata, signal }),
  },
  {
    method: "GetCollectionAlpha1",
    schema: Proto.GetCollectionRequestAlpha1Schema,
    request: { ...scope, metadata },
    response: encode(Proto.GetCollectionResponseAlpha1Schema, {
      collection: "collection",
      recordCount: "17",
      dimensions: 3,
      metric: "DISTANCE_METRIC_COSINE",
      properties: { native: "yes" },
    }),
    result: {
      collection: "collection",
      recordCount: 17,
      dimensions: 3,
      metric: "cosine",
      properties: { native: "yes" },
    },
    invoke: (v, signal) => v.getCollection("store", "collection", { metadata, signal }),
  },
  {
    method: "ListCollectionsAlpha1",
    schema: Proto.ListCollectionsRequestAlpha1Schema,
    request: { storeName: "store", metadata },
    response: encode(Proto.ListCollectionsResponseAlpha1Schema, { collections: ["collection"] }),
    result: ["collection"],
    invoke: (v, signal) => v.listCollections("store", { metadata, signal }),
  },
  {
    method: "DeleteCollectionAlpha1",
    schema: Proto.DeleteCollectionRequestAlpha1Schema,
    request: { ...scope, metadata },
    response: new Uint8Array(),
    result: undefined,
    invoke: (v, signal) => v.deleteCollection("store", "collection", { metadata, signal }),
  },
  {
    method: "UpsertVectorsAlpha1",
    schema: Proto.UpsertVectorsRequestAlpha1Schema,
    request: { ...scope, metadata, records: [recordJson], options: indexingJson },
    response: encode(Proto.UpsertVectorsResponseAlpha1Schema, { ack: "INDEX_ACK_COMPLETED" }),
    result: { ack: "completed", failedItems: [] },
    invoke: (v, signal) => v.upsertVectors("store", "collection", [record], { ...wait, metadata, signal }),
  },
  {
    method: "GetVectorsAlpha1",
    schema: Proto.GetVectorsRequestAlpha1Schema,
    request: { ...scope, metadata, ids: ["missing", "a"], includeValues: false },
    response: encode(Proto.GetVectorsResponseAlpha1Schema, { records: [recordJson] }),
    result: [record],
    invoke: (v, signal) =>
      v.getVectors("store", "collection", ["missing", "a"], { includeValues: false, metadata, signal }),
  },
  {
    method: "DeleteVectorsAlpha1",
    schema: Proto.DeleteVectorsRequestAlpha1Schema,
    request: { ...scope, metadata, ids: ["a"], options: indexingJson },
    response: encode(Proto.DeleteVectorsResponseAlpha1Schema, { ack: "INDEX_ACK_QUEUED" }),
    result: "queued",
    invoke: (v, signal) => v.deleteVectors("store", "collection", ["a"], { ...wait, metadata, signal }),
  },
  {
    method: "QueryVectorsAlpha1",
    schema: Proto.QueryVectorsRequestAlpha1Schema,
    request: {
      ...scope,
      metadata,
      query: {
        vector: { values: [1, 0, 0] },
        topK: 0,
        includeValues: false,
        includePayload: true,
        scoreThreshold: 0,
        filter: { active: { $eq: false } },
      },
    },
    response: encode(Proto.QueryVectorsResponseAlpha1Schema, {
      metric: "DISTANCE_METRIC_DOT_PRODUCT",
      matches: [{ record: recordJson, score: -2.25 }],
    }),
    result: { metric: "dotProduct", matches: [{ record, score: -2.25 }] },
    invoke: (v, signal) =>
      v.queryVectors(
        "store",
        "collection",
        {
          vector: [1, 0, 0],
          topK: 0,
          includeValues: false,
          includePayload: true,
          scoreThreshold: 0,
          filter: { active: { $eq: false } },
        },
        { metadata, signal },
      ),
  },
  {
    method: "BatchQueryVectorsAlpha1",
    schema: Proto.BatchQueryVectorsRequestAlpha1Schema,
    request: { ...scope, metadata, queries: [{ byId: "a" }, { vector: { values: [0, 1, 0] } }] },
    response: encode(Proto.BatchQueryVectorsResponseAlpha1Schema, {
      results: [{ response: { metric: "DISTANCE_METRIC_COSINE" } }, { error: { code: 5, message: "missing" } }],
    }),
    result: [{ response: { metric: "cosine", matches: [] } }, { error: { code: 5, message: "missing", details: [] } }],
    invoke: (v, signal) =>
      v.batchQueryVectors("store", "collection", [{ byId: "a" }, { vector: [0, 1, 0] }], { metadata, signal }),
  },
];

describe("Vector gRPC HTTP/2 wire contract", () => {
  let server: Http2Server;
  let client: DaprClient;
  let port: string;
  let response: Uint8Array;
  let handler: ((stream: ServerHttp2Stream) => void) | undefined;
  const sessions = new Set<ServerHttp2Session>();
  const requests: { headers: IncomingHttpHeaders; frame: Buffer }[] = [];
  const streamErrors: NodeJS.ErrnoException[] = [];
  let expectedStreamErrors: string[];
  const serializer = {
    serialize: jest.fn((): never => {
      throw new Error("Vector must not use the application serializer");
    }),
    deserialize: jest.fn((): never => {
      throw new Error("Vector must not use the application deserializer");
    }),
  };

  function makeClient(maxBodySizeMb?: number): DaprClient {
    const result = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      daprHost: "127.0.0.1",
      daprPort: port,
      daprApiToken: "vector-wire-token",
      logger: { level: LogLevel.Error },
      serializer,
      maxBodySizeMb,
    });
    if (!(result.daprClient instanceof GRPCClient)) throw new Error("Expected gRPC transport");
    result.daprClient.setIsInitialized(true);
    return result;
  }

  beforeAll(async () => {
    // A raw server also detects framing/path errors that a matching generated service could hide.
    server = createServer();
    server.on("session", (session) => {
      sessions.add(session);
      session.once("close", () => sessions.delete(session));
    });
    server.on("stream", (stream, headers) => {
      stream.on("error", (error: NodeJS.ErrnoException) => streamErrors.push(error));
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        if (stream.destroyed) return;
        requests.push({ headers, frame: Buffer.concat(chunks) });
        if (handler) handler(stream);
        else send(stream, frame(response));
      });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
    port = String(address.port);
    client = makeClient();
  });

  beforeEach(() => {
    requests.length = 0;
    streamErrors.length = 0;
    expectedStreamErrors = [];
    response = encode(Proto.ListCollectionsResponseAlpha1Schema, { collections: ["recovered"] });
    handler = undefined;
    jest.clearAllMocks();
  });

  afterEach(() => {
    for (const error of streamErrors) expect(expectedStreamErrors).toContain(error.code);
    expect(serializer.serialize).not.toHaveBeenCalled();
    expect(serializer.deserialize).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await client?.stop();
    for (const session of sessions) session.destroy();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it.each(cases)(
    "sends and receives $method with exact paths, envelopes, authentication, and baggage",
    async (test) => {
      response = test.response;
      expect(await withBaggage({ tenant: "wire" }, () => test.invoke(client.vector))).toEqual(test.result);
      expect(requests).toHaveLength(1);
      expect(requests[0].headers).toMatchObject({
        ":method": "POST",
        ":path": `/dapr.proto.runtime.v1.Dapr/${test.method}`,
        "content-type": expect.stringMatching(/^application\/grpc(?:\+proto)?$/),
        "dapr-api-token": "vector-wire-token",
        baggage: "tenant=wire",
      });
      expect(toJson(test.schema, fromBinary(test.schema, unframe(requests[0].frame)))).toEqual(test.request);
    },
  );

  it.each(cases)("never sends a pre-cancelled $method request", async (test) => {
    const controller = new AbortController();
    const reason = new Error("cancelled before sending");
    controller.abort(reason);
    await expect(test.invoke(client.vector, controller.signal)).rejects.toBe(reason);
    expect(requests).toHaveLength(0);
  });

  it("matches independent protobuf bytes for query oneofs and explicit zero/false options", async () => {
    response = Buffer.from("1001", "hex");
    await client.vector.queryVectors("s", "c", {
      byId: "a",
      topK: 0,
      includeValues: false,
      includePayload: false,
      metric: "dotProduct",
      scoreThreshold: 0,
    });
    expect(unframe(requests[0].frame)).toEqual(
      Buffer.from("0a01731201631a141201611800280030003802410000000000000000", "hex"),
    );
    await client.vector.queryVectors("s", "c", { vector: [1, 0, -1] });
    expect(unframe(requests[1].frame)).toEqual(Buffer.from("0a01731201631a100a0e120c0000803f00000000000080bf", "hex"));
  });

  it("matches independent packed-float and explicitly empty bytes encodings", async () => {
    response = Buffer.from("1002", "hex");
    expect(
      await client.vector.upsertVectors("s", "c", [{ id: "a", values: [0.5, -2, 3], payload: new Uint8Array() }]),
    ).toEqual({ ack: "completed", failedItems: [] });
    expect(unframe(requests[0].frame)).toEqual(
      Buffer.from("0a01731201631a130a0161120c0000003f000000c0000040401a00", "hex"),
    );
  });

  it("round-trips nonzero-offset binary views and float32 values without including neighboring bytes", async () => {
    const backing = Buffer.from(Array.from({ length: 65540 }, (_, i) => i % 256));
    const payload = backing.subarray(2, -2);
    response = toBinary(
      Proto.GetVectorsResponseAlpha1Schema,
      create(Proto.GetVectorsResponseAlpha1Schema, {
        records: [{ id: "bytes", values: [Math.fround(0.1), Math.fround(1e-40)], payload }],
      }),
    );
    const result = await client.vector.getVectors("store", "collection", ["bytes"], { includeValues: true });
    expect(result[0].payload).toEqual(Uint8Array.from(payload));
    expect(result[0].values).toEqual([Math.fround(0.1), Math.fround(1e-40)]);
    response = Buffer.from("1002", "hex");
    await client.vector.upsertVectors("store", "collection", [{ id: "bytes", values: [0.1, 1e-40], payload }]);
    const request = fromBinary(Proto.UpsertVectorsRequestAlpha1Schema, unframe(requests[1].frame));
    expect(request.records[0].payload).toEqual(Uint8Array.from(payload));
    expect(request.records[0].values).toEqual(result[0].values);
  });

  it.each([
    Code.InvalidArgument,
    Code.Unauthenticated,
    Code.NotFound,
    Code.ResourceExhausted,
    Code.Unimplemented,
    Code.Unavailable,
  ])("propagates canonical gRPC status %i without retrying a write, then recovers", async (code) => {
    handler = (stream) => send(stream, new Uint8Array(), code, "provider / % \u00e9\nfailed");
    await expect(client.vector.upsertVectors("store", "collection", [record])).rejects.toMatchObject({
      code,
      rawMessage: "provider / % \u00e9\nfailed",
    });
    expect(requests).toHaveLength(1);
    handler = undefined;
    expect(await client.vector.listCollections("store")).toEqual(["recovered"]);
    expect(requests).toHaveLength(2);
  });

  it("preserves structured status trailers and opaque details on request-wide failures", async () => {
    const status = toBinary(
      StatusSchema,
      create(StatusSchema, {
        code: Code.FailedPrecondition,
        message: "index is rebuilding",
        details: [{ typeUrl: "example.net/provider.Rebuild", value: Uint8Array.from([8, 17]) }],
      }),
    );
    handler = (stream) =>
      send(stream, new Uint8Array(), Code.FailedPrecondition, "index is rebuilding", {
        "grpc-status-details-bin": Buffer.from(status).toString("base64"),
        "retry-after": "2",
      });
    const pending = client.vector.queryVectors("store", "collection", { byId: "a" });
    await expect(pending).rejects.toMatchObject({
      code: Code.FailedPrecondition,
      rawMessage: "index is rebuilding",
      details: [{ type: "provider.Rebuild", value: Uint8Array.from([8, 17]) }],
    });
    await pending.catch((error: ConnectError) => expect(error.metadata.get("retry-after")).toBe("2"));
    expect(requests).toHaveLength(1);
  });

  it("keeps rich item and batch failures in their original slots despite a successful gRPC status", async () => {
    const error = {
      code: 16,
      message: "provider denied",
      details: [
        { typeUrl: "example.net/provider.Detail", value: Uint8Array.from([0, 255, 1]) },
        { typeUrl: "example.net/provider.Empty", value: new Uint8Array() },
      ],
    };
    const mapped = { ...error, details: error.details.map((d) => ({ typeUrl: d.typeUrl, value: d.value })) };
    response = toBinary(
      Proto.UpsertVectorsResponseAlpha1Schema,
      create(Proto.UpsertVectorsResponseAlpha1Schema, {
        ack: 1,
        failedItems: [{ id: "bad", error }],
      }),
    );
    expect(await client.vector.upsertVectors("store", "collection", [record])).toEqual({
      ack: "queued",
      failedItems: [{ id: "bad", error: mapped }],
    });
    response = toBinary(
      Proto.BatchQueryVectorsResponseAlpha1Schema,
      create(Proto.BatchQueryVectorsResponseAlpha1Schema, {
        results: [
          { result: { case: "error", value: error } },
          { result: { case: "response", value: { metric: 3, matches: [{ record, score: 2.5 }] } } },
          { result: { case: "error", value: { code: 1 } } },
        ],
      }),
    );
    expect(
      await client.vector.batchQueryVectors("store", "collection", [{ byId: "x" }, { byId: "a" }, { byId: "y" }]),
    ).toEqual([
      { error: mapped },
      { response: { metric: "euclidean", matches: [{ record, score: 2.5 }] } },
      { error: { code: 1, message: "", details: [] } },
    ]);
  });

  it.each([
    ["truncated frame", Buffer.from("00000000050a01", "hex"), Code.InvalidArgument],
    ["invalid protobuf", frame(Buffer.from("0a02ff", "hex")), Code.Internal],
  ] as const)("rejects a %s instead of returning success or retrying", async (_name, bytes, code) => {
    handler = (stream) => send(stream, bytes);
    await expect(client.vector.listCollections("store")).rejects.toMatchObject({ code });
    expect(requests).toHaveLength(1);
    handler = undefined;
    expect(await client.vector.listCollections("store")).toEqual(["recovered"]);
  });

  it("does not retry a received write whose stream is reset before its response", async () => {
    expectedStreamErrors = ["ERR_HTTP2_STREAM_ERROR"];
    handler = (stream) => stream.close(constants.NGHTTP2_INTERNAL_ERROR);
    await expect(client.vector.upsertVectors("store", "collection", [record])).rejects.toBeInstanceOf(ConnectError);
    expect(requests).toHaveLength(1);
    handler = undefined;
    expect(await client.vector.listCollections("store")).toEqual(["recovered"]);
  });

  it.each(cases)("cancels an in-flight $method RPC, not its concurrent sibling or later requests", async (test) => {
    expectedStreamErrors = ["ERR_HTTP2_STREAM_ERROR"];
    const received = deferred<ServerHttp2Stream>();
    handler = (stream) => (requests.length === 1 ? received.resolve(stream) : send(stream, frame(response)));
    const controller = new AbortController();
    const pending = test.invoke(client.vector, controller.signal);
    const stream = await received.promise;
    const closed = new Promise<void>((resolve) => stream.once("close", resolve));
    expect(await client.vector.listCollections("store")).toEqual(["recovered"]);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: Code.Canceled });
    await closed;
    expect(stream.closed).toBe(true);
    expect(await client.vector.listCollections("store")).toEqual(["recovered"]);
    expect(requests).toHaveLength(3);
  });

  it("isolates baggage, metadata, and out-of-order query results on one multiplexed connection", async () => {
    const received = deferred<ServerHttp2Stream>();
    const result = (id: string) =>
      encode(Proto.QueryVectorsResponseAlpha1Schema, {
        metric: 1,
        matches: [{ record: { id }, score: 1 }],
      });
    handler = (stream) => (requests.length === 1 ? received.resolve(stream) : send(stream, frame(result("second"))));
    const first = withBaggage({ tenant: "first" }, () =>
      client.vector.queryVectors("store", "collection", { byId: "first" }, { metadata: { tenant: "first" } }),
    );
    const stream = await received.promise;
    const second = await withBaggage({ tenant: "second" }, () =>
      client.vector.queryVectors("store", "collection", { byId: "second" }, { metadata: { tenant: "second" } }),
    );
    expect(second.matches[0].record.id).toBe("second");
    send(stream, frame(result("first")));
    expect((await first).matches[0].record.id).toBe("first");
    expect(requests.map((r) => r.headers.baggage)).toEqual(["tenant=first", "tenant=second"]);
    expect(requests.map((r) => fromBinary(Proto.QueryVectorsRequestAlpha1Schema, unframe(r.frame)).metadata)).toEqual([
      { tenant: "first" },
      { tenant: "second" },
    ]);
  });

  it.each(["request", "response"] as const)("enforces the configured %s size limit and recovers", async (direction) => {
    expectedStreamErrors = ["ERR_HTTP2_STREAM_ERROR"];
    const limited = makeClient(1 / 16);
    const large = { id: "large", values: [1], payload: new Uint8Array(128 * 1024) };
    try {
      response = toBinary(
        Proto.GetVectorsResponseAlpha1Schema,
        create(Proto.GetVectorsResponseAlpha1Schema, { records: [large] }),
      );
      const pending =
        direction === "request"
          ? limited.vector.upsertVectors("store", "collection", [large])
          : limited.vector.getVectors("store", "collection", ["large"]);
      await expect(pending).rejects.toMatchObject({ code: Code.ResourceExhausted });
      response = encode(Proto.ListCollectionsResponseAlpha1Schema, { collections: ["recovered"] });
      expect(await limited.vector.listCollections("store")).toEqual(["recovered"]);
    } finally {
      await limited.stop();
    }
  });
});

function frame(data: Uint8Array): Buffer {
  const prefix = Buffer.alloc(5);
  prefix.writeUInt32BE(data.length, 1);
  return Buffer.concat([prefix, data]);
}

function unframe(data: Buffer): Buffer {
  expect(data.length).toBeGreaterThanOrEqual(5);
  expect(data[0]).toBe(0);
  expect(data.readUInt32BE(1)).toBe(data.length - 5);
  return data.subarray(5);
}

function send(
  stream: ServerHttp2Stream,
  data: Uint8Array,
  code = 0,
  message = "",
  trailers: Record<string, string> = {},
): void {
  stream.respond({ ":status": 200, "content-type": "application/grpc" }, { waitForTrailers: true });
  stream.once("wantTrailers", () =>
    stream.sendTrailers({
      "grpc-status": String(code),
      "grpc-message": encodeURIComponent(message),
      ...trailers,
    }),
  );
  stream.end(data);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

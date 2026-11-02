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

import { getEventListeners, once } from "node:events";
import { createServer, Http2Server, IncomingHttpHeaders, ServerHttp2Session, ServerHttp2Stream } from "node:http2";
import { create, DescMessage, fromBinary, fromJson, JsonObject, toBinary, toJson } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import {
  CommunicationProtocolEnum,
  DaprClient,
  GRPCClient,
  IClientSearch,
  IndexingOptions,
  LogLevel,
  SearchQuery,
  withBaggage,
} from "../../../../src";
import * as Proto from "../../../../src/proto/dapr/proto/runtime/v1/search_pb";
import { StatusSchema } from "../../../../src/proto/google/rpc/status_pb";

const scope = { storeName: "store", index: "index" };
const metadata = Object.freeze({ tenant: "request", empty: "" });
const document = Object.freeze({
  id: "a",
  content: Object.freeze({ title: "Dapr \u00e9 \ud83d\udcda", nested: [null, false, 0] }),
  metadata: Object.freeze({ source: "stored" }),
});
const documentJson = { ...document, content: Buffer.from(JSON.stringify(document.content)).toString("base64") };
const wait: IndexingOptions = Object.freeze({
  mode: "waitForCompletion",
  waitTimeout: "1.000000001s",
  onWaitTimeout: "continueAsync",
});
const indexingJson = {
  mode: "INDEXING_MODE_WAIT_FOR_COMPLETION",
  waitTimeout: "1.000000001s",
  onWaitTimeout: "INDEXING_WAIT_TIMEOUT_ACTION_CONTINUE_ASYNC",
};
const filter: JsonObject = { $and: [{ category: { $eq: "books" } }, { "details.price": { $gte: 0 } }] };
const query = Object.freeze<SearchQuery>({
  text: "Dapr",
  filter,
  topK: 2,
  continuationToken: "opaque +/%?#",
  returnFields: Object.freeze(["title", "details.price"]),
  includeContent: true,
  searchFields: Object.freeze(["title"]),
  sort: Object.freeze([{ field: "details.price" }, { field: "title", order: "desc" as const }]),
  highlightFields: Object.freeze(["title"]),
});

function encode(schema: DescMessage, json: JsonObject): Uint8Array {
  return toBinary(schema, fromJson(schema, json));
}

type WireCase = {
  method: string;
  schema: DescMessage;
  request: JsonObject;
  response: Uint8Array;
  result: unknown;
  invoke: (search: IClientSearch, signal?: AbortSignal) => Promise<unknown>;
};

const cases: WireCase[] = [
  {
    method: "CreateIndexAlpha1",
    schema: Proto.CreateIndexRequestAlpha1Schema,
    request: { ...scope, metadata },
    response: new Uint8Array(),
    result: undefined,
    invoke: (s, signal) => s.createIndex("store", "index", { metadata, signal }),
  },
  {
    method: "GetIndexAlpha1",
    schema: Proto.GetIndexRequestAlpha1Schema,
    request: { ...scope, metadata },
    response: encode(Proto.GetIndexResponseAlpha1Schema, {
      index: "index",
      documentCount: "17",
      properties: { provider: "test" },
    }),
    result: { index: "index", documentCount: 17, properties: { provider: "test" } },
    invoke: (s, signal) => s.getIndex("store", "index", { metadata, signal }),
  },
  {
    method: "ListIndexesAlpha1",
    schema: Proto.ListIndexesRequestAlpha1Schema,
    request: { storeName: "store", metadata },
    response: encode(Proto.ListIndexesResponseAlpha1Schema, { indexes: ["index", "other"] }),
    result: ["index", "other"],
    invoke: (s, signal) => s.listIndexes("store", { metadata, signal }),
  },
  {
    method: "DeleteIndexAlpha1",
    schema: Proto.DeleteIndexRequestAlpha1Schema,
    request: { ...scope, metadata },
    response: new Uint8Array(),
    result: undefined,
    invoke: (s, signal) => s.deleteIndex("store", "index", { metadata, signal }),
  },
  {
    method: "IndexDocumentsAlpha1",
    schema: Proto.IndexDocumentsRequestAlpha1Schema,
    request: { ...scope, metadata, documents: [documentJson], options: indexingJson },
    response: encode(Proto.IndexDocumentsResponseAlpha1Schema, { ack: "INDEX_ACK_COMPLETED" }),
    result: { ack: "completed", failedItems: [] },
    invoke: (s, signal) => s.indexDocuments("store", "index", Object.freeze([document]), { ...wait, metadata, signal }),
  },
  {
    method: "GetDocumentsAlpha1",
    schema: Proto.GetDocumentsRequestAlpha1Schema,
    request: { ...scope, metadata, ids: ["missing", "b", "a"], includeContent: true },
    response: encode(Proto.GetDocumentsResponseAlpha1Schema, { documents: [{ id: "b" }, documentJson] }),
    result: [{ id: "b", content: undefined, metadata: {} }, document],
    invoke: (s, signal) =>
      s.getDocuments("store", "index", Object.freeze(["missing", "b", "a"]), {
        includeContent: true,
        metadata,
        signal,
      }),
  },
  {
    method: "DeleteDocumentsAlpha1",
    schema: Proto.DeleteDocumentsRequestAlpha1Schema,
    request: { ...scope, metadata, ids: ["a"], options: indexingJson },
    response: encode(Proto.DeleteDocumentsResponseAlpha1Schema, { ack: "INDEX_ACK_QUEUED" }),
    result: "queued",
    invoke: (s, signal) => s.deleteDocuments("store", "index", ["a"], { ...wait, metadata, signal }),
  },
  {
    method: "SearchAlpha1",
    schema: Proto.SearchRequestAlpha1Schema,
    request: {
      ...scope,
      metadata,
      query: {
        text: "Dapr",
        filter,
        topK: 2,
        continuationToken: "opaque +/%?#",
        returnFields: ["title", "details.price"],
        includeContent: true,
        searchFields: ["title"],
        sort: [
          { field: "details.price", order: "SORT_ORDER_ASC" },
          { field: "title", order: "SORT_ORDER_DESC" },
        ],
        highlightFields: ["title"],
      },
    },
    response: encode(Proto.SearchResponseAlpha1Schema, {
      hits: [{ document: documentJson, score: 0.75, highlights: { title: "<em>Dapr</em>" } }],
      totalHits: "3",
      totalHitsRelation: "TOTAL_HITS_RELATION_ESTIMATE",
      continuationToken: "next-page",
    }),
    result: {
      hits: [{ document, score: 0.75, highlights: { title: "<em>Dapr</em>" } }],
      totalHits: 3,
      totalHitsRelation: "estimate",
      continuationToken: "next-page",
    },
    invoke: (s, signal) => s.search("store", "index", query, { metadata, signal }),
  },
];

describe("Search gRPC HTTP/2 wire contract", () => {
  let server: Http2Server;
  let client: DaprClient;
  let transport: GRPCClient;
  let response: Uint8Array;
  let handler: ((stream: ServerHttp2Stream) => void) | undefined;
  const sessions = new Set<ServerHttp2Session>();
  const requests: { headers: IncomingHttpHeaders; frame: Buffer }[] = [];
  const streamErrors: NodeJS.ErrnoException[] = [];
  let expectedStreamErrors: string[];
  const serializer = {
    serialize: jest.fn((): never => {
      throw new Error("Search must not use the application serializer");
    }),
    deserialize: jest.fn((): never => {
      throw new Error("Search must not use the application deserializer");
    }),
  };

  beforeAll(async () => {
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
    client = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      daprHost: "127.0.0.1",
      daprPort: String(address.port),
      daprApiToken: "search-wire-token",
      logger: { level: LogLevel.Error },
      serializer,
    });
    if (!(client.daprClient instanceof GRPCClient)) throw new Error("Expected gRPC transport");
    transport = client.daprClient;
    transport.setIsInitialized(true);
  });

  beforeEach(() => {
    requests.length = 0;
    streamErrors.length = 0;
    expectedStreamErrors = [];
    response = encode(Proto.ListIndexesResponseAlpha1Schema, { indexes: ["recovered"] });
    handler = undefined;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const error of streamErrors) expect(expectedStreamErrors).toContain(error.code);
    expect(serializer.serialize).not.toHaveBeenCalled();
    expect(serializer.deserialize).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await client?.stop();
    for (const session of sessions) session.destroy();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it.each(cases)("maps $method with exact protobuf fields, authentication, and baggage", async (test) => {
    response = test.response;
    expect(await withBaggage({ tenant: "search tests" }, () => test.invoke(client.search))).toEqual(test.result);
    expect(requests).toHaveLength(1);
    expect(requests[0].headers).toMatchObject({
      ":method": "POST",
      ":path": `/dapr.proto.runtime.v1.Dapr/${test.method}`,
      "content-type": expect.stringMatching(/^application\/grpc(?:\+proto)?$/),
      "dapr-api-token": "search-wire-token",
      baggage: "tenant=search%20tests",
    });
    expect(toJson(test.schema, fromBinary(test.schema, unframe(requests[0].frame)))).toEqual(test.request);
  });

  it("matches independent protobuf bytes for omitted queries, empty oneofs, and explicit zero/false options", async () => {
    response = new Uint8Array();
    await expect(client.search.search("s", "i")).resolves.toEqual({
      hits: [],
      totalHits: undefined,
      totalHitsRelation: "unspecified",
      continuationToken: undefined,
    });
    expect(unframe(requests[0].frame).toString("hex")).toBe("0a0173120169");
    await client.search.search("s", "i", {});
    expect(unframe(requests[1].frame).toString("hex")).toBe("0a01731201691a00");
    response = Buffer.from("10001a00", "hex");
    await expect(
      client.search.search("s", "i", { text: "", topK: 0, continuationToken: "", includeContent: false }),
    ).resolves.toMatchObject({ totalHits: 0, continuationToken: "" });
    expect(unframe(requests[2].frame).toString("hex")).toBe("0a01731201691a080a0020002a003800");
    await client.search.search("s", "i", { native: {} });
    expect(unframe(requests[3].frame).toString("hex")).toBe("0a01731201691a021200");
  });

  it("encodes document content as raw UTF-8 JSON bytes rather than base64 text", async () => {
    response = Buffer.from("1002", "hex");
    await client.search.indexDocuments("s", "i", [{ id: "a", content: {} }], { mode: "returnOnAcceptance" });
    expect(unframe(requests[0].frame).toString("hex")).toBe("0a01731201691a070a016112027b7d2a020802");
  });

  it("preserves native/filter objects, reserved keys, opaque names, and maximum uint32 page sizes", async () => {
    const native: JsonObject = JSON.parse(
      '{"q":"Dapr","nested":{"@type":"not-a-proto","fields":{"value":[null,false,0]}},"__proto__":{"x":"y"}}',
    );
    const stored: Record<string, string> = JSON.parse('{"__proto__":"stored","empty":""}');
    const store = "store /%?#\\\u00e9";
    const index = "index /%?#\\\u00e9";
    response = new Uint8Array();
    await client.search.search(store, index, { native, filter: native, topK: 0xffffffff }, { metadata: stored });
    const request = fromBinary(Proto.SearchRequestAlpha1Schema, unframe(requests[0].frame));
    expect(request).toMatchObject({
      storeName: store,
      index,
      metadata: stored,
      query: { kind: { case: "native", value: native }, filter: native, topK: 0xffffffff },
    });
    expect(request.query?.filter).toHaveProperty("__proto__", { x: "y" });
    expect(request.metadata).toHaveProperty("__proto__", "stored");
  });

  it.each([undefined, false, true])("preserves includeContent=%s on retrieval", async (includeContent) => {
    response = new Uint8Array();
    await expect(client.search.getDocuments("store", "index", [], { includeContent })).resolves.toEqual([]);
    expect(fromBinary(Proto.GetDocumentsRequestAlpha1Schema, unframe(requests[0].frame)).includeContent).toBe(
      includeContent,
    );
  });

  it.each([
    ["0.000000001s", 0n, 1],
    ["1.001000009s", 1n, 1000009],
    ["315576000000s", 315576000000n, 0],
  ] as const)("preserves seconds and nanoseconds for %s on both writes", async (waitTimeout, seconds, nanos) => {
    for (const onWaitTimeout of ["continueAsync", "failRequest"] as const) {
      const options: IndexingOptions = { mode: "waitForCompletion", waitTimeout, onWaitTimeout };
      response = Buffer.from("1002", "hex");
      await client.search.indexDocuments("store", "index", [], options);
      response = Buffer.from("0801", "hex");
      await client.search.deleteDocuments("store", "index", [], options);
      for (const [schema, request] of [
        [Proto.IndexDocumentsRequestAlpha1Schema, requests[requests.length - 2]],
        [Proto.DeleteDocumentsRequestAlpha1Schema, requests[requests.length - 1]],
      ] as const) {
        expect(fromBinary(schema, unframe(request.frame)).options).toMatchObject({
          mode: Proto.IndexingMode.WAIT_FOR_COMPLETION,
          waitTimeout: { seconds, nanos },
          onWaitTimeout:
            onWaitTimeout === "continueAsync"
              ? Proto.IndexingWaitTimeoutAction.CONTINUE_ASYNC
              : Proto.IndexingWaitTimeoutAction.FAIL_REQUEST,
        });
      }
    }
  });

  it.each([undefined, {}, { metadata }, { mode: "returnOnAcceptance" }] satisfies (IndexingOptions | undefined)[])(
    "does not accidentally request completion for %j",
    async (options) => {
      response = Buffer.from("1001", "hex");
      await expect(client.search.indexDocuments("store", "index", [], options)).resolves.toEqual({
        ack: "queued",
        failedItems: [],
      });
      response = Buffer.from("0802", "hex");
      await expect(client.search.deleteDocuments("store", "index", [], options)).resolves.toBe("completed");
      const expected =
        options?.mode === "returnOnAcceptance"
          ? create(Proto.IndexingOptionsAlpha1Schema, { mode: Proto.IndexingMode.RETURN_ON_ACCEPTANCE })
          : undefined;
      expect(fromBinary(Proto.IndexDocumentsRequestAlpha1Schema, unframe(requests[0].frame)).options).toEqual(expected);
      expect(fromBinary(Proto.DeleteDocumentsRequestAlpha1Schema, unframe(requests[1].frame)).options).toEqual(
        expected,
      );
    },
  );

  it.each([undefined, null, false, 0, "text", []].map((value) => [value]))(
    "leaves non-object content %j to runtime item validation",
    async (content) => {
      response = Buffer.from("1002", "hex");
      await client.search.indexDocuments("store", "index", [{ id: "a", content }]);
      const request = fromBinary(Proto.IndexDocumentsRequestAlpha1Schema, unframe(requests[0].frame));
      expect(Buffer.from(request.documents[0].content).toString("utf8")).toBe(JSON.stringify(content ?? null));
    },
  );

  it.each([Proto.IndexAck.QUEUED, Proto.IndexAck.COMPLETED])(
    "preserves canonical item failures and opaque Any bytes with acknowledgement %i",
    async (ack) => {
      const details = [
        { typeUrl: "type.googleapis.com/google.rpc.ErrorInfo", value: Uint8Array.from([10, 3, 66, 65, 68]) },
        { typeUrl: "example.net/provider.Detail", value: Uint8Array.from([0, 255, 1]) },
        { typeUrl: "example.net/provider.Empty", value: new Uint8Array() },
      ];
      response = toBinary(
        Proto.IndexDocumentsResponseAlpha1Schema,
        create(Proto.IndexDocumentsResponseAlpha1Schema, {
          ack,
          failedItems: [
            { id: "bad", error: { code: 3, message: "Expected an object", details } },
            { id: "other", error: { code: 13 } },
          ],
        }),
      );
      expect(await client.search.indexDocuments("store", "index", [])).toEqual({
        ack: ack === Proto.IndexAck.QUEUED ? "queued" : "completed",
        failedItems: [
          {
            id: "bad",
            errorCode: 3,
            errorMessage: "Expected an object",
            details: details.map((detail) => ({
              "@type": detail.typeUrl,
              value: Buffer.from(detail.value).toString("base64"),
            })),
          },
          { id: "other", errorCode: 13, errorMessage: "", details: [] },
        ],
      });
    },
  );

  it.each([0, 99])("rejects invalid acknowledgement %i for both writes", async (ack) => {
    response = encode(Proto.IndexDocumentsResponseAlpha1Schema, { ack });
    await expect(client.search.indexDocuments("store", "index", [])).rejects.toThrow("acknowledgement");
    response = encode(Proto.DeleteDocumentsResponseAlpha1Schema, { ack });
    await expect(client.search.deleteDocuments("store", "index", [])).rejects.toThrow("acknowledgement");
  });

  it.each<JsonObject>([{}, { id: "a" }, { id: "a", error: {} }, { id: "a", error: { code: 17 } }])(
    "rejects malformed item failure %j",
    async (failure) => {
      response = encode(Proto.IndexDocumentsResponseAlpha1Schema, { ack: 2, failedItems: [failure] });
      await expect(client.search.indexDocuments("store", "index", [])).rejects.toThrow();
    },
  );

  it("rejects a binary error detail without its type URL", async () => {
    response = toBinary(
      Proto.IndexDocumentsResponseAlpha1Schema,
      create(Proto.IndexDocumentsResponseAlpha1Schema, {
        ack: Proto.IndexAck.COMPLETED,
        failedItems: [{ id: "a", error: { code: 3, details: [{ value: Uint8Array.from([1]) }] } }],
      }),
    );
    await expect(client.search.indexDocuments("store", "index", [])).rejects.toThrow("type URL");
  });

  it.each([
    [0, "unspecified"],
    [1, "exact"],
    [2, "lowerBound"],
    [3, "estimate"],
  ])("maps total-hits relation %s without inventing optional totals", async (totalHitsRelation, expected) => {
    response = encode(Proto.SearchResponseAlpha1Schema, { totalHitsRelation, hits: [{ document: { id: "a" } }] });
    expect(await client.search.search("store", "index")).toEqual({
      hits: [{ document: { id: "a", content: undefined, metadata: {} }, score: 0, highlights: {} }],
      totalHitsRelation: expected,
      totalHits: undefined,
      continuationToken: undefined,
    });
  });

  it.each(["0", "9007199254740991"])("returns safe uint64 count %s without rounding", async (count) => {
    response = encode(Proto.GetIndexResponseAlpha1Schema, { index: "index", documentCount: count });
    expect((await client.search.getIndex("store", "index")).documentCount).toBe(Number(count));
    response = encode(Proto.SearchResponseAlpha1Schema, { totalHits: count });
    expect((await client.search.search("store", "index")).totalHits).toBe(Number(count));
  });

  it.each(["9007199254740992", "18446744073709551615"])("rejects unsafe uint64 count %s", async (count) => {
    response = encode(Proto.GetIndexResponseAlpha1Schema, { index: "index", documentCount: count });
    await expect(client.search.getIndex("store", "index")).rejects.toThrow("safe integer");
    response = encode(Proto.SearchResponseAlpha1Schema, { totalHits: count });
    await expect(client.search.search("store", "index")).rejects.toThrow("safe integer");
  });

  it.each<JsonObject>([{ hits: [{}] }, { hits: [{ document: { id: "a" }, score: "NaN" }] }, { totalHitsRelation: 99 }])(
    "rejects malformed search results %j instead of partial success",
    async (json) => {
      response = encode(Proto.SearchResponseAlpha1Schema, json);
      await expect(client.search.search("store", "index")).rejects.toThrow();
      response = new Uint8Array();
      await expect(client.search.search("store", "index")).resolves.toMatchObject({ hits: [] });
    },
  );

  it.each([Buffer.from("not-json"), Buffer.from([123, 34, 120, 34, 58, 34, 255, 34, 125])])(
    "rejects malformed content bytes without returning partial documents or hits",
    async (content) => {
      const documents = [{ id: "good" }, { id: "bad", content }];
      response = toBinary(
        Proto.GetDocumentsResponseAlpha1Schema,
        create(Proto.GetDocumentsResponseAlpha1Schema, { documents }),
      );
      await expect(client.search.getDocuments("store", "index", ["good", "bad"])).rejects.toThrow();
      response = toBinary(
        Proto.SearchResponseAlpha1Schema,
        create(Proto.SearchResponseAlpha1Schema, { hits: documents.map((document) => ({ document })) }),
      );
      await expect(client.search.search("store", "index")).rejects.toThrow();
    },
  );

  it("rejects invalid request data before initializing or contacting the sidecar", async () => {
    const connect = jest.spyOn(transport, "getClient");
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const invalid = [
      () => client.search.createIndex("", "index"),
      () => client.search.getIndex("store", ".."),
      () => client.search.listIndexes("store", { metadata: { bad: 1 } } as never),
      () => client.search.deleteIndex("store", "index", null as never),
      () => client.search.indexDocuments("store", "index", [{ id: "a", content: circular }]),
      () => client.search.indexDocuments("store", "index", Array(1)),
      () => client.search.getDocuments("store", "index", [""]),
      () => client.search.getDocuments("store", "index", [], { includeContent: "yes" } as never),
      () => client.search.deleteDocuments("store", "index", [], { mode: "waitForCompletion" } as never),
      () => client.search.search("store", "index", { text: "", native: {} } as never),
      () => client.search.search("store", "index", { topK: 0x100000000 }),
      () => client.search.search("store", "index", { sort: [{ field: "title", order: "up" }] } as never),
      () => client.search.search("store", "index", { native: circular } as never),
    ];
    for (const operation of invalid) {
      await expect(operation()).rejects.toThrow();
    }
    expect(connect).not.toHaveBeenCalled();
    expect(requests).toHaveLength(0);
  });

  it.each(cases)("propagates Unimplemented for $method without falling back to HTTP or retrying", async (test) => {
    handler = (stream) => send(stream, new Uint8Array(), Code.Unimplemented, "Search is unavailable");
    await expect(test.invoke(client.search)).rejects.toMatchObject({
      code: Code.Unimplemented,
      rawMessage: "Search is unavailable",
    });
    expect(requests).toHaveLength(1);
    handler = undefined;
    expect(await client.search.listIndexes("store")).toEqual(["recovered"]);
  });

  it.each([Code.InvalidArgument, Code.Unauthenticated, Code.NotFound, Code.DeadlineExceeded, Code.Unavailable])(
    "propagates gRPC status %i without retrying writes",
    async (code) => {
      handler = (stream) => send(stream, new Uint8Array(), code, "provider / % \u00e9\nfailed");
      await expect(client.search.indexDocuments("store", "index", [document])).rejects.toMatchObject({
        code,
        rawMessage: "provider / % \u00e9\nfailed",
      });
      expect(requests).toHaveLength(1);
    },
  );

  it("preserves structured status trailers on request-wide failures", async () => {
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
    const pending = client.search.search("store", "index");
    await expect(pending).rejects.toMatchObject({
      code: Code.FailedPrecondition,
      rawMessage: "index is rebuilding",
      details: [{ type: "provider.Rebuild", value: Uint8Array.from([8, 17]) }],
    });
    await pending.catch((error: ConnectError) => expect(error.metadata.get("retry-after")).toBe("2"));
  });

  it.each(cases)("never initializes or sends a pre-canceled $method", async (test) => {
    const connect = jest.spyOn(transport, "getClient");
    const controller = new AbortController();
    const reason = new Error("cancelled before sending");
    controller.abort(reason);
    await expect(test.invoke(client.search, controller.signal)).rejects.toBe(reason);
    expect(connect).not.toHaveBeenCalled();
    expect(requests).toHaveLength(0);
  });

  it.each(cases)("cancels $method promptly while initialization is pending and removes its listener", async (test) => {
    const initialized = await transport.getClient(false);
    const initialization = deferred<typeof initialized>();
    jest.spyOn(transport, "getClient").mockReturnValueOnce(initialization.promise);
    const controller = new AbortController();
    const reason = new Error("cancel initialization wait");
    const pending = test.invoke(client.search, controller.signal);
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(1);
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
    initialization.resolve(initialized);
    await initialization.promise;
    expect(requests).toHaveLength(0);
    expect(await client.search.listIndexes("store")).toEqual(["recovered"]);
  });

  it("does not send a request when initialization itself aborts the signal", async () => {
    const initialized = await transport.getClient(false);
    const controller = new AbortController();
    const reason = new Error("cancel before initialized client is returned");
    jest.spyOn(transport, "getClient").mockImplementationOnce(async () => {
      controller.abort(reason);
      return initialized;
    });
    await expect(client.search.listIndexes("store", { signal: controller.signal })).rejects.toBe(reason);
    expect(requests).toHaveLength(0);
  });

  it("propagates initialization failure without replacing the error or leaking its listener", async () => {
    const error = new Error("sidecar unavailable");
    const controller = new AbortController();
    jest.spyOn(transport, "getClient").mockRejectedValueOnce(error);
    await expect(client.search.listIndexes("store", { signal: controller.signal })).rejects.toBe(error);
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
    expect(requests).toHaveLength(0);
  });

  it.each(cases)("cancels an in-flight $method without canceling concurrent or later requests", async (test) => {
    expectedStreamErrors = ["ERR_HTTP2_STREAM_ERROR"];
    const received = deferred<ServerHttp2Stream>();
    handler = (stream) => (requests.length === 1 ? received.resolve(stream) : send(stream, frame(response)));
    const controller = new AbortController();
    const pending = test.invoke(client.search, controller.signal);
    const stream = await received.promise;
    const closed = new Promise<void>((resolve) => stream.once("close", resolve));
    expect(await client.search.listIndexes("store")).toEqual(["recovered"]);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: Code.Canceled });
    await closed;
    expect(stream.closed).toBe(true);
    expect(await client.search.listIndexes("store")).toEqual(["recovered"]);
    expect(requests).toHaveLength(3);
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
    stream.sendTrailers({ "grpc-status": String(code), "grpc-message": encodeURIComponent(message), ...trailers }),
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

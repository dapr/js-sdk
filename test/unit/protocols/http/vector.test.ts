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
import { createServer, IncomingHttpHeaders, Server, ServerResponse } from "node:http";
import fetch, { Response } from "node-fetch";
import {
  CommunicationProtocolEnum,
  DaprClient,
  HTTPClient,
  IClientVector,
  LogLevel,
  withBaggage,
} from "../../../../src";

type WireCase = {
  name: string;
  method: string;
  path: string;
  body?: unknown;
  response?: unknown;
  result?: unknown;
  status?: number;
  invoke: (vector: IClientVector, signal?: AbortSignal) => Promise<unknown>;
};
const metadata = { tenant: "wire", empty: "" };
const cases: WireCase[] = [
  {
    name: "createCollection",
    method: "POST",
    path: "/collection",
    status: 204,
    body: { dimensions: 3, metric: "DISTANCE_METRIC_EUCLIDEAN", metadata },
    invoke: (v, signal) =>
      v.createCollection("store", "collection", { dimensions: 3, metric: "euclidean", metadata, signal }),
  },
  {
    name: "getCollection",
    method: "GET",
    path: "/collection?metadata.tenant=wire&metadata.empty=",
    response: { collection: "collection", recordCount: "7", dimensions: 3, metric: "DISTANCE_METRIC_COSINE" },
    result: { collection: "collection", recordCount: 7, dimensions: 3, metric: "cosine", properties: {} },
    invoke: (v, signal) => v.getCollection("store", "collection", { metadata, signal }),
  },
  {
    name: "listCollections",
    method: "GET",
    path: "?metadata.tenant=wire&metadata.empty=",
    response: { collections: ["collection"] },
    result: ["collection"],
    invoke: (v, signal) => v.listCollections("store", { metadata, signal }),
  },
  {
    name: "deleteCollection",
    method: "DELETE",
    path: "/collection?metadata.tenant=wire&metadata.empty=",
    status: 204,
    invoke: (v, signal) => v.deleteCollection("store", "collection", { metadata, signal }),
  },
  {
    name: "upsertVectors",
    method: "POST",
    path: "/collection/vectors",
    body: {
      metadata,
      records: [{ id: "a", values: [1, 2, 3], payload: "AP8=" }],
      options: {
        mode: "INDEXING_MODE_WAIT_FOR_COMPLETION",
        waitTimeout: "0.250000001s",
        onWaitTimeout: "INDEXING_WAIT_TIMEOUT_ACTION_FAIL_REQUEST",
      },
    },
    response: { ack: "INDEX_ACK_QUEUED" },
    result: { ack: "queued", failedItems: [] },
    invoke: (v, signal) =>
      v.upsertVectors("store", "collection", [{ id: "a", values: [1, 2, 3], payload: Uint8Array.from([0, 255]) }], {
        metadata,
        signal,
        mode: "waitForCompletion",
        waitTimeout: "0.250000001s",
        onWaitTimeout: "failRequest",
      }),
  },
  {
    name: "getVectors",
    method: "POST",
    path: "/collection/vectors/get",
    body: { metadata, ids: ["missing", "a"], includeValues: true },
    response: { records: [{ id: "a", values: [1, 2, 3], payload: "AP8=" }] },
    result: [{ id: "a", values: [1, 2, 3], payload: Uint8Array.from([0, 255]) }],
    invoke: (v, signal) =>
      v.getVectors("store", "collection", ["missing", "a"], { includeValues: true, metadata, signal }),
  },
  {
    name: "deleteVectors",
    method: "POST",
    path: "/collection/vectors/delete",
    body: { metadata, ids: ["a"], options: { mode: "INDEXING_MODE_RETURN_ON_ACCEPTANCE" } },
    response: { ack: "INDEX_ACK_COMPLETED" },
    result: "completed",
    invoke: (v, signal) =>
      v.deleteVectors("store", "collection", ["a"], { mode: "returnOnAcceptance", metadata, signal }),
  },
  {
    name: "queryVectors",
    method: "POST",
    path: "/collection/query",
    body: { metadata, query: { byId: "a", topK: 0, scoreThreshold: 0, includeValues: false, includePayload: false } },
    response: { metric: "DISTANCE_METRIC_COSINE" },
    result: { metric: "cosine", matches: [] },
    invoke: (v, signal) =>
      v.queryVectors(
        "store",
        "collection",
        {
          byId: "a",
          topK: 0,
          scoreThreshold: 0,
          includeValues: false,
          includePayload: false,
        },
        { metadata, signal },
      ),
  },
  {
    name: "batchQueryVectors",
    method: "POST",
    path: "/collection/batch-query",
    body: {
      metadata,
      queries: [{ vector: { values: [1, 0, 0] }, filter: { "nested.flag": { $eq: false } } }, { byId: "missing" }],
    },
    response: {
      results: [{ response: { metric: "DISTANCE_METRIC_EUCLIDEAN" } }, { error: { code: 5, message: "missing" } }],
    },
    result: [
      { response: { metric: "euclidean", matches: [] } },
      { error: { code: 5, message: "missing", details: [] } },
    ],
    invoke: (v, signal) =>
      v.batchQueryVectors(
        "store",
        "collection",
        [{ vector: [1, 0, 0], filter: { "nested.flag": { $eq: false } } }, { byId: "missing" }],
        { metadata, signal },
      ),
  },
];

describe("Vector HTTP wire contract", () => {
  let server: Server;
  let client: DaprClient;
  let transport: HTTPClient;
  let response: unknown;
  let status: number;
  let stall: boolean;
  let arrived: (() => void) | undefined;
  let rawResponse: string | undefined;
  let handler: ((res: ServerResponse) => void) | undefined;
  const requests: { method?: string; url?: string; headers: IncomingHttpHeaders; body: string }[] = [];
  const serializer = {
    serialize: jest.fn((): never => {
      throw new Error("must not serialize vector API envelopes");
    }),
    deserialize: jest.fn((): never => {
      throw new Error("must not deserialize opaque vector bytes");
    }),
  };

  beforeAll(async () => {
    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      requests.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() });
      arrived?.();
      if (handler) {
        handler(res);
        return;
      }
      if (stall) return;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(rawResponse ?? JSON.stringify(response));
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (address === null || typeof address === "string") throw new Error("Expected an HTTP test server address");
    client = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      daprHost: "127.0.0.1",
      daprPort: String(address.port),
      daprApiToken: "vector-test-token",
      serializer,
      logger: { level: LogLevel.Error },
    });
    if (!(client.daprClient instanceof HTTPClient)) throw new Error("Expected HTTP transport");
    transport = client.daprClient;
    transport.setIsInitialized(true);
  });

  beforeEach(() => {
    requests.length = 0;
    response = { collections: [] };
    status = 200;
    stall = false;
    arrived = undefined;
    rawResponse = undefined;
    handler = undefined;
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    await client?.stop();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it("sends protobuf JSON, auth, baggage, and binary payloads without using the application serializer", async () => {
    response = { ack: "INDEX_ACK_COMPLETED", failedItems: [] };
    await withBaggage({ tenant: "example" }, () =>
      client.vector.upsertVectors("store /%?#\u00e9", "collection /%?#\u00e9", [
        {
          id: "a",
          values: [1, 0, 0],
          payload: Buffer.from([0, 255, 128, 123]),
          metadata: { nested: { value: false } },
        },
        { id: "empty", values: [0, 1, 0], payload: Buffer.alloc(0) },
        { id: "absent", values: [0, 0, 1] },
      ]),
    );
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("POST");
    expect(requests[0].url).toBe(
      "/v1.0-alpha1/vector/store%20%2F%25%3F%23%C3%A9/collections/collection%20%2F%25%3F%23%C3%A9/vectors",
    );
    expect(requests[0].headers).toMatchObject({
      "dapr-api-token": "vector-test-token",
      baggage: "tenant=example",
      "content-type": "application/json",
      "user-agent": expect.stringMatching(/^dapr-sdk-js\//),
    });
    expect(JSON.parse(requests[0].body)).toEqual({
      records: [
        { id: "a", values: [1, 0, 0], payload: "AP+Aew==", metadata: { nested: { value: false } } },
        { id: "empty", values: [0, 1, 0], payload: "" },
        { id: "absent", values: [0, 0, 1] },
      ],
    });
    expect(serializer.serialize).not.toHaveBeenCalled();
    expect(serializer.deserialize).not.toHaveBeenCalled();
  });

  it("sends read metadata as query parameters without a body and accepts empty lists", async () => {
    expect(await client.vector.listCollections("store", { metadata: { "key +/?": "value +/%?#\u00e9" } })).toEqual([]);
    expect(requests[0]).toMatchObject({
      method: "GET",
      url: "/v1.0-alpha1/vector/store/collections?metadata.key+%2B%2F%3F=value+%2B%2F%25%3F%23%C3%A9",
      body: "",
    });
  });

  it.each(cases)(
    "exercises $name through real HTTP, including response mapping and body/query metadata",
    async (test) => {
      response = test.response;
      status = test.status ?? 200;
      expect(await withBaggage({ tenant: "wire" }, () => test.invoke(client.vector))).toEqual(test.result);
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        method: test.method,
        url: `/v1.0-alpha1/vector/store/collections${test.path}`,
        headers: { "dapr-api-token": "vector-test-token", baggage: "tenant=wire" },
      });
      if (test.body === undefined) expect(requests[0].body).toBe("");
      else expect(JSON.parse(requests[0].body)).toEqual(test.body);
      expect(serializer.serialize).not.toHaveBeenCalled();
      expect(serializer.deserialize).not.toHaveBeenCalled();
    },
  );

  it.each(cases)("does not send a pre-cancelled $name request", async (test) => {
    const controller = new AbortController();
    const reason = new Error("cancelled before sending");
    controller.abort(reason);
    await expect(test.invoke(client.vector, controller.signal)).rejects.toBe(reason);
    expect(requests).toHaveLength(0);
  });

  it.each([400, 401, 404, 429, 503])("propagates HTTP %i error bodies without retry and recovers", async (code) => {
    status = code;
    response = { errorCode: "VECTOR_PROVIDER_ERROR", message: "provider rejected the request" };
    await expect(client.vector.listCollections("store")).rejects.toThrow(`"status":${code}`);
    expect(requests).toHaveLength(1);
    status = 200;
    response = { collections: ["after-failure"] };
    expect(await client.vector.listCollections("store")).toEqual(["after-failure"]);
  });

  it("does not send a pre-cancelled write", async () => {
    const controller = new AbortController();
    const reason = new Error("cancel before request");
    controller.abort(reason);
    await expect(client.vector.upsertVectors("store", "collection", [], { signal: controller.signal })).rejects.toBe(
      reason,
    );
    expect(requests).toHaveLength(0);
  });

  it("aborts a stalled HTTP response and keeps the client usable", async () => {
    stall = true;
    const received = new Promise<void>((resolve) => {
      arrived = resolve;
    });
    const controller = new AbortController();
    const pending = client.vector.listCollections("store", { signal: controller.signal });
    await received;
    controller.abort();
    await expect(pending).rejects.toThrow(/abort/i);
    stall = false;
    expect(await client.vector.listCollections("store")).toEqual([]);
    expect(requests).toHaveLength(2);
  });

  it("cancels only one HTTP initialization waiter and cleans up its abort listener", async () => {
    let resolve!: (client: typeof fetch) => void;
    jest.spyOn(transport, "getClient").mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const controller = new AbortController();
    const remove = jest.spyOn(controller.signal, "removeEventListener");
    const pending = client.vector.listCollections("store", { signal: controller.signal });
    const other = client.vector.listCollections("store");
    controller.abort();
    await expect(pending).rejects.toThrow(/abort/i);
    resolve(fetch);
    expect(await other).toEqual([]);
    expect(requests).toHaveLength(1);
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("rejects initialization failures instead of sending a request", async () => {
    const failure = new Error("failed to initialize");
    jest.spyOn(transport, "getClient").mockRejectedValueOnce(failure);
    await expect(client.vector.listCollections("store", { signal: new AbortController().signal })).rejects.toBe(
      failure,
    );
    expect(requests).toHaveLength(0);
  });

  it.each([
    ["invalid JSON", '{"collections":[', /JSON object/, (v: IClientVector) => v.listCollections("store")],
    ["non-object JSON", "[]", /JSON object/, (v: IClientVector) => v.listCollections("store")],
    [
      "missing acknowledgement",
      "{}",
      /acknowledgement/,
      (v: IClientVector) => v.upsertVectors("store", "collection", []),
    ],
    [
      "unknown acknowledgement",
      '{"ack":99}',
      /acknowledgement/,
      (v: IClientVector) => v.deleteVectors("store", "collection", []),
    ],
    [
      "missing metric",
      '{"matches":[]}',
      /distance metric/,
      (v: IClientVector) => v.queryVectors("store", "collection", { byId: "a" }),
    ],
    [
      "unsafe record count",
      '{"collection":"collection","recordCount":"9007199254740992","dimensions":3,"metric":1}',
      /safe integer/,
      (v: IClientVector) => v.getCollection("store", "collection"),
    ],
    [
      "invalid base64",
      '{"records":[{"id":"a","payload":"!invalid!"}]}',
      /base64/i,
      (v: IClientVector) => v.getVectors("store", "collection", ["a"]),
    ],
    [
      "invalid later record",
      '{"records":[{"id":"a"},{"id":""}]}',
      /must not be empty/,
      (v: IClientVector) => v.getVectors("store", "collection", ["a", "b"]),
    ],
    [
      "nonfinite values",
      '{"records":[{"id":"a","values":["NaN"]}]}',
      /finite/,
      (v: IClientVector) => v.getVectors("store", "collection", ["a"]),
    ],
    [
      "missing batch slot",
      '{"results":[]}',
      /results for 1 queries/,
      (v: IClientVector) => v.batchQueryVectors("store", "collection", [{ byId: "a" }]),
    ],
  ] as const)(
    "rejects %s over the wire without retry or partial success and recovers",
    async (_name, body, error, invoke) => {
      rawResponse = body;
      await expect(invoke(client.vector)).rejects.toThrow(error);
      expect(requests).toHaveLength(1);
      rawResponse = undefined;
      response = { collections: ["recovered"] };
      expect(await client.vector.listCollections("store")).toEqual(["recovered"]);
      expect(requests).toHaveLength(2);
    },
  );

  it("preserves custom and well-known Any JSON in item and ordered batch failures", async () => {
    const details = [
      { "@type": "example.net/provider.Detail", nested: { retry: false, attempts: [1, null, "x"] } },
      { "@type": "type.googleapis.com/google.protobuf.Duration", value: "0.250s" },
    ];
    const error = { code: 16, message: "denied", details };
    const mapped = { ...error, details: details.map(({ "@type": typeUrl, ...value }) => ({ typeUrl, value })) };
    response = { ack: "INDEX_ACK_QUEUED", failedItems: [{ id: "a", error }] };
    expect(await client.vector.upsertVectors("store", "collection", [{ id: "a", values: [1] }])).toEqual({
      ack: "queued",
      failedItems: [{ id: "a", error: mapped }],
    });
    response = { results: [{ error }, { response: { metric: 1 } }, { error: { code: 1 } }] };
    expect(
      await client.vector.batchQueryVectors("store", "collection", [{ byId: "x" }, { byId: "a" }, { byId: "y" }]),
    ).toEqual([
      { error: mapped },
      { response: { metric: "cosine", matches: [] } },
      { error: { code: 1, message: "", details: [] } },
    ]);
  });

  it("round-trips a binary corpus, including base64 padding boundaries and nonzero-offset views", async () => {
    for (const size of [0, 1, 2, 3, 4, 255, 65536]) {
      const backing = Buffer.from(Array.from({ length: size + 2 }, (_, i) => (i * 37) % 256));
      const payload = backing.subarray(1, size + 1);
      const base64 = Buffer.from(payload).toString("base64");
      response = { ack: "INDEX_ACK_COMPLETED" };
      await client.vector.upsertVectors("store", "collection", [{ id: String(size), values: [1], payload }]);
      expect(JSON.parse(requests[requests.length - 1].body).records[0].payload).toBe(base64);
      response = { records: [{ id: String(size), values: [1], payload: base64 }] };
      expect((await client.vector.getVectors("store", "collection", [String(size)]))[0].payload).toEqual(
        Uint8Array.from(payload),
      );
    }
  });

  it("does not retry a write after the server receives it but disconnects before acknowledging it", async () => {
    handler = (res) => res.destroy();
    await expect(client.vector.upsertVectors("store", "collection", [{ id: "a", values: [1] }])).rejects.toMatchObject({
      name: "FetchError",
      type: "system",
    });
    expect(requests).toHaveLength(1);
    handler = undefined;
    expect(await client.vector.listCollections("store")).toEqual([]);
  });

  it.each(["abort", "disconnect"] as const)(
    "rejects %s after response headers arrive but before the body completes",
    async (action) => {
      const reading = deferred<void>();
      const text = Response.prototype.text;
      jest.spyOn(Response.prototype, "text").mockImplementation(function (this: Response) {
        const pending = text.call(this);
        reading.resolve();
        return pending;
      });
      let active!: ServerResponse;
      handler = (res) => {
        active = res;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write('{"collections":[');
      };
      const controller = new AbortController();
      const pending = client.vector.listCollections("store", { signal: controller.signal });
      await reading.promise;
      const closed = once(active, "close");
      if (action === "abort") controller.abort();
      else active.destroy();
      await expect(pending).rejects.toMatchObject({ name: action === "abort" ? "AbortError" : "FetchError" });
      await closed;
      expect(requests).toHaveLength(1);
      handler = undefined;
      expect(await client.vector.listCollections("store")).toEqual([]);
    },
  );

  it("isolates concurrent query bodies, baggage, and out-of-order responses", async () => {
    const received = deferred<ServerResponse>();
    const result = (id: string) => JSON.stringify({ metric: 1, matches: [{ record: { id }, score: 1 }] });
    handler = (res) => {
      res.setHeader("Content-Type", "application/json");
      if (requests.length === 1) received.resolve(res);
      else res.end(result("second"));
    };
    const first = withBaggage({ tenant: "first" }, () =>
      client.vector.queryVectors("store", "collection", { byId: "first" }, { metadata: { tenant: "first" } }),
    );
    const held = await received.promise;
    const second = await withBaggage({ tenant: "second" }, () =>
      client.vector.queryVectors("store", "collection", { byId: "second" }, { metadata: { tenant: "second" } }),
    );
    expect(second.matches[0].record.id).toBe("second");
    held.end(result("first"));
    expect((await first).matches[0].record.id).toBe("first");
    expect(requests.map((r) => r.headers.baggage)).toEqual(["tenant=first", "tenant=second"]);
    expect(requests.map((r) => JSON.parse(r.body))).toEqual([
      { query: { byId: "first" }, metadata: { tenant: "first" } },
      { query: { byId: "second" }, metadata: { tenant: "second" } },
    ]);
    handler = undefined;
    expect(await client.vector.listCollections("store")).toEqual([]);
    expect(requests[2].headers.baggage).toBeUndefined();
  });

  it("can cancel a fixed-length body after the peer disconnects without completing it", async () => {
    const reading = deferred<void>();
    const text = Response.prototype.text;
    jest.spyOn(Response.prototype, "text").mockImplementation(function (this: Response) {
      const pending = text.call(this);
      reading.resolve();
      return pending;
    });
    let active!: ServerResponse;
    handler = (res) => {
      active = res;
      res.writeHead(200, { "Content-Type": "application/json", "Content-Length": "1000" });
      res.write('{"collections":[');
    };
    const controller = new AbortController();
    const pending = client.vector.listCollections("store", { signal: controller.signal });
    try {
      await reading.promise;
      const closed = once(active, "close");
      active.destroy();
      await closed;
      // node-fetch 2 does not reliably report truncated Content-Length bodies without a caller deadline.
      controller.abort();
      await expect(pending).rejects.toThrow();
      expect(requests).toHaveLength(1);
      handler = undefined;
      expect(await client.vector.listCollections("store")).toEqual([]);
    } finally {
      controller.abort();
    }
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

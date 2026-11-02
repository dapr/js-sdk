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

import { create, MessageInitShape } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import { DaprClient, CommunicationProtocolEnum, DaprPubSubStatusEnum } from "../../../../src";
import GRPCClient from "../../../../src/implementation/Client/GRPCClient/GRPCClient";
import GRPCClientPubSub from "../../../../src/implementation/Client/GRPCClient/pubsub";
import { HTTPNotSupportedError } from "../../../../src/errors/HTTPNotSupportedError";
import { DeferredAsyncIterable } from "../../../../src/utils/Streams.util";
import {
  SubscribeTopicEventsRequestAlpha1,
  SubscribeTopicEventsRequestAlpha1Schema,
  SubscribeTopicEventsResponseAlpha1,
  SubscribeTopicEventsResponseAlpha1Schema,
} from "../../../../src/proto/dapr/proto/runtime/v1/pubsub_pb";
import { TopicEventRequestSchema } from "../../../../src/proto/dapr/proto/runtime/v1/appcallback_pb";
import { IDaprSerializer } from "../../../../src/serialization/IDaprSerializer";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const confirmation = () =>
  create(SubscribeTopicEventsResponseAlpha1Schema, {
    subscribeTopicEventsResponseType: { case: "initialResponse", value: {} },
  });
const event = (id = "event-1", overrides: MessageInitShape<typeof TopicEventRequestSchema> = {}) =>
  create(SubscribeTopicEventsResponseAlpha1Schema, {
    subscribeTopicEventsResponseType: {
      case: "eventMessage",
      value: create(TopicEventRequestSchema, {
        id,
        data: Buffer.from('{"hello":"world"}'),
        dataContentType: "application/json",
        pubsubName: "pubsub",
        topic: "topic",
        ...overrides,
      }),
    },
  });

describe("streaming pub/sub", () => {
  const cleanups: Array<() => void> = [];

  async function harness(serializer?: IDaprSerializer) {
    const service = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), verbose: jest.fn(), debug: jest.fn() };
    const grpc = new GRPCClient({ logger: { service }, serializer });
    grpc.setIsInitialized(true);
    const raw = await grpc.getClient();
    const responses = new DeferredAsyncIterable<SubscribeTopicEventsResponseAlpha1 | Error>();
    const requests: SubscribeTopicEventsRequestAlpha1[] = [];
    let inputClosed = false;
    let signal: AbortSignal | undefined;
    const rpc = jest.spyOn(raw, "subscribeTopicEventsAlpha1").mockImplementation((input, options) => {
      signal = options?.signal;
      const end = () => responses.end();
      signal?.addEventListener("abort", end, { once: true });
      void (async () => {
        for await (const request of input) requests.push(create(SubscribeTopicEventsRequestAlpha1Schema, request));
        inputClosed = true;
      })();
      return (async function* () {
        try {
          for await (const response of responses) {
            if (signal?.aborted) throw new ConnectError("canceled", Code.Canceled);
            if (response instanceof Error) throw response;
            yield response;
          }
        } finally {
          signal?.removeEventListener("abort", end);
        }
      })();
    });
    const abort = new AbortController();
    cleanups.push(() => abort.abort());
    return {
      grpc,
      pubsub: new GRPCClientPubSub(grpc),
      responses,
      requests,
      rpc,
      service,
      abort,
      options: { signal: abort.signal },
      inputClosed: () => inputClosed,
      signal: () => signal,
      acknowledgements: () =>
        requests.flatMap((request) => {
          const message = request.subscribeTopicEventsRequestType;
          return message.case === "eventProcessed"
            ? [{ id: message.value.id, status: message.value.status?.status }]
            : [];
        }),
    };
  }

  afterEach(async () => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    await flush();
    jest.restoreAllMocks();
  });

  it("sends exactly one initial request and waits for confirmation before resolving", async () => {
    const h = await harness();
    const callback = jest.fn();
    let resolved = false;
    const pending = h.pubsub.subscribeStream("pubsub", "topic", callback, {
      ...h.options,
      metadata: { rawPayload: "true", consumerID: "worker" },
      deadLetterTopic: "dead",
    });
    void pending.then(() => (resolved = true));
    await flush();
    expect(resolved).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    expect(h.requests).toHaveLength(1);
    expect(h.requests[0].subscribeTopicEventsRequestType).toMatchObject({
      case: "initialRequest",
      value: {
        pubsubName: "pubsub",
        topic: "topic",
        metadata: { rawPayload: "true", consumerID: "worker" },
        deadLetterTopic: "dead",
      },
    });
    h.responses.push(confirmation());
    const subscription = await pending;
    expect(resolved).toBe(true);
    await subscription.close();
    await subscription.closed;
    expect(h.signal()?.aborted).toBe(true);
    expect(h.inputClosed()).toBe(true);
  });

  it("uses empty metadata and leaves the optional dead-letter topic absent", async () => {
    const h = await harness();
    h.responses.push(confirmation());
    const subscription = await h.pubsub.subscribeStream("pubsub", "topic", jest.fn());
    expect(h.requests[0].subscribeTopicEventsRequestType.value).toMatchObject({ metadata: {} });
    expect(h.requests[0].subscribeTopicEventsRequestType.value).not.toHaveProperty("deadLetterTopic");
    await subscription.close();
    await subscription.closed;
  });

  it.each([
    [undefined, 0],
    [DaprPubSubStatusEnum.SUCCESS, 0],
    [DaprPubSubStatusEnum.RETRY, 1],
    [DaprPubSubStatusEnum.DROP, 2],
  ])("maps callback result %s to wire status %s with the exact event ID", async (result, status) => {
    const h = await harness();
    h.responses.push(confirmation());
    const callback = jest.fn(async () => result);
    await h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
    h.responses.push(event("unique-event-id"));
    await flush();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(h.acknowledgements()).toEqual([{ id: "unique-event-id", status }]);
  });

  it("delivers decoded payloads and all CloudEvent attributes without exposing protobuf internals", async () => {
    const h = await harness();
    h.responses.push(confirmation());
    const callback = jest.fn();
    await h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
    h.responses.push(
      event("id", {
        source: "source",
        type: "type",
        specVersion: "1.0",
        path: "route",
        extensions: { traceparent: "trace", custom: { value: true }, id: "cannot-override" },
      }),
    );
    await flush();
    expect(callback).toHaveBeenCalledWith(
      { hello: "world" },
      {
        id: "id",
        source: "source",
        type: "type",
        specversion: "1.0",
        datacontenttype: "application/json",
        pubsubname: "pubsub",
        topic: "topic",
        path: "route",
        traceparent: "trace",
        custom: { value: true },
      },
    );
  });

  it.each([
    ["text/plain", "hello", "hello"],
    ["application/json", "false", false],
    ["application/json", "0", 0],
    ["application/json", "null", null],
    ["application/json", '["a",1]', ["a", 1]],
    ["application/octet-stream", "", ""],
  ])("uses existing deserialization for %s payload %s", async (dataContentType, data, expected) => {
    const h = await harness();
    h.responses.push(confirmation());
    const callback = jest.fn();
    await h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
    h.responses.push(event("id", { dataContentType, data: Buffer.from(data) }));
    await flush();
    expect(callback).toHaveBeenCalledWith(expected, expect.any(Object));
  });

  it.each(["throw", "reject", "invalid-status", "null-status"])(
    "logs and retries %s, then continues processing",
    async (kind) => {
      const h = await harness();
      h.responses.push(confirmation());
      const callback = jest
        .fn()
        .mockImplementationOnce(() => {
          if (kind === "throw") throw new Error("handler failed");
          if (kind === "reject") return Promise.reject(new Error("async handler failed"));
          return Promise.resolve(kind === "null-status" ? null : "invalid");
        })
        .mockResolvedValue(undefined);
      await h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
      h.responses.push(event("same-id"));
      h.responses.push(event("same-id"));
      await flush();
      expect(h.acknowledgements()).toEqual([
        { id: "same-id", status: 1 },
        { id: "same-id", status: 0 },
      ]);
      expect(h.service.error).toHaveBeenCalledTimes(1);
    },
  );

  it("retries serializer failures and uses the custom serializer for subsequent messages", async () => {
    const deserialize = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("bad encoding");
      })
      .mockReturnValue({ decoded: true });
    const h = await harness({ serialize: JSON.stringify, deserialize });
    h.responses.push(confirmation());
    const callback = jest.fn();
    await h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
    h.responses.push(event("bad"));
    h.responses.push(event("good"));
    await flush();
    expect(deserialize).toHaveBeenCalledWith('{"hello":"world"}');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ decoded: true }, expect.any(Object));
    expect(h.acknowledgements()).toEqual([
      { id: "bad", status: 1 },
      { id: "good", status: 0 },
    ]);
    expect(h.service.error).toHaveBeenCalledTimes(1);
  });

  it("serializes callback execution and acknowledges only after processing finishes", async () => {
    const h = await harness();
    h.responses.push(confirmation());
    let finish!: () => void;
    const blocked = new Promise<void>((resolve) => (finish = resolve));
    const callback = jest.fn().mockReturnValueOnce(blocked).mockResolvedValue(undefined);
    await h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
    h.responses.push(event("first"));
    h.responses.push(event("second"));
    await flush();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(h.acknowledgements()).toEqual([]);
    finish();
    await flush();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(h.acknowledgements()).toEqual([
      { id: "first", status: 0 },
      { id: "second", status: 0 },
    ]);
  });

  it("close is idempotent, can be awaited in a callback, and prevents further delivery and acknowledgements", async () => {
    const h = await harness();
    h.responses.push(confirmation());
    const callback = jest.fn(async () => {
      await subscription.close();
    });
    const subscription = await h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
    h.responses.push(event("first"));
    h.responses.push(event("second"));
    await subscription.closed;
    await Promise.all([subscription.close(), subscription.close()]);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(h.acknowledgements()).toEqual([]);
    expect(h.inputClosed()).toBe(true);
    expect(h.service.error).not.toHaveBeenCalled();
  });

  it("closed waits for an in-flight callback but close does not", async () => {
    const h = await harness();
    h.responses.push(confirmation());
    let finish!: () => void;
    const blocked = new Promise<void>((resolve) => (finish = resolve));
    const subscription = await h.pubsub.subscribeStream("pubsub", "topic", async () => blocked, h.options);
    let closed = false;
    void subscription.closed.then(() => (closed = true));
    h.responses.push(event());
    await flush();
    await subscription.close();
    expect(closed).toBe(false);
    finish();
    await subscription.closed;
    expect(closed).toBe(true);
    expect(h.acknowledgements()).toEqual([]);
  });

  it("supports cancellation after confirmation and removes the signal listener", async () => {
    const h = await harness();
    const remove = jest.spyOn(h.abort.signal, "removeEventListener");
    h.responses.push(confirmation());
    const subscription = await h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options);
    h.abort.abort();
    await expect(subscription.closed).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(h.inputClosed()).toBe(true);
  });

  it("rejects cancellation before confirmation and terminates both stream directions", async () => {
    const h = await harness();
    const pending = h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options);
    const rejection = expect(pending).rejects.toMatchObject({ code: Code.Canceled });
    await flush();
    h.abort.abort();
    await rejection;
    expect(h.signal()?.aborted).toBe(true);
    expect(h.inputClosed()).toBe(true);
  });

  it("does not initialize or open a stream for an already-aborted signal", async () => {
    const h = await harness();
    const getClient = jest.spyOn(h.grpc, "getClient");
    const reason = new Error("already aborted");
    h.abort.abort(reason);
    await expect(h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options)).rejects.toBe(reason);
    expect(getClient).not.toHaveBeenCalled();
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "surfaces transport failure (confirmed=%s) and cleans up without reconnecting",
    async (ready) => {
      const h = await harness();
      const error = new ConnectError("sidecar disconnected", Code.Unavailable);
      if (ready) h.responses.push(confirmation());
      const pending = h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options);
      const observed = ready ? (await pending).closed : pending;
      const rejection = expect(observed).rejects.toBe(error);
      h.responses.push(error);
      await rejection;
      await flush();
      expect(h.signal()?.aborted).toBe(true);
      expect(h.inputClosed()).toBe(true);
      expect(h.rpc).toHaveBeenCalledTimes(1);
      expect(h.service.error).toHaveBeenCalledTimes(1);
    },
  );

  it.each([false, true])("rejects an unexpected EOF (confirmed=%s)", async (ready) => {
    const h = await harness();
    if (ready) h.responses.push(confirmation());
    const pending = h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options);
    const observed = ready ? (await pending).closed : pending;
    const rejection = expect(observed).rejects.toThrow("ended unexpectedly");
    h.responses.end();
    await rejection;
    expect(h.signal()?.aborted).toBe(true);
  });

  it.each(["early-event", "empty-initial", "duplicate-initial", "empty-event"])(
    "rejects malformed stream ordering: %s",
    async (kind) => {
      const h = await harness();
      const ready = kind === "duplicate-initial" || kind === "empty-event";
      if (ready) h.responses.push(confirmation());
      const callback = jest.fn();
      const pending = h.pubsub.subscribeStream("pubsub", "topic", callback, h.options);
      const observed = ready ? (await pending).closed : pending;
      const rejection = expect(observed).rejects.toThrow("Expected");
      h.responses.push(
        kind === "early-event"
          ? event()
          : kind === "duplicate-initial"
          ? confirmation()
          : create(SubscribeTopicEventsResponseAlpha1Schema),
      );
      await rejection;
      expect(callback).not.toHaveBeenCalled();
      expect(h.acknowledgements()).toEqual([]);
    },
  );

  it.each([
    ["", "topic"],
    ["pubsub", " "],
  ])("rejects empty names (%s, %s) before contacting Dapr", async (pubsub, topic) => {
    const h = await harness();
    await expect(h.pubsub.subscribeStream(pubsub, topic, jest.fn())).rejects.toThrow(TypeError);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("propagates initialization failures", async () => {
    const h = await harness();
    const error = new Error("sidecar unavailable");
    jest.spyOn(h.grpc, "getClient").mockRejectedValue(error);
    await expect(h.pubsub.subscribeStream("pubsub", "topic", jest.fn())).rejects.toBe(error);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("does not open a stream when canceled during client initialization", async () => {
    const h = await harness();
    const raw = await h.grpc.getClient();
    jest.spyOn(h.grpc, "getClient").mockImplementation(async () => {
      h.abort.abort(new Error("canceled during initialization"));
      return raw;
    });
    await expect(h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options)).rejects.toThrow(
      "canceled during initialization",
    );
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("requires a callback even for JavaScript callers", async () => {
    const h = await harness();
    // @ts-expect-error Exercise runtime validation for untyped callers.
    await expect(h.pubsub.subscribeStream("pubsub", "topic")).rejects.toThrow("require a callback");
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("cleans up and logs synchronous RPC setup failures", async () => {
    const h = await harness();
    const error = new Error("RPC setup failed");
    h.rpc.mockImplementation(() => {
      throw error;
    });
    const remove = jest.spyOn(h.abort.signal, "removeEventListener");
    await expect(h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options)).rejects.toBe(error);
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(h.service.error).toHaveBeenCalledTimes(1);
  });

  it("logs post-handshake errors even if closed is not observed immediately", async () => {
    const h = await harness();
    h.responses.push(confirmation());
    const subscription = await h.pubsub.subscribeStream("pubsub", "topic", jest.fn(), h.options);
    const error = new ConnectError("connection lost", Code.Unavailable);
    h.responses.push(error);
    await flush();
    expect(h.service.error).toHaveBeenCalledTimes(1);
    await subscription.close();
    await expect(subscription.closed).rejects.toBe(error);
  });

  it("rejects HTTP through the public client without making a network call", async () => {
    const client = new DaprClient({ communicationProtocol: CommunicationProtocolEnum.HTTP });
    await expect(client.pubsub.subscribeStream("pubsub", "topic", jest.fn())).rejects.toThrow(
      new HTTPNotSupportedError("Streaming pub/sub subscriptions require the gRPC protocol."),
    );
  });
});

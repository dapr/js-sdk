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

import { create } from "@bufbuild/protobuf";
import { createClient, createRouterTransport, type Client } from "@connectrpc/connect";
import { once } from "events";
import express from "express";
import { createServer } from "http2";
import fetch from "node-fetch";
import DaprPubSubStatusEnum from "../../../../src/enum/DaprPubSubStatus.enum";
import GRPCServerImpl from "../../../../src/implementation/Server/GRPCServer/GRPCServerImpl";
import HTTPServerImpl from "../../../../src/implementation/Server/HTTPServer/HTTPServerImpl";
import {
  AppCallback,
  TopicEventBulkRequestEntrySchema,
  TopicEventResponse_TopicEventResponseStatus,
} from "../../../../src/proto/dapr/proto/runtime/v1/appcallback_pb";
import { PubSubSubscriptionTopicRouteType } from "../../../../src/types/pubsub/PubSubSubscriptionTopicRoute.type";

describe.each(["HTTP", "gRPC"])("%s pub/sub callback statuses", (protocol) => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
  };
  const data = { orderId: "order-1" };
  const headers = { "x-request-id": "request-1" };
  let app: express.Express;
  let server: HTTPServerImpl | GRPCServerImpl;
  let grpcClient: Client<typeof AppCallback>;
  let route: PubSubSubscriptionTopicRouteType;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json({ type: ["application/json", "application/cloudevents+json"] }));
    server =
      protocol === "HTTP"
        ? new HTTPServerImpl(app, { service: logger })
        : new GRPCServerImpl(createServer(), { service: logger });
    if (server instanceof GRPCServerImpl) {
      const grpcServer = server;
      grpcClient = createClient(
        AppCallback,
        createRouterTransport((router) =>
          router.service(AppCallback, {
            onTopicEvent: (request, context) => grpcServer.onTopicEvent(request, context),
            onBulkTopicEvent: (request, context) => grpcServer.onBulkTopicEventAlpha1(request, context),
          }),
        ),
      );
    }
    route = { path: "orders", eventHandlers: [] };
  });

  async function postSubscription(path: string, body: unknown, contentType = "application/cloudevents+json") {
    const listener = app.listen(0, "127.0.0.1");
    try {
      await once(listener, "listening");
      const address = listener.address();
      if (address === null || typeof address === "string") {
        throw new Error("Pub/sub test server did not bind to a TCP port");
      }
      const response = await fetch(`http://127.0.0.1:${address.port}/${path}`, {
        method: "POST",
        headers: { ...headers, "content-type": contentType },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    } finally {
      await new Promise<void>((resolve, reject) => listener.close((error) => (error ? reject(error) : resolve())));
    }
  }

  it.each(["throw", "reject"])("returns RETRY when a callback fails with %s", async (failure) => {
    const error = new Error("handler failed");
    const callback = jest.fn(() => {
      if (failure === "throw") {
        throw error;
      }
      return Promise.reject(error);
    });
    route.eventHandlers = [callback];

    await expect(server.processPubSubCallbacks(route, data, headers)).resolves.toBe(DaprPubSubStatusEnum.RETRY);
    expect(callback).toHaveBeenCalledWith(data, headers);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("handler failed"));
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(route.path));
  });

  it.each([undefined, null, "handler failed"])("retries non-Error rejection reasons (%p)", async (reason) => {
    route.eventHandlers = [jest.fn().mockRejectedValue(reason)];

    await expect(server.processPubSubCallbacks(route, data, headers)).resolves.toBe(DaprPubSubStatusEnum.RETRY);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(String(reason)));
  });

  it("waits for an asynchronous failure before running the remaining callbacks", async () => {
    const failing = jest.fn(async () => {
      await Promise.resolve();
      throw new Error("asynchronous handler failure");
    });
    const after = jest.fn(async () => DaprPubSubStatusEnum.SUCCESS);
    route.eventHandlers = [failing, after];

    const result = server.processPubSubCallbacks(route, data, headers);
    expect(failing).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();

    await expect(result).resolves.toBe(DaprPubSubStatusEnum.RETRY);
    expect(after).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledWith(data, headers);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("does not carry a failed delivery's RETRY status into a successful redelivery", async () => {
    const callback = jest.fn().mockRejectedValueOnce(new Error("temporary failure")).mockResolvedValueOnce(undefined);
    route.eventHandlers = [callback];

    await expect(server.processPubSubCallbacks(route, data, headers)).resolves.toBe(DaprPubSubStatusEnum.RETRY);
    await expect(server.processPubSubCallbacks(route, data, headers)).resolves.toBe(DaprPubSubStatusEnum.SUCCESS);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it.each([
    { results: [], expected: DaprPubSubStatusEnum.SUCCESS },
    { results: [undefined], expected: DaprPubSubStatusEnum.SUCCESS },
    { results: [null], expected: DaprPubSubStatusEnum.SUCCESS },
    { results: [DaprPubSubStatusEnum.SUCCESS], expected: DaprPubSubStatusEnum.SUCCESS },
    { results: [DaprPubSubStatusEnum.RETRY], expected: DaprPubSubStatusEnum.RETRY },
    { results: [DaprPubSubStatusEnum.DROP], expected: DaprPubSubStatusEnum.DROP },
    {
      results: [DaprPubSubStatusEnum.SUCCESS, DaprPubSubStatusEnum.DROP],
      expected: DaprPubSubStatusEnum.DROP,
    },
    {
      results: [DaprPubSubStatusEnum.DROP, DaprPubSubStatusEnum.SUCCESS],
      expected: DaprPubSubStatusEnum.DROP,
    },
    {
      results: [DaprPubSubStatusEnum.SUCCESS, DaprPubSubStatusEnum.DROP, DaprPubSubStatusEnum.RETRY],
      expected: DaprPubSubStatusEnum.RETRY,
    },
    {
      results: [DaprPubSubStatusEnum.RETRY, DaprPubSubStatusEnum.DROP, DaprPubSubStatusEnum.SUCCESS],
      expected: DaprPubSubStatusEnum.RETRY,
    },
  ])("preserves $expected for callback results $results", async ({ results, expected }) => {
    route.eventHandlers = results.map((result) => async () => result);

    await expect(server.processPubSubCallbacks(route, data, headers)).resolves.toBe(expected);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([DaprPubSubStatusEnum.SUCCESS, DaprPubSubStatusEnum.DROP])(
    "keeps RETRY and runs all callbacks when other handlers return %s",
    async (status) => {
      const before = jest.fn(async () => status);
      const failing = jest.fn(async () => {
        throw new Error("handler failed");
      });
      const after = jest.fn(async () => status);
      route.eventHandlers = [before, failing, after];

      await expect(server.processPubSubCallbacks(route, data, headers)).resolves.toBe(DaprPubSubStatusEnum.RETRY);
      for (const callback of route.eventHandlers) {
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(data, headers);
      }
    },
  );

  it.each([
    { completion: "throw", expected: DaprPubSubStatusEnum.RETRY },
    { completion: "reject", expected: DaprPubSubStatusEnum.RETRY },
    { completion: "void", expected: DaprPubSubStatusEnum.SUCCESS },
    { completion: "success", expected: DaprPubSubStatusEnum.SUCCESS },
    { completion: "retry", expected: DaprPubSubStatusEnum.RETRY },
    { completion: "drop", expected: DaprPubSubStatusEnum.DROP },
  ])("reports $expected for $completion through the single-message endpoint", async ({ completion, expected }) => {
    const callback = jest.fn(() => {
      if (completion === "throw") {
        throw new Error("handler failed");
      }
      if (completion === "reject") {
        return Promise.reject(new Error("handler failed"));
      }
      return Promise.resolve(completion === "void" ? undefined : expected);
    });
    server.registerPubsubSubscription("pubsub", "topic", { route: route.path });
    server.registerPubSubSubscriptionEventHandler("pubsub", "topic", route.path, callback);
    const path = server.getSubscriptions().pubsub.topic.routes[route.path].path;

    if (server instanceof HTTPServerImpl) {
      expect(await postSubscription(path, { data })).toEqual({ status: 200, body: { status: expected } });
    } else {
      const response = await grpcClient.onTopicEvent(
        {
          pubsubName: "pubsub",
          topic: "topic",
          path,
          dataContentType: "application/json",
          data: Buffer.from(JSON.stringify(data)),
        },
        { headers },
      );
      expect(response.status).toBe(TopicEventResponse_TopicEventResponseStatus[expected]);
    }

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(data, expect.objectContaining(headers));
    expect(logger.error).toHaveBeenCalledTimes(completion === "throw" || completion === "reject" ? 1 : 0);
  });

  it.each(["CloudEvents", "raw JSON", "raw text"])(
    "retries only failed bulk entries and runs all callbacks for %s",
    async (format) => {
      const entryIds = ["before", "thrown", "rejected", "retry", "drop", "after"];
      const expectedStatuses = [
        DaprPubSubStatusEnum.SUCCESS,
        DaprPubSubStatusEnum.RETRY,
        DaprPubSubStatusEnum.RETRY,
        DaprPubSubStatusEnum.RETRY,
        DaprPubSubStatusEnum.DROP,
        DaprPubSubStatusEnum.SUCCESS,
      ];
      const callback = jest.fn((entryId: string) => {
        if (entryId === "thrown") {
          throw new Error("handler threw");
        }
        if (entryId === "rejected") {
          return Promise.reject(new Error("handler rejected"));
        }
        return Promise.resolve(
          entryId === "retry" ? DaprPubSubStatusEnum.RETRY : entryId === "drop" ? DaprPubSubStatusEnum.DROP : undefined,
        );
      });
      const after = jest.fn(async () => DaprPubSubStatusEnum.SUCCESS);
      server.registerPubsubSubscription("pubsub", "topic", {
        route: route.path,
        bulkSubscribe: { enabled: true },
      });
      server.registerPubSubSubscriptionEventHandler("pubsub", "topic", route.path, callback);
      server.registerPubSubSubscriptionEventHandler("pubsub", "topic", route.path, after);
      const path = server.getSubscriptions().pubsub.topic.routes[route.path].path;

      if (server instanceof HTTPServerImpl) {
        const result = await postSubscription(
          path,
          {
            entries: entryIds.map((entryId) => ({
              entryId,
              contentType: format === "CloudEvents" ? "application/cloudevents+json" : "application/octet-stream",
              event:
                format === "CloudEvents"
                  ? { data: entryId }
                  : Buffer.from(format === "raw JSON" ? JSON.stringify(entryId) : entryId).toString("base64"),
              metadata: { ...headers, "x-entry-id": entryId },
            })),
          },
          "application/json",
        );
        expect(result).toEqual({
          status: 200,
          body: { statuses: entryIds.map((entryId, index) => ({ entryId, status: expectedStatuses[index] })) },
        });
      } else {
        const result = await grpcClient.onBulkTopicEvent(
          {
            pubsubName: "pubsub",
            topic: "topic",
            path,
            entries: entryIds.map((entryId) =>
              create(TopicEventBulkRequestEntrySchema, {
                entryId,
                contentType: format === "CloudEvents" ? "application/cloudevents+json" : "application/octet-stream",
                event:
                  format === "CloudEvents"
                    ? {
                        case: "cloudEvent",
                        value: {
                          id: entryId,
                          source: "pubsub-test",
                          type: "order",
                          specVersion: "1.0",
                          dataContentType: "application/json",
                          data: Buffer.from(JSON.stringify(entryId)),
                        },
                      }
                    : {
                        case: "bytes",
                        value: Buffer.from(format === "raw JSON" ? JSON.stringify(entryId) : entryId),
                      },
              }),
            ),
          },
          { headers },
        );
        expect(result.statuses.map(({ entryId, status }) => ({ entryId, status }))).toEqual(
          entryIds.map((entryId, index) => ({
            entryId,
            status: TopicEventResponse_TopicEventResponseStatus[expectedStatuses[index]],
          })),
        );
      }

      for (const handler of [callback, after]) {
        expect(handler).toHaveBeenCalledTimes(entryIds.length);
        entryIds.forEach((entryId, index) => {
          const expectedHeaders = server instanceof HTTPServerImpl ? { ...headers, "x-entry-id": entryId } : headers;
          expect(handler).toHaveBeenNthCalledWith(index + 1, entryId, expect.objectContaining(expectedHeaders));
        });
      }
      expect(logger.error).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenNthCalledWith(1, expect.stringContaining("handler threw"));
      expect(logger.error).toHaveBeenNthCalledWith(2, expect.stringContaining("handler rejected"));
    },
  );

  it("acknowledges an empty bulk batch without invoking callbacks", async () => {
    const callback = jest.fn(async () => DaprPubSubStatusEnum.SUCCESS);
    server.registerPubsubSubscription("pubsub", "topic", {
      route: route.path,
      bulkSubscribe: { enabled: true },
    });
    server.registerPubSubSubscriptionEventHandler("pubsub", "topic", route.path, callback);
    const path = server.getSubscriptions().pubsub.topic.routes[route.path].path;

    if (server instanceof HTTPServerImpl) {
      expect(await postSubscription(path, { entries: [] }, "application/json")).toEqual({
        status: 200,
        body: { statuses: [] },
      });
    } else {
      const result = await grpcClient.onBulkTopicEvent({ pubsubName: "pubsub", topic: "topic", path, entries: [] });
      expect(result.statuses).toEqual([]);
    }

    expect(callback).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

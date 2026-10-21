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

import { createClient, createRouterTransport } from "@connectrpc/connect";
import { once } from "events";
import express from "express";
import { createServer } from "http2";
import fetch from "node-fetch";
import DaprPubSubStatusEnum from "../../../../src/enum/DaprPubSubStatus.enum";
import GRPCServerImpl from "../../../../src/implementation/Server/GRPCServer/GRPCServerImpl";
import HTTPServerImpl from "../../../../src/implementation/Server/HTTPServer/HTTPServerImpl";
import {
  AppCallback,
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
  let route: PubSubSubscriptionTopicRouteType;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json({ type: ["application/json", "application/cloudevents+json"] }));
    server =
      protocol === "HTTP"
        ? new HTTPServerImpl(app, { service: logger })
        : new GRPCServerImpl(createServer(), { service: logger });
    route = { path: "orders", eventHandlers: [] };
  });

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
    { completion: "drop", expected: DaprPubSubStatusEnum.DROP },
  ])("reports $expected for $completion through the single-message endpoint", async ({ completion, expected }) => {
    const callback = jest.fn(() => {
      if (completion === "throw") {
        throw new Error("handler failed");
      }
      if (completion === "reject") {
        return Promise.reject(new Error("handler failed"));
      }
      return Promise.resolve(completion === "drop" ? DaprPubSubStatusEnum.DROP : undefined);
    });
    server.registerPubsubSubscription("pubsub", "topic", { route: route.path });
    server.registerPubSubSubscriptionEventHandler("pubsub", "topic", route.path, callback);
    const path = server.getSubscriptions().pubsub.topic.routes[route.path].path;

    if (server instanceof HTTPServerImpl) {
      const listener = app.listen(0, "127.0.0.1");
      try {
        await once(listener, "listening");
        const address = listener.address();
        if (address === null || typeof address === "string") {
          throw new Error("Pub/sub test server did not bind to a TCP port");
        }
        const response = await fetch(`http://127.0.0.1:${address.port}/${path}`, {
          method: "POST",
          headers: { ...headers, "content-type": "application/cloudevents+json" },
          body: JSON.stringify({ data }),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: expected });
      } finally {
        await new Promise<void>((resolve, reject) => listener.close((error) => (error ? reject(error) : resolve())));
      }
    } else {
      const grpcServer = server;
      const client = createClient(
        AppCallback,
        createRouterTransport((router) =>
          router.service(AppCallback, {
            onTopicEvent: (request, context) => grpcServer.onTopicEvent(request, context),
          }),
        ),
      );
      const response = await client.onTopicEvent(
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
    expect(logger.error).toHaveBeenCalledTimes(expected === DaprPubSubStatusEnum.RETRY ? 1 : 0);
  });

  it("retries only failed bulk entries and continues processing the batch", async () => {
    const entryIds = ["before", "failed", "drop", "after"];
    const expectedStatuses = [
      DaprPubSubStatusEnum.SUCCESS,
      DaprPubSubStatusEnum.RETRY,
      DaprPubSubStatusEnum.DROP,
      DaprPubSubStatusEnum.SUCCESS,
    ];
    const callback = jest.fn(async (entryId: string) => {
      if (entryId === "failed") {
        throw new Error("handler failed");
      }
      return entryId === "drop" ? DaprPubSubStatusEnum.DROP : DaprPubSubStatusEnum.SUCCESS;
    });
    route.eventHandlers = [callback];

    if (server instanceof HTTPServerImpl) {
      const result = await server.processBulkSubscribeMessage(route, {
        body: {
          entries: entryIds.map((entryId) => ({
            entryId,
            contentType: "application/cloudevents+json",
            event: { data: entryId },
            metadata: {},
          })),
        },
      });
      expect(result).toEqual({
        statuses: entryIds.map((entryId, index) => ({ entryId, status: expectedStatuses[index] })),
      });
    } else {
      server.registerPubsubSubscription("pubsub", "topic", { route: route.path });
      server.registerPubSubSubscriptionEventHandler("pubsub", "topic", route.path, callback);
      const grpcServer = server;
      const client = createClient(
        AppCallback,
        createRouterTransport((router) =>
          router.service(AppCallback, {
            onBulkTopicEvent: (request, context) => grpcServer.onBulkTopicEventAlpha1(request, context),
          }),
        ),
      );
      const result = await client.onBulkTopicEvent({
        pubsubName: "pubsub",
        topic: "topic",
        path: route.path,
        entries: entryIds.map((entryId) => ({
          entryId,
          contentType: "application/json",
          event: { case: "bytes", value: Buffer.from(JSON.stringify(entryId)) },
        })),
      });
      expect(result.statuses.map(({ entryId, status }) => ({ entryId, status }))).toEqual(
        entryIds.map((entryId, index) => ({
          entryId,
          status: TopicEventResponse_TopicEventResponseStatus[expectedStatuses[index]],
        })),
      );
    }

    expect(callback.mock.calls.map(([entryId]) => entryId)).toEqual(entryIds);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

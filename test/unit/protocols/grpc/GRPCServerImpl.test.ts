/*
Copyright 2023 The Dapr Authors
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
import { createServer } from "http2";
import GRPCServerImpl from "../../../../src/implementation/Server/GRPCServer/GRPCServerImpl";
import {
  AppCallback,
  ListTopicSubscriptionsResponseSchema,
} from "../../../../src/proto/dapr/proto/runtime/v1/appcallback_pb";

describe("GRPCServerImpl", () => {
  const mockLogWarn = jest.fn();

  const customLoggerService = {
    service: {
      error: () => jest.fn(),
      warn: mockLogWarn,
      info: () => jest.fn(),
      verbose: () => jest.fn(),
      debug: () => jest.fn(),
    },
  };

  // Minimal mock HandlerContext
  const mockContext = {
    requestHeader: { forEach: (_cb: (value: string, key: string) => void) => {} },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("onTopicEvent", () => {
    it("should correctly check if a pubsub was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      await g.onTopicEvent(
        {
          pubsubName: "pubsub",
        } as any,
        mockContext,
      );

      expect(mockLogWarn).toHaveBeenCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain("PubSub 'pubsub' has not been registered, ignoring event.");
    });

    it("should correctly check if a topic was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      // Mock the entire class SubscriptionManager with a custom implementation
      // @ts-ignore
      g.subscriptionManager = {
        isPubSubRegistered: () => true,
        lookupTopicWildcard: () => ["", ""],
      };

      await g.onTopicEvent(
        {
          pubsubName: "pubsub",
          topic: "",
          path: "path",
        } as any,
        mockContext,
      );

      expect(mockLogWarn).toHaveBeenCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain(
        "Topic '' has not been subscribed to pubsub 'pubsub', ignoring event.",
      );
    });
  });

  describe("onBulkTopicEventAlpha1", () => {
    it("should correctly check if a pubsub was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      await g.onBulkTopicEventAlpha1(
        {
          pubsubName: "pubsub",
        } as any,
        mockContext,
      );

      expect(mockLogWarn).toHaveBeenCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain("PubSub 'pubsub' has not been registered, ignoring bulk event.");
    });

    it("should correctly check if a pubsub was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      // Mock the entire class SubscriptionManager with a custom implementation
      // @ts-ignore
      g.subscriptionManager = {
        isPubSubRegistered: () => true,
        lookupTopicWildcard: () => ["", ""],
      };

      await g.onBulkTopicEventAlpha1(
        {
          pubsubName: "pubsub",
          topic: "",
          path: "path",
        } as any,
        mockContext,
      );

      expect(mockLogWarn).toHaveBeenCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain(
        "Topic '' has not been subscribed to pubsub 'pubsub', ignoring bulk event.",
      );
    });
  });

  describe("listTopicSubscriptions", () => {
    let server: GRPCServerImpl;
    let client: Client<typeof AppCallback>;

    beforeEach(() => {
      server = new GRPCServerImpl(createServer(), customLoggerService);
      client = createClient(
        AppCallback,
        createRouterTransport((router) =>
          router.service(AppCallback, {
            listTopicSubscriptions: (request, context) => server.listTopicSubscriptions(request, context),
          }),
        ),
      );
    });

    it("returns an empty list when no subscriptions are registered", async () => {
      await expect(client.listTopicSubscriptions({})).resolves.toEqual(create(ListTopicSubscriptionsResponseSchema));
    });

    it("includes every topic and defaults omitted bulk limits to zero", async () => {
      server.registerPubsubSubscription("pubsub", "orders", {
        route: "orders",
        bulkSubscribe: { enabled: true },
      });
      server.registerPubsubSubscription("pubsub", "payments", { route: "payments" });
      server.registerPubsubSubscription("audit", "events", { route: "events" });

      await expect(client.listTopicSubscriptions({})).resolves.toEqual(
        create(ListTopicSubscriptionsResponseSchema, {
          subscriptions: [
            {
              pubsubName: "pubsub",
              topic: "orders",
              routes: { default: "/pubsub--orders--orders" },
              bulkSubscribe: { enabled: true, maxMessagesCount: 0, maxAwaitDurationMs: 0 },
            },
            {
              pubsubName: "pubsub",
              topic: "payments",
              routes: { default: "/pubsub--payments--payments" },
            },
            {
              pubsubName: "audit",
              topic: "events",
              routes: { default: "/audit--events--events" },
            },
          ],
        }),
      );
    });

    it("preserves routing rules, metadata, dead-letter topics, and bulk settings", async () => {
      server.registerPubsubSubscription("pubsub", "orders", {
        route: {
          default: "orders",
          rules: [{ match: 'event.type == "priority"', path: "priority" }],
        },
        metadata: { rawPayload: "true" },
        deadLetterTopic: "orders-dead-letter",
        bulkSubscribe: { enabled: true, maxMessagesCount: 10, maxAwaitDurationMs: 200 },
      });

      await expect(client.listTopicSubscriptions({})).resolves.toEqual(
        create(ListTopicSubscriptionsResponseSchema, {
          subscriptions: [
            {
              pubsubName: "pubsub",
              topic: "orders",
              routes: {
                default: "/pubsub--orders--orders",
                rules: [{ match: 'event.type == "priority"', path: "/pubsub--orders--priority" }],
              },
              metadata: { rawPayload: '"true"' },
              deadLetterTopic: "orders-dead-letter",
              bulkSubscribe: { enabled: true, maxMessagesCount: 10, maxAwaitDurationMs: 200 },
            },
          ],
        }),
      );
    });
  });
});

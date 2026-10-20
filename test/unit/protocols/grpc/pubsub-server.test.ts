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

import { CommunicationProtocolEnum, DaprClient } from "../../../../src";
import GRPCServer from "../../../../src/implementation/Server/GRPCServer/GRPCServer";
import GRPCServerPubSub from "../../../../src/implementation/Server/GRPCServer/pubsub";
import { BulkSubscribeOptions } from "../../../../src/types/pubsub/BulkSubscribeOptions.type";
import { DaprPubSubRouteType } from "../../../../src/types/pubsub/DaprPubSubRouteType.type";
import { PubSubSubscriptionOptionsType } from "../../../../src/types/pubsub/PubSubSubscriptionOptions.type";
import { PubSubSubscriptionsType } from "../../../../src/types/pubsub/PubSubSubscriptions.type";

describe("grpc/pubsub server", () => {
  const createPubSub = () => {
    const server = new GRPCServer(new DaprClient({ communicationProtocol: CommunicationProtocolEnum.GRPC }), {
      serverHost: "127.0.0.1",
      serverPort: "0",
      communicationProtocol: CommunicationProtocolEnum.GRPC,
    });
    const impl = server.getServerImpl();
    const register = jest.spyOn(impl, "registerPubsubSubscription").mockImplementation(() => undefined);
    const registerHandler = jest
      .spyOn(impl, "registerPubSubSubscriptionEventHandler")
      .mockImplementation(() => undefined);
    const callback = jest.fn(async () => undefined);
    return { pubsub: new GRPCServerPubSub(server), impl, register, registerHandler, callback };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("subscribe", () => {
    it("registers the subscription and callback with the default route", async () => {
      const { pubsub, register, registerHandler, callback } = createPubSub();

      await expect(pubsub.subscribe("pubsub", "topic", callback)).resolves.toBeUndefined();

      expect(register.mock.calls).toEqual([["pubsub", "topic", { route: "", metadata: undefined }]]);
      expect(registerHandler.mock.calls).toEqual([["pubsub", "topic", "", callback]]);
    });

    it("forwards a string route and metadata without invoking the callback", async () => {
      const { pubsub, register, registerHandler, callback } = createPubSub();
      const metadata = { rawPayload: "true" };

      await pubsub.subscribe("pubsub", "topic", callback, "/orders", metadata);

      expect(register.mock.calls).toEqual([["pubsub", "topic", { route: "/orders", metadata }]]);
      expect(registerHandler.mock.calls).toEqual([["pubsub", "topic", "/orders", callback]]);
      expect(callback).not.toHaveBeenCalled();
    });

    it.each<{ route: DaprPubSubRouteType; paths: string[] }>([
      {
        route: {
          default: "/default",
          rules: [
            { match: 'event.type == "created"', path: "/created" },
            { match: 'event.type == "deleted"', path: "/deleted" },
          ],
        },
        paths: ["/default", "/created", "/deleted"],
      },
      { route: { default: "/default" }, paths: ["/default"] },
      { route: { rules: [{ match: "true", path: "/all" }] }, paths: ["/all"] },
      { route: {}, paths: [] },
      { route: { default: "", rules: [] }, paths: [] },
    ])("registers exactly the configured handlers for $route", async ({ route, paths }) => {
      const { pubsub, register, registerHandler, callback } = createPubSub();

      await pubsub.subscribe("pubsub", "topic", callback, route);

      expect(register.mock.calls).toEqual([["pubsub", "topic", { route, metadata: undefined }]]);
      expect(registerHandler.mock.calls).toEqual(paths.map((path) => ["pubsub", "topic", path, callback]));
    });

    it("propagates registration errors without registering a callback", async () => {
      const { pubsub, register, registerHandler, callback } = createPubSub();
      const error = new Error("subscription registration failed");
      register.mockImplementation(() => {
        throw error;
      });

      await expect(pubsub.subscribe("pubsub", "topic", callback)).rejects.toBe(error);

      expect(registerHandler).not.toHaveBeenCalled();
    });
  });

  describe("subscribeWithOptions", () => {
    it("defaults to empty options and does not register a callback", async () => {
      const { pubsub, register, registerHandler } = createPubSub();

      await expect(pubsub.subscribeWithOptions("pubsub", "topic")).resolves.toBeUndefined();

      expect(register.mock.calls).toEqual([["pubsub", "topic", {}]]);
      expect(registerHandler).not.toHaveBeenCalled();
    });

    it("forwards all options and registers the callback on each route", async () => {
      const { pubsub, register, registerHandler, callback } = createPubSub();
      const options: PubSubSubscriptionOptionsType = {
        callback,
        route: { default: "/default", rules: [{ match: "true", path: "/orders" }] },
        metadata: { rawPayload: "true" },
        deadLetterTopic: "dead-letters",
        deadLetterCallback: jest.fn(),
        bulkSubscribe: { enabled: true, maxMessagesCount: 10, maxAwaitDurationMs: 100 },
      };

      await pubsub.subscribeWithOptions("pubsub", "topic", options);

      expect(register).toHaveBeenCalledTimes(1);
      expect(register).toHaveBeenCalledWith("pubsub", "topic", options);
      expect(register.mock.calls[0][2]).toBe(options);
      expect(registerHandler.mock.calls).toEqual([
        ["pubsub", "topic", "/default", callback],
        ["pubsub", "topic", "/orders", callback],
      ]);
    });

    it("registers a callback even when no route is supplied", async () => {
      const { pubsub, registerHandler, callback } = createPubSub();

      await pubsub.subscribeWithOptions("pubsub", "topic", { callback });

      expect(registerHandler.mock.calls).toEqual([["pubsub", "topic", undefined, callback]]);
    });

    it("does not register event handlers when options contain no callback", async () => {
      const { pubsub, register, registerHandler } = createPubSub();
      const options = { route: "/orders", metadata: { rawPayload: "true" } };

      await pubsub.subscribeWithOptions("pubsub", "topic", options);

      expect(register.mock.calls).toEqual([["pubsub", "topic", options]]);
      expect(registerHandler).not.toHaveBeenCalled();
    });
  });

  describe("subscribeBulk", () => {
    it.each<BulkSubscribeOptions>([
      {},
      { maxMessagesCount: 10 },
      { maxAwaitDurationMs: 100 },
      { maxMessagesCount: 10, maxAwaitDurationMs: 100 },
      { maxMessagesCount: 0, maxAwaitDurationMs: 0 },
    ])("enables bulk delivery and preserves supplied limits: %j", async (limits) => {
      const { pubsub, register, registerHandler, callback } = createPubSub();
      const metadata = { rawPayload: "true" };

      await pubsub.subscribeBulk("pubsub", "topic", callback, { ...limits, route: "/bulk", metadata });

      expect(register.mock.calls).toEqual([
        ["pubsub", "topic", { route: "/bulk", metadata, bulkSubscribe: { enabled: true, ...limits } }],
      ]);
      expect(registerHandler.mock.calls).toEqual([["pubsub", "topic", "/bulk", callback]]);
    });

    it("registers all handlers for structured bulk routes", async () => {
      const { pubsub, register, registerHandler, callback } = createPubSub();
      const route = { default: "/default", rules: [{ match: "true", path: "/bulk" }] };

      await pubsub.subscribeBulk("pubsub", "topic", callback, { route });

      expect(register.mock.calls).toEqual([
        ["pubsub", "topic", { route, metadata: undefined, bulkSubscribe: { enabled: true } }],
      ]);
      expect(registerHandler.mock.calls).toEqual([
        ["pubsub", "topic", "/default", callback],
        ["pubsub", "topic", "/bulk", callback],
      ]);
    });

    it("handles omitted options from JavaScript callers", async () => {
      const { pubsub, register, registerHandler, callback } = createPubSub();

      // @ts-expect-error Exercise the runtime fallback for untyped callers.
      await pubsub.subscribeBulk("pubsub", "topic", callback);

      expect(register.mock.calls).toEqual([
        ["pubsub", "topic", { route: undefined, metadata: undefined, bulkSubscribe: { enabled: true } }],
      ]);
      expect(registerHandler.mock.calls).toEqual([["pubsub", "topic", undefined, callback]]);
    });
  });

  it("returns the server implementation's subscriptions unchanged", () => {
    const { pubsub, impl } = createPubSub();
    const subscriptions: PubSubSubscriptionsType = { pubsub: {} };
    const getSubscriptions = jest.spyOn(impl, "getSubscriptions").mockReturnValue(subscriptions);

    expect(pubsub.getSubscriptions()).toBe(subscriptions);
    expect(getSubscriptions).toHaveBeenCalledTimes(1);
  });
});

/*
Copyright 2022 The Dapr Authors
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

import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";
import IServerPubSub from "../../../interfaces/Server/IServerPubSub";
import HTTPServer from "./HTTPServer";
import { Logger } from "../../../logger/Logger";
import { PubSubSubscriptionOptionsType } from "../../../types/pubsub/PubSubSubscriptionOptions.type";
import { DaprPubSubRouteType } from "../../../types/pubsub/DaprPubSubRouteType.type";
import { PubSubSubscriptionsType } from "../../../types/pubsub/PubSubSubscriptions.type";
import { KeyValueType } from "../../../types/KeyValue.type";
import { BulkSubscribeConfig } from "../../../types/pubsub/BulkSubscribeConfig.type";
import { BulkSubscribeOptions } from "../../../types/pubsub/BulkSubscribeOptions.type";

// https://docs.dapr.io/reference/api/pubsub_api/
export default class HTTPServerPubSub implements IServerPubSub {
  private readonly server: HTTPServer;
  private readonly logger: Logger;

  constructor(server: HTTPServer) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "PubSub", server.client.options.logger);
  }

  async subscribe(
    pubsubName: string,
    topic: string,
    cb: TypeDaprPubSubCallback,
    route: string | DaprPubSubRouteType = "",
    metadata?: KeyValueType,
  ): Promise<void> {
    this.server.getServerImpl().registerPubsubSubscription(pubsubName, topic, { route, metadata });

    // Add the callback to the event handlers manually
    // @todo: we will deprecate this way of working? and require subscribeToRoute?
    this.subscribeToRoute(pubsubName, topic, route, cb);
  }

  async subscribeWithOptions(
    pubsubName: string,
    topic: string,
    options: PubSubSubscriptionOptionsType = {},
  ): Promise<void> {
    this.server.getServerImpl().registerPubsubSubscription(pubsubName, topic, options);

    if (options.callback) {
      this.subscribeToRoute(pubsubName, topic, options?.route, options.callback);
    }
  }

  subscribeToRoute(
    pubsubName: string,
    topic: string,
    route: string | DaprPubSubRouteType | undefined,
    cb: TypeDaprPubSubCallback,
  ): void {
    if (!route || typeof route === "string") {
      this.subscribeToRouteStringType(pubsubName, topic, route, cb);
    } else {
      this.subscribeToRouteDaprPubSubRouteType(pubsubName, topic, route, cb);
    }
  }

  subscribeToRouteDaprPubSubRouteType(
    pubsubName: string,
    topic: string,
    route: DaprPubSubRouteType,
    cb: TypeDaprPubSubCallback,
  ): void {
    // Register the default
    if (route.default) {
      this.server.getServerImpl().registerPubSubSubscriptionEventHandler(pubsubName, topic, route.default, cb);
    }

    // Register the rules
    if (route.rules) {
      for (const rule of route.rules) {
        this.server.getServerImpl().registerPubSubSubscriptionEventHandler(pubsubName, topic, rule.path, cb);
      }
    }
  }

  subscribeToRouteStringType(
    pubsubName: string,
    topic: string,
    route: string | undefined,
    cb: TypeDaprPubSubCallback,
  ): void {
    this.server.getServerImpl().registerPubSubSubscriptionEventHandler(pubsubName, topic, route, cb);
  }

  async subscribeBulk(
    pubsubName: string,
    topic: string,
    cb: TypeDaprPubSubCallback,
    bulkSubscribeOptions: BulkSubscribeOptions,
  ): Promise<void> {
    const bulkSubscribe: BulkSubscribeConfig = {
      enabled: true,
    };

    const { route, metadata, maxMessagesCount, maxAwaitDurationMs } = bulkSubscribeOptions || {};

    if (maxMessagesCount != undefined) {
      bulkSubscribe.maxMessagesCount = maxMessagesCount;
    }

    if (maxAwaitDurationMs != undefined) {
      bulkSubscribe.maxAwaitDurationMs = maxAwaitDurationMs;
    }

    this.server
      .getServerImpl()
      .registerPubsubSubscription(pubsubName, topic, { route, metadata, bulkSubscribe: bulkSubscribe });

    // Add the callback to the event handlers manually
    // @todo: we will deprecate this way of working? and require subscribeToRoute?
    this.subscribeToRoute(pubsubName, topic, route, cb);
  }

  getSubscriptions(): PubSubSubscriptionsType {
    return this.server.getServerImpl().getSubscriptions();
  }
}

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

import { TypeDaprPubSubCallback } from "../../types/DaprPubSubCallback.type";
import { KeyValueType } from "../../types/KeyValue.type";
import { BulkSubscribeOptions } from "../../types/pubsub/BulkSubscribeOptions.type";
import { DaprPubSubRouteType } from "../../types/pubsub/DaprPubSubRouteType.type";
import { PubSubSubscriptionOptionsType } from "../../types/pubsub/PubSubSubscriptionOptions.type";
import { PubSubSubscriptionsType } from "../../types/pubsub/PubSubSubscriptions.type";

/**
 * Dapr server interface for Pub/Sub messaging.
 * Provides methods to subscribe to topics and register message handlers.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/pubsub/
 */
export default interface IServerPubSub {
  /**
   * Subscribes to a topic with a message handler callback.
   *
   * @param pubSubName - The name of the pub/sub component to subscribe to.
   * @param topic - The topic to subscribe to.
   * @param cb - Callback function invoked when messages arrive.
   * Should return a response indicating success or failure.
   * @param route - Optional HTTP route override for the subscription endpoint.
   * Defaults to `/route-${pubsubName}-${topic}`. Ignored if gRPC transport is used.
   * @param metadata - Optional component-specific metadata for the subscription.
   * @returns A promise that resolves when the subscription is established.
   *
   * @example
   * ```ts
   * await server.pubsub.subscribe(
   *   "orders-pubsub",
   *   "orders.created",
   *   async (message) => {
   *     console.log("Order received:", message);
   *     return { status: "success" };
   *   },
   *   "/orders/created"
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/pubsub_api/
   */
  subscribe(
    pubSubName: string,
    topic: string,
    cb: TypeDaprPubSubCallback,
    route?: string | DaprPubSubRouteType,
    metadata?: KeyValueType,
  ): Promise<void>;

  /**
   * Subscribes to a topic with advanced subscription options.
   *
   * @param pubsubName - The name of the pub/sub component to subscribe to.
   * @param topic - The topic to subscribe to.
   * @param options - Subscription configuration including callback, route, metadata, and dead-letter topics.
   * @returns A promise that resolves when the subscription is established.
   *
   * @see https://docs.dapr.io/reference/api/pubsub_api/
   */
  subscribeWithOptions(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType): Promise<void>;

  /**
   * Registers a message handler for a specific route within an already-subscribed topic.
   * Allows multiple routes to share the same topic subscription with different handlers.
   *
   * @param pubsubName - The name of the pub/sub component.
   * @param topic - The topic already subscribed to.
   * @param route - The Dapr route (HTTP path or gRPC method) for routing messages to this handler.
   * @param cb - Callback function to handle messages routed to this endpoint.
   *
   * @see https://docs.dapr.io/reference/api/pubsub_api/
   */
  subscribeToRoute(
    pubsubName: string,
    topic: string,
    route: string | DaprPubSubRouteType,
    cb: TypeDaprPubSubCallback,
  ): void;

  /**
   * Subscribes to a topic using bulk subscribe mode.
   * Allows the handler to receive multiple messages in a single callback invocation.
   *
   * @param pubSubName - The name of the pub/sub component to subscribe to.
   * @param topic - The topic to subscribe to.
   * @param cb - Callback function to handle bulk messages.
   * Receives an array of messages and should return success/failure status for each.
   * @param bulkSubscribeOptions - Optional bulk subscribe configuration including
   * maxMessagesCount, maxAwaitDurationMs, and route settings.
   * @returns A promise that resolves when the bulk subscription is established.
   *
   * @see https://docs.dapr.io/reference/api/pubsub_api/
   */
  subscribeBulk(
    pubSubName: string,
    topic: string,
    cb: TypeDaprPubSubCallback,
    bulkSubscribeOptions?: BulkSubscribeOptions,
  ): Promise<void>;

  /**
   * Retrieves a list of all registered pub/sub subscriptions.
   * Useful for debugging and monitoring active subscriptions.
   *
   * @returns An object containing all registered subscriptions organized by pub/sub component and topic.
   *
   * @see https://docs.dapr.io/reference/api/pubsub_api/
   */
  getSubscriptions(): PubSubSubscriptionsType;
}

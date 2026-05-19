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

import { TypeDaprPubSubCallback } from "../DaprPubSubCallback.type";
import { KeyValueType } from "../KeyValue.type";
import { BulkSubscribeConfig } from "./BulkSubscribeConfig.type";
import { DaprPubSubRouteType } from "./DaprPubSubRouteType.type";

/**
 * Configuration options for subscribing to Pub/Sub topics.
 *
 * Controls message handling, routing, error handling (dead-lettering), and bulk message processing.
 * Used when registering topic subscriptions with the Dapr server.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/ | Dapr Pub/Sub}
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/how-to-publish-subscribe/ | Pub/Sub How-to}
 *
 * @example
 * ```typescript
 * // Simple subscription with default routing
 * const simpleOptions: PubSubSubscriptionOptionsType = {
 *   callback: handleMessages,
 *   route: "/messages"
 * };
 * await server.pubsub.subscribe("kafka", "orders", handleMessages);
 *
 * // Advanced subscription with routing and dead-lettering
 * const advancedOptions: PubSubSubscriptionOptionsType = {
 *   callback: handleOrderMessages,
 *   route: {
 *     rules: [{
 *       match: "event.type == 'order.placed'",
 *       path: "/order-placed"
 *     }],
 *     default: "/orders-default"
 *   },
 *   deadLetterTopic: "order-dlq",
 *   deadLetterCallback: handleDeadLetterMessages,
 *   metadata: { "maxRetries": "3" }
 * };
 * ```
 */
export type PubSubSubscriptionOptionsType = {
  /**
   * Component-specific metadata for the subscription.
   * Can control subscription behavior such as max retries, timeouts, etc.
   * Exact metadata keys depend on the Pub/Sub component.
   *
   * @example
   * ```typescript
   * {
   *   "maxRetries": "3",
   *   "timeout": "30s",
   *   "consumerGroup": "my-app-group"
   * }
   * ```
   */
  metadata?: KeyValueType;

  /**
   * Topic name where messages that failed processing are sent.
   * If message processing fails and retries are exhausted, the message
   * is published to this dead-letter topic instead of being discarded.
   * Requires deadLetterCallback to handle these failed messages.
   *
   * @example
   * ```typescript
   * deadLetterTopic: "order-messages-dlq"
   * ```
   */
  deadLetterTopic?: string;

  /**
   * Callback function to handle dead-lettered messages.
   * Invoked when messages fail processing and are sent to the dead-letter topic.
   * Typically logs errors, triggers alerts, or stores failed messages for analysis.
   * Only used if deadLetterTopic is also specified.
   *
   * @example
   * ```typescript
   * deadLetterCallback: async (data, headers) => {
   *   logger.error("Dead-letter message", data);
   *   await storeFailedMessage(data);
   * }
   * ```
   */
  deadLetterCallback?: TypeDaprPubSubCallback;

  /**
   * Default message handler callback for incoming messages.
   * Invoked when a message is received that doesn't match any routing rules.
   * If routes are not specified, this callback handles all messages.
   *
   * @example
   * ```typescript
   * callback: async (data, headers) => {
   *   const event = JSON.parse(data);
   *   await processEvent(event);
   * }
   * ```
   */
  callback?: TypeDaprPubSubCallback;

  /**
   * Message routing configuration for content-based routing.
   * Can be a simple string (default route path) or a complex routing rule configuration
   * that directs messages to different handlers based on message content (CEL expressions).
   *
   * When using routes, matched messages bypass the default callback and go to the specified path.
   *
   * @example
   * ```typescript
   * // Simple default route
   * route: "/messages"
   *
   * // Complex routing with rules
   * route: {
   *   rules: [
   *     { match: "event.type == 'order.placed'", path: "/orders" },
   *     { match: "event.type == 'payment.received'", path: "/payments" }
   *   ],
   *   default: "/default-handler"
   * }
   * ```
   */
  route?: string | DaprPubSubRouteType;

  /**
   * Configuration for bulk message subscription.
   * When enabled, messages are batched together and sent to the subscriber in bulk
   * rather than one at a time. Improves throughput for high-volume scenarios.
   * If not specified, messages are processed individually.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/pubsub-bulk/ | Bulk Pub/Sub}
   *
   * @example
   * ```typescript
   * bulkSubscribe: {
   *   enabled: true,
   *   maxMessagesCount: 100,
   *   maxAwaitDurationMs: 1000
   * }
   * ```
   */
  bulkSubscribe?: BulkSubscribeConfig;
};

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

import { PubSubSubscriptionTopicType } from "./PubSubSubscriptionTopic.type";

/**
 * PubSub subscriptions grouped by Pub/Sub component name.
 *
 * A map where each key is a Pub/Sub component name (e.g., "kafka", "redis", "azure-servicebus")
 * and the value contains all topic subscriptions for that component.
 * Used by the Dapr server to declare all Pub/Sub subscriptions in a declarative/programmatic way.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/ | Dapr Pub/Sub}
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/subscription-methods/ | Subscription Methods}
 *
 * @example
 * ```typescript
 * // Register subscriptions for multiple Pub/Sub components
 * const subscriptions: PubSubSubscriptionType = {
 *   "kafka-pubsub": {
 *     "orders": {
 *       callback: handleOrderMessages,
 *       route: "/subscribe/orders"
 *     },
 *     "payments": {
 *       callback: handlePaymentMessages,
 *       route: "/subscribe/payments"
 *     }
 *   },
 *   "redis-pubsub": {
 *     "notifications": {
 *       callback: handleNotifications,
 *       route: "/subscribe/notifications"
 *     }
 *   }
 * };
 *
 * // Or programmatic subscription
 * await server.pubsub.subscribe("kafka-pubsub", "orders", handleOrderMessages);
 * ```
 */
export type PubSubSubscriptionType = {
  /**
   * Subscriptions for a specific Pub/Sub component.
   * The key is the name of the Pub/Sub component configured in Dapr.
   * The value contains all topic subscriptions for that component.
   */
  [pubSubComponentName: string]: PubSubSubscriptionTopicType;
};

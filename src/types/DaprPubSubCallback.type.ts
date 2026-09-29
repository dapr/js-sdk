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

/**
 * Callback function signature for handling Pub/Sub messages.
 *
 * This callback is invoked when the Dapr sidecar receives a message from a topic subscription.
 * The handler receives the message data and headers (such as content-type, trace IDs, etc.)
 * and must process the message asynchronously. If the handler throws an error, the message
 * is typically dead-lettered or retried depending on the Pub/Sub component configuration.
 *
 * @param data - The message payload from the topic. Can be any type, typically string or object.
 * @param headers - Metadata headers accompanying the message, including cloudEvents attributes
 *                  and custom metadata from the Pub/Sub component.
 * @returns Promise that resolves when message processing is complete. Can return void or any response value.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/ | Dapr Pub/Sub}
 * @see {@link https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md | CloudEvents Specification}
 *
 * @example
 * ```typescript
 * // Simple Pub/Sub handler
 * const pubsubHandler: TypeDaprPubSubCallback = async (data, headers) => {
 *   console.log("Message headers:", headers);
 *   const event = typeof data === 'string' ? JSON.parse(data) : data;
 *   console.log("Event received:", event);
 *   await handleOrderEvent(event);
 * };
 *
 * // Register with server
 * server.pubsub.subscribe("order-pubsub", "orders-topic", pubsubHandler);
 * ```
 */
export type TypeDaprPubSubCallback = (data: any, headers: object) => Promise<any | void>;

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

import { KeyValueType } from "../KeyValue.type";

/**
 * Options for publishing messages to Pub/Sub topics.
 *
 * Specifies optional metadata and content type information when publishing messages.
 * These options allow control over message encoding and component-specific behavior.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/ | Dapr Pub/Sub}
 *
 * @example
 * ```typescript
 * // Publish with explicit content type
 * const options: PubSubPublishOptions = {
 *   contentType: "application/json",
 *   metadata: { "correlation-id": "msg-123" }
 * };
 * await client.pubsub.publish("kafka-pubsub", "orders", {
 *   orderId: "ORD-001",
 *   amount: 99.99
 * }, options);
 *
 * // Publish with minimal options
 * await client.pubsub.publish("redis-pubsub", "events", eventData);
 * ```
 */
export type PubSubPublishOptions = {
  /**
   * MIME type of the message content.
   * If not provided, the SDK typically infers the type from the payload
   * (e.g., "application/json" for objects, "text/plain" for strings).
   * Explicitly set if you need to override auto-detection.
   *
   * @example
   * ```typescript
   * contentType: "application/json"
   * contentType: "application/xml"
   * contentType: "text/plain"
   * ```
   */
  contentType?: string;

  /**
   * Component-specific metadata to accompany the published message.
   * Can be used for routing hints, partition keys, custom headers, or other
   * Pub/Sub component-specific configuration.
   *
   * Common uses:
   * - "partition-key": For partitioned topics (Kafka, Event Hubs)
   * - "x-correlation-id": For request tracing
   * - Component-specific configuration options
   *
   * @example
   * ```typescript
   * {
   *   "partition-key": "user-123",
   *   "x-correlation-id": "req-456",
   *   "x-trace-id": "trace-789"
   * }
   * ```
   */
  metadata?: KeyValueType;
};

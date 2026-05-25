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

import { KeyValueType } from "../../types/KeyValue.type";
import { PubSubBulkPublishMessage } from "../../types/pubsub/PubSubBulkPublishMessage.type";
import { PubSubBulkPublishResponse } from "../../types/pubsub/PubSubBulkPublishResponse.type";
import { PubSubPublishOptions } from "../../types/pubsub/PubSubPublishOptions.type";
import { PubSubPublishResponseType } from "../../types/pubsub/PubSubPublishResponse.type";

/**
 * Dapr client interface for Pub/Sub messaging.
 * Provides methods to publish messages to topics using Dapr pub/sub building block.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/pubsub/
 */
export default interface IClientPubSub {
  /**
   * Publishes a message to a topic.
   *
   * Content-Type is automatically determined:
   * - "application/cloudevents+json" if data is a valid CloudEvent
   * - "application/json" if data is a JSON object
   * - "text/plain" otherwise
   *
   * @param pubSubName - The name of the pub/sub component to use.
   * @param topic - The topic to publish the message to.
   * @param data - The message payload. Objects are JSON serialized automatically.
   * @param options - Optional publish options (metadata, content-type override, etc.).
   * @returns A promise that resolves to a publish response from the component.
   *
   * @example
   * ```ts
   * await client.pubsub.publish(
   *   "orders-pubsub",
   *   "orders.created",
   *   { orderId: "123", total: 99.99 }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/pubsub_api/
   */
  publish(
    pubSubName: string,
    topic: string,
    data?: object | string,
    options?: PubSubPublishOptions,
  ): Promise<PubSubPublishResponseType>;

  /**
   * Publishes multiple messages to a topic in a single batch request.
   *
   * Content-Type for each message is automatically determined:
   * - "application/cloudevents+json" if data is a valid CloudEvent
   * - "application/json" if data is a JSON object
   * - "text/plain" otherwise
   *
   * @param pubSubName - The name of the pub/sub component to use.
   * @param topic - The topic to publish the messages to.
   * @param messages - Array of messages to publish in bulk.
   * @param metadata - Optional component-specific metadata for the bulk publish request.
   * @returns A promise that resolves to a response containing any failed entries.
   * A successful bulk publish may still have individual failed messages.
   *
   * @example
   * ```ts
   * const response = await client.pubsub.publishBulk(
   *   "orders-pubsub",
   *   "orders.created",
   *   [
   *     { data: { orderId: "123" } },
   *     { data: { orderId: "124" } },
   *     { data: { orderId: "125" } }
   *   ]
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/pubsub_api/
   */
  publishBulk(
    pubSubName: string,
    topic: string,
    messages: PubSubBulkPublishMessage[],
    metadata?: KeyValueType,
  ): Promise<PubSubBulkPublishResponse>;
}

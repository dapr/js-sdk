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

import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import GRPCClient from "./GRPCClient";
import {
  BulkPublishRequest,
  BulkPublishRequestEntrySchema,
  BulkPublishRequestSchema,
  BulkPublishResponse,
  PublishEventRequestSchema,
  SubscribeTopicEventsRequestAlpha1,
  SubscribeTopicEventsRequestAlpha1Schema,
} from "../../../proto/dapr/proto/runtime/v1/pubsub_pb";
import IClientPubSub from "../../../interfaces/Client/IClientPubSub";
import { Logger } from "../../../logger/Logger";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { KeyValueType } from "../../../types/KeyValue.type";
import { getBulkPublishEntries, getBulkPublishResponse } from "../../../utils/Client.util";
import { PubSubPublishResponseType } from "../../../types/pubsub/PubSubPublishResponse.type";
import { PubSubBulkPublishResponse } from "../../../types/pubsub/PubSubBulkPublishResponse.type";
import { PubSubBulkPublishMessage } from "../../../types/pubsub/PubSubBulkPublishMessage.type";
import { PubSubPublishOptions } from "../../../types/pubsub/PubSubPublishOptions.type";
import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";
import {
  PubSubStreamingSubscription,
  PubSubStreamingSubscriptionOptions,
} from "../../../types/pubsub/PubSubStreamingSubscription.type";
import { DeferredAsyncIterable } from "../../../utils/Streams.util";
import { deserializeGrpc } from "../../../utils/Deserializer.util";
import DaprPubSubStatusEnum from "../../../enum/DaprPubSubStatus.enum";
import { TopicEventResponse_TopicEventResponseStatus } from "../../../proto/dapr/proto/runtime/v1/appcallback_pb";

/**
 * Determines whether a gRPC error means the sidecar does not serve the stable
 * `BulkPublishEvent` RPC.
 *
 * A sidecar that predates the RPC should answer `UNIMPLEMENTED`, but Dapr
 * installs a catch-all handler that forwards unrecognised methods to service
 * invocation, so in practice it reports a proxy failure with `UNKNOWN`
 * instead. Both shapes are treated as "not supported"; the match is kept
 * deliberately narrow, because a broader one risks retrying a publish that the
 * sidecar had in fact already accepted.
 */
function isBulkPublishUnsupported(error: unknown): boolean {
  const connectError = ConnectError.from(error);

  return (
    connectError.code === Code.Unimplemented ||
    (connectError.code === Code.Unknown && connectError.rawMessage.includes("failed to proxy request"))
  );
}

/**
 * gRPC-based pub/sub building block implementation.
 *
 * Provides publish and bulk publish operations for event-driven messaging patterns.
 * Uses gRPC for efficient communication with pub/sub brokers configured in Dapr.
 *
 * Supports multiple pub/sub components (Redis, RabbitMQ, Kafka, NATS, etc.)
 * and batch operations for improved throughput.
 *
 * @implements {IClientPubSub}
 * @see {@link https://docs.dapr.io/reference/api/pubsub_api/} Dapr Pub/Sub API
 * @see {@link DaprClient.pubsub} for unified API
 *
 * @internal
 */
// https://docs.dapr.io/reference/api/pubsub_api/
export default class GRPCClientPubSub implements IClientPubSub {
  client: GRPCClient;

  private readonly logger: Logger;

  /**
   * Set once the sidecar has been observed to not implement the stable
   * `BulkPublishEvent` RPC, so subsequent calls go straight to the alpha1 RPC
   * instead of paying for a failed round trip each time.
   */
  private useBulkPublishAlpha1 = false;

  /**
   * Settles once the first bulk publish on this client has completed, by which
   * point it has found out whether the sidecar serves the stable RPC. Calls
   * made in the meantime wait on it rather than each probing the sidecar, so
   * however many publishes start concurrently, a pre-1.17 sidecar normally
   * costs one failed round trip and one warning per client. It never rejects.
   */
  private bulkPublishProbe?: Promise<void>;

  constructor(client: GRPCClient) {
    this.client = client;
    this.logger = new Logger("GRPCClient", "PubSub", client.options.logger);
  }

  async subscribeStream(
    pubSubName: string,
    topic: string,
    callback: TypeDaprPubSubCallback,
    options: PubSubStreamingSubscriptionOptions = {},
  ): Promise<PubSubStreamingSubscription> {
    if (!pubSubName.trim() || !topic.trim()) {
      throw new TypeError("Streaming subscriptions require a non-empty pub/sub name and topic.");
    }
    if (typeof callback !== "function") {
      throw new TypeError("Streaming subscriptions require a callback.");
    }
    options.signal?.throwIfAborted();
    const client = await this.client.getClient();
    options.signal?.throwIfAborted();

    const requests = new DeferredAsyncIterable<SubscribeTopicEventsRequestAlpha1>();
    const controller = new AbortController();
    const cancel = () => {
      requests.end();
      controller.abort();
    };
    options.signal?.addEventListener("abort", cancel, { once: true });
    requests.push(
      create(SubscribeTopicEventsRequestAlpha1Schema, {
        subscribeTopicEventsRequestType: {
          case: "initialRequest",
          value: {
            pubsubName: pubSubName,
            topic,
            metadata: options.metadata,
            deadLetterTopic: options.deadLetterTopic,
          },
        },
      }),
    );

    let ready = false;
    let resolveReady!: () => void;
    let rejectReady!: (error: unknown) => void;
    const started = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    const closed = (async () => {
      try {
        const responses = client.subscribeTopicEventsAlpha1(requests, { signal: controller.signal });
        for await (const response of responses) {
          if (controller.signal.aborted) break;
          const message = response.subscribeTopicEventsResponseType;
          if (!ready) {
            if (message.case !== "initialResponse") {
              throw new Error("Expected an initial response for the streaming subscription.");
            }
            ready = true;
            resolveReady();
            continue;
          }
          if (message.case !== "eventMessage") {
            throw new Error("Expected an event message for the streaming subscription.");
          }

          const event = message.value;
          let status = TopicEventResponse_TopicEventResponseStatus.RETRY;
          try {
            const data = deserializeGrpc(event.dataContentType, event.data, this.client.options.serializer);
            const result: unknown = await callback(data, {
              ...event.extensions,
              id: event.id,
              source: event.source,
              type: event.type,
              specversion: event.specVersion,
              datacontenttype: event.dataContentType,
              topic: event.topic,
              pubsubname: event.pubsubName,
              path: event.path,
            });
            switch (result) {
              case undefined:
              case DaprPubSubStatusEnum.SUCCESS:
                status = TopicEventResponse_TopicEventResponseStatus.SUCCESS;
                break;
              case DaprPubSubStatusEnum.RETRY:
                break;
              case DaprPubSubStatusEnum.DROP:
                status = TopicEventResponse_TopicEventResponseStatus.DROP;
                break;
              default:
                throw new TypeError("Streaming subscription callback must return SUCCESS, RETRY, DROP, or void.");
            }
          } catch (error) {
            this.logger.error(`Streaming subscription '${pubSubName}/${topic}' processing failed: ${error}`);
          }
          if (controller.signal.aborted) break;
          requests.push(
            create(SubscribeTopicEventsRequestAlpha1Schema, {
              subscribeTopicEventsRequestType: {
                case: "eventProcessed",
                value: { id: event.id, status: { status } },
              },
            }),
          );
        }
        if (!controller.signal.aborted) {
          throw new Error("Streaming subscription ended unexpectedly.");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          rejectReady(error);
          throw error;
        }
      } finally {
        if (!ready) {
          rejectReady(new ConnectError("Streaming subscription canceled before confirmation.", Code.Canceled));
        }
        options.signal?.removeEventListener("abort", cancel);
        cancel();
      }
    })();
    // Keep the rejection observable without an unhandled rejection if callers
    // choose to rely on logging instead of awaiting closed.
    void closed.catch((error: unknown) => {
      this.logger.error(`Streaming subscription '${pubSubName}/${topic}' failed: ${error}`);
    });
    await started;
    return { close: async () => cancel(), closed };
  }

  async publish(
    pubSubName: string,
    topic: string,
    data: object | string,
    options: PubSubPublishOptions = {},
  ): Promise<PubSubPublishResponseType> {
    const req: any = {
      pubsubName: pubSubName,
      topic,
      metadata: options.metadata ?? {},
    };

    if (data || (this.client.options.serializer && data !== undefined)) {
      const serialized = SerializerUtil.serializeGrpc(data, options.contentType, this.client.options.serializer);
      req.data = serialized.serializedData;
      req.dataContentType = serialized.contentType;
    }

    const client = await this.client.getClient();

    try {
      await client.publishEvent(create(PublishEventRequestSchema, req));
      return {};
    } catch (err) {
      this.logger.error(`publish failed: ${err}`);
      throw { error: err };
    }
  }

  async publishBulk(
    pubSubName: string,
    topic: string,
    messages: PubSubBulkPublishMessage[],
    metadata?: KeyValueType | undefined,
  ): Promise<PubSubBulkPublishResponse> {
    const serializer = this.client.options.serializer;
    const entries = getBulkPublishEntries(
      messages,
      serializer ? serializer.contentType ?? "application/json" : undefined,
    );
    const serializedEntries = entries.map((entry) => {
      const serialized = SerializerUtil.serializeGrpc(
        entry.event,
        serializer ? entry.contentType : undefined,
        serializer,
      );
      return create(BulkPublishRequestEntrySchema, {
        entryId: entry.entryID,
        event: serialized.serializedData,
        contentType: serialized.contentType,
      });
    });

    const client = await this.client.getClient();

    try {
      const res = await this.bulkPublish(
        client,
        create(BulkPublishRequestSchema, {
          pubsubName: pubSubName,
          topic,
          entries: serializedEntries,
          metadata: metadata ?? {},
        }),
      );

      if (res.failedEntries.length > 0) {
        return getBulkPublishResponse({
          entries,
          response: {
            failedEntries: res.failedEntries.map((entry) => ({
              entryID: entry.entryId,
              error: entry.error,
            })),
          },
        });
      }

      return { failedMessages: [] };
    } catch (err) {
      return getBulkPublishResponse({ entries, error: err as Error });
    }
  }

  /**
   * Invokes the stable `BulkPublishEvent` RPC, falling back to the deprecated
   * `BulkPublishEventAlpha1` RPC when the sidecar does not serve it.
   *
   * The stable RPC was introduced in Dapr 1.17. Older sidecars reject it in a
   * way that identifies the method as unknown rather than the publish as
   * failed, so the fallback is remembered for the lifetime of this client.
   *
   * The first call doubles as the capability probe, and calls that arrive
   * while it is in flight wait for its outcome before sending their own
   * request through the selected RPC.
   */
  private async bulkPublish(
    client: Awaited<ReturnType<GRPCClient["getClient"]>>,
    request: BulkPublishRequest,
  ): Promise<BulkPublishResponse> {
    if (!this.bulkPublishProbe) {
      const probe = this.bulkPublishStableFirst(client, request);
      this.bulkPublishProbe = probe.then(
        () => undefined,
        () => undefined,
      );
      return await probe;
    }

    await this.bulkPublishProbe;

    if (this.useBulkPublishAlpha1) {
      return await client.bulkPublishEventAlpha1(request);
    }

    return await this.bulkPublishStableFirst(client, request);
  }

  private async bulkPublishStableFirst(
    client: Awaited<ReturnType<GRPCClient["getClient"]>>,
    request: BulkPublishRequest,
  ): Promise<BulkPublishResponse> {
    try {
      return await client.bulkPublishEvent(request);
    } catch (err) {
      if (!isBulkPublishUnsupported(err)) {
        throw err;
      }

      this.fallBackToBulkPublishAlpha1();
      return await client.bulkPublishEventAlpha1(request);
    }
  }

  private fallBackToBulkPublishAlpha1(): void {
    if (this.useBulkPublishAlpha1) {
      return;
    }

    this.useBulkPublishAlpha1 = true;
    this.logger.warn(
      "The Dapr sidecar does not implement the stable BulkPublishEvent API, " +
        "falling back to the deprecated BulkPublishEventAlpha1 API. Upgrade to Dapr 1.17 or newer.",
    );
  }
}

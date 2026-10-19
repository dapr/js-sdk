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

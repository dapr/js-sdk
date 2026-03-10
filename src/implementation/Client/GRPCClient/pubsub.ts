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

import GRPCClient from "./GRPCClient";
import {
  BulkPublishRequestEntrySchema,
  BulkPublishRequestSchema,
  PublishEventRequestSchema
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientPubSub from "../../../interfaces/Client/IClientPubSub";
import { Logger } from "../../../logger/Logger";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { KeyValueType } from "../../../types/KeyValue.type";
import {
  addMetadataToMap,
  convertToMap,
  getBulkPublishEntries,
  getBulkPublishResponse,
} from "../../../utils/Client.util";
import { PubSubPublishResponseType } from "../../../types/pubsub/PubSubPublishResponse.type";
import { PubSubBulkPublishResponse } from "../../../types/pubsub/PubSubBulkPublishResponse.type";
import { PubSubBulkPublishMessage } from "../../../types/pubsub/PubSubBulkPublishMessage.type";
import { PubSubPublishOptions } from "../../../types/pubsub/PubSubPublishOptions.type";
import { create } from "@bufbuild/protobuf";

// https://docs.dapr.io/reference/api/pubsub_api/
export default class GRPCClientPubSub implements IClientPubSub {
  client: GRPCClient;

  private readonly logger: Logger;

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
    const msgService = create(PublishEventRequestSchema, {
      pubsubName: pubSubName,
      topic: topic,
      metadata: options.metadata || {},
    });

    if (data) {
      const serialized = SerializerUtil.serializeGrpc(data, options.contentType);
      msgService.data = serialized.serializedData;
      msgService.dataContentType = serialized.contentType;
    }

    const client = await this.client.getClient();
    await client.publishEvent(msgService);
    return {};
  }

  async publishBulk(
    pubSubName: string,
    topic: string,
    messages: PubSubBulkPublishMessage[],
    metadata?: KeyValueType | undefined,
  ): Promise<PubSubBulkPublishResponse> {
    const bulkPublishRequest = create(BulkPublishRequestSchema);
    bulkPublishRequest.pubsubName = pubSubName;
    bulkPublishRequest.topic = topic;

    const entries = getBulkPublishEntries(messages);
    bulkPublishRequest.entries = entries.map((entry) => {
      const serialized = SerializerUtil.serializeGrpc(entry.event);
      const bulkPublishEntry = create(BulkPublishRequestEntrySchema);
      bulkPublishEntry.event = serialized.serializedData;
      bulkPublishEntry.contentType = serialized.contentType;
      bulkPublishEntry.entryId = entry.entryID;
      return bulkPublishEntry;
    });

    addMetadataToMap(convertToMap(bulkPublishRequest.metadata), metadata);

    const client = await this.client.getClient();
    const res = await client.bulkPublishEventAlpha1(bulkPublishRequest);

    if (res.failedEntries.length > 0) {
      return getBulkPublishResponse({
        entries: entries,
        response: {
          failedEntries: res.failedEntries.map((entry) => ({
            entryID: entry.entryId,
            error: entry.error
          })),
        },
      });
    }

    return { failedMessages: [] };
  }
}

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
  BulkPublishRequest,
  BulkPublishRequestEntry,
  PublishEventRequest,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientPubSub from "../../../interfaces/Client/IClientPubSub";
import { Logger } from "../../../logger/Logger";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { KeyValueType } from "../../../types/KeyValue.type";
import { addMetadataToMap, getBulkPublishEntries, getBulkPublishResponse } from "../../../utils/Client.util";
import { PubSubPublishResponseType } from "../../../types/pubsub/PubSubPublishResponse.type";
import { PubSubBulkPublishResponse } from "../../../types/pubsub/PubSubBulkPublishResponse.type";
import { PubSubBulkPublishMessage } from "../../../types/pubsub/PubSubBulkPublishMessage.type";

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
    metadata?: KeyValueType,
  ): Promise<PubSubPublishResponseType> {
    const msgService = new PublishEventRequest();
    msgService.setPubsubName(pubSubName);
    msgService.setTopic(topic);

    if (data) {
      const serialized = SerializerUtil.serializeGrpc(data);
      msgService.setData(serialized.serializedData);
      msgService.setDataContentType(serialized.contentType);
    }

    addMetadataToMap(msgService.getMetadataMap(), metadata);

    const client = await this.client.getClient();
    return new Promise((resolve, reject) => {
      client.publishEvent(msgService, (err, _res) => {
        if (err) {
          this.logger.error(`publish failed: ${err}`);
          return reject({ error: err });
        }

        return resolve({});
      });
    });
  }

  async publishBulk(
    pubSubName: string,
    topic: string,
    messages: PubSubBulkPublishMessage[],
    metadata?: KeyValueType | undefined,
  ): Promise<PubSubBulkPublishResponse> {
    const bulkPublishRequest = new BulkPublishRequest();
    bulkPublishRequest.setPubsubName(pubSubName);
    bulkPublishRequest.setTopic(topic);

    const entries = getBulkPublishEntries(messages);
    const serializedEntries = entries.map((entry) => {
      const serialized = SerializerUtil.serializeGrpc(entry.event);
      const bulkPublishEntry = new BulkPublishRequestEntry();
      bulkPublishEntry.setEvent(serialized.serializedData);
      bulkPublishEntry.setContentType(serialized.contentType);
      bulkPublishEntry.setEntryId(entry.entryID);
      return bulkPublishEntry;
    });

    bulkPublishRequest.setEntriesList(serializedEntries);
    addMetadataToMap(bulkPublishRequest.getMetadataMap(), metadata);

    const client = await this.client.getClient();
    return new Promise((resolve, _reject) => {
      client.bulkPublishEventAlpha1(bulkPublishRequest, (err, res) => {
        if (err) {
          return resolve(getBulkPublishResponse({ entries: entries, error: err }));
        }

        const failedEntries = res.getFailedentriesList();
        if (failedEntries.length > 0) {
          return resolve(
            getBulkPublishResponse({
              entries: entries,
              response: {
                failedEntries: failedEntries.map((entry) => ({
                  entryID: entry.getEntryId(),
                  error: entry.getError(),
                })),
              },
            }),
          );
        }

        return resolve({ failedMessages: [] });
      });
    });
  }
}

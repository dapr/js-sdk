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

import HTTPClient from "./HTTPClient";
import IClientPubSub from "../../../interfaces/Client/IClientPubSub";
import { Logger } from "../../../logger/Logger";
import { KeyValueType } from "../../../types/KeyValue.type";
import {
  createHTTPMetadataQueryParam,
  getBulkPublishEntries,
  getBulkPublishResponse,
  getContentType,
} from "../../../utils/Client.util";
import { PubSubPublishResponseType } from "../../../types/pubsub/PubSubPublishResponse.type";
import { THTTPExecuteParams } from "../../../types/http/THTTPExecuteParams.type";
import { PubSubBulkPublishResponse } from "../../../types/pubsub/PubSubBulkPublishResponse.type";
import { PubSubBulkPublishMessage } from "../../../types/pubsub/PubSubBulkPublishMessage.type";

// https://docs.dapr.io/reference/api/pubsub_api/
export default class HTTPClientPubSub implements IClientPubSub {
  client: HTTPClient;
  private readonly logger: Logger;

  constructor(client: HTTPClient) {
    this.client = client;
    this.logger = new Logger("HTTPClient", "PubSub", client.getOptions().logger);
  }

  async publish(
    pubSubName: string,
    topic: string,
    data: object | string,
    metadata?: KeyValueType,
  ): Promise<PubSubPublishResponseType> {
    const queryParams = createHTTPMetadataQueryParam(metadata);
    const params: THTTPExecuteParams = {
      method: "POST",
      headers: {
        "Content-Type": getContentType(data),
      },
    };

    if (data) {
      params.body = JSON.stringify(data);
    }

    try {
      await this.client.execute(`/publish/${pubSubName}/${topic}?${queryParams}`, params);
    } catch (e: any) {
      this.logger.error(`publish failed: ${e}`);
      return { error: e };
    }

    return {};
  }

  async publishBulk(
    pubSubName: string,
    topic: string,
    messages: PubSubBulkPublishMessage[],
    metadata?: KeyValueType | undefined,
  ): Promise<PubSubBulkPublishResponse> {
    const queryParams = createHTTPMetadataQueryParam(metadata);
    const params: THTTPExecuteParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const entries = getBulkPublishEntries(messages);
    params.body = JSON.stringify(entries);

    try {
      await this.client.executeWithApiVersion(
        "v1.0-alpha1",
        `/publish/bulk/${pubSubName}/${topic}?${queryParams}`,
        params,
      );
      // If no error is thrown, all messages were published successfully
      return { failedMessages: [] };
    } catch (error: any) {
      this.logger.error(`Failure publishing bulk messages: ${error}`);
      try {
        // If the error is returned by the bulk publish API,
        // parse the error message and return the response
        const bulkPublishResponse = JSON.parse(JSON.parse(error.message).error_msg);
        return getBulkPublishResponse({ entries: entries, response: bulkPublishResponse });
      } catch (_innerError: any) {
        // Fail all messages with the original error
        return getBulkPublishResponse({ entries: entries, error: error });
      }
    }
  }
}

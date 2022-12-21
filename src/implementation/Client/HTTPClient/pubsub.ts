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
import { BulkPublishApiResponse, configureBulkPublishEntries, createHTTPMetadataQueryParam, getBulkPublishResponse, getContentType } from "../../../utils/Client.util";
import { PubSubPublishResponseType } from "../../../types/pubsub/PubSubPublishResponse.type";
import { THTTPExecuteParams } from "../../../types/http/THTTPExecuteParams.type";
import { PubSubBulkPublishEntry } from "../../../types/pubsub/PubSubBulkPublishEntry.type";
import { PubSubBulkPublishResponse } from "../../../types/pubsub/PubSubBulkPublishResponse.type";

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
    entries: PubSubBulkPublishEntry[],
    metadata?: KeyValueType | undefined,
  ): Promise<PubSubBulkPublishResponse> {
    const queryParams = createHTTPMetadataQueryParam(metadata);
    const params: THTTPExecuteParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (entries.length > 0) {
      params.body = JSON.stringify(configureBulkPublishEntries(entries));
    }

    let bulkPublishError: Error | undefined;
    let bulkPublishResponse: BulkPublishApiResponse;

    try {
      bulkPublishResponse = await this.client.executeWithApiVersion(
        "v1.0-alpha1",
        `/publish/bulk/${pubSubName}/${topic}?${queryParams}`,
        params,
      ) as BulkPublishApiResponse;
    } catch (e: any) {
      this.logger.error(`Failure publishing bulk messages: ${e}`);
      const errorDetails = JSON.parse(e.message)
      bulkPublishResponse = JSON.parse(errorDetails.error_msg)
      bulkPublishError = e;
    }

    return getBulkPublishResponse(
      bulkPublishResponse,
      entries,
      bulkPublishError);
  }
}

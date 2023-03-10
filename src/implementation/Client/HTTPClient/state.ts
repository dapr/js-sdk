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
import { KeyValuePairType } from "../../../types/KeyValuePair.type";
import { OperationType } from "../../../types/Operation.type";
import { IRequestMetadata } from "../../../types/RequestMetadata.type";
import IClientState from "../../../interfaces/Client/IClientState";
import { KeyValueType } from "../../../types/KeyValue.type";
import { StateQueryType } from "../../../types/state/StateQuery.type";
import { StateQueryResponseType } from "../../../types/state/StateQueryResponse.type";
import { StateGetBulkOptions } from "../../../types/state/StateGetBulkOptions.type";
import { createHTTPMetadataQueryParam } from "../../../utils/Client.util";
import { Settings } from "../../../utils/Settings.util";
import { Logger } from "../../../logger/Logger";
import { StateSaveResponseType } from "../../../types/state/StateSaveResponseType";

// https://docs.dapr.io/reference/api/state_api/
export default class HTTPClientState implements IClientState {
  client: HTTPClient;
  private readonly logger: Logger;

  constructor(client: HTTPClient) {
    this.client = client;
    this.logger = new Logger("HTTPClient", "State", client.options.logger);
  }

  async save(
    storeName: string,
    stateObjects: KeyValuePairType[],
    metadata?: KeyValueType,
  ): Promise<StateSaveResponseType> {
    const queryParams = createHTTPMetadataQueryParam(metadata);

    try {
      await this.client.execute(`/state/${storeName}?${queryParams}`, {
        method: "POST",
        body: stateObjects,
      });
    } catch (e: any) {
      this.logger.error(`Error saving state to store ${storeName}, error: ${e}`);
      return { error: e };
    }

    return {};
  }

  async get(storeName: string, key: string): Promise<KeyValueType | string> {
    const result = await this.client.execute(`/state/${storeName}/${key}`);
    return result as KeyValueType;
  }

  async getBulk(storeName: string, keys: string[], options: StateGetBulkOptions = {}): Promise<KeyValueType[]> {
    const queryParams = createHTTPMetadataQueryParam(options.metadata);

    const result = await this.client.execute(`/state/${storeName}/bulk?${queryParams}`, {
      method: "POST",
      body: {
        keys,
        parallelism: options.parallelism ?? Settings.getDefaultStateGetBulkParallelism,
      },
    });

    return result as KeyValueType[];
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.client.execute(`/state/${storeName}/${key}`, {
      method: "DELETE",
    });
  }

  async transaction(
    storeName: string,
    operations: OperationType[] = [],
    metadata: IRequestMetadata | null = null,
  ): Promise<void> {
    await this.client.execute(`/state/${storeName}/transaction`, {
      method: "POST",
      body: {
        operations,
        metadata,
      },
    });
  }

  async query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType> {
    const result = await this.client.executeWithApiVersion("v1.0-alpha1", `/state/${storeName}/query`, {
      method: "POST",
      body: {
        ...query,
      },
    });

    return result as StateQueryResponseType;
  }
}

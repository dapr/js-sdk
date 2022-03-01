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

import HTTPClient from './HTTPClient';
import { KeyValuePairType } from '../../../types/KeyValuePair.type';
import { OperationType } from '../../../types/Operation.type';
import { IRequestMetadata } from '../../../types/RequestMetadata.type';
import IClientState from '../../../interfaces/Client/IClientState';
import { KeyValueType } from '../../../types/KeyValue.type';
import { StateQueryType } from '../../../types/state/StateQuery.type';
import { StateQueryResponseType } from '../../../types/state/StateQueryResponse.type';

// https://docs.dapr.io/reference/api/state_api/
export default class HTTPClientState implements IClientState {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async save(storeName: string, stateObjects: KeyValuePairType[]): Promise<void> {
    await this.client.execute(`/state/${storeName}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(stateObjects),
    });
  }

  async get(storeName: string, key: string): Promise<KeyValueType | string> {
    const result = await this.client.execute(`/state/${storeName}/${key}`);
    return result as KeyValueType;
  }

  async getBulk(storeName: string, keys: string[], parallelism = 10, metadata = ""): Promise<KeyValueType[]> {
    const result = await this.client.execute(`/state/${storeName}/bulk${metadata ? `?${metadata}` : ""}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        keys,
        parallelism // the number of parallel operations executed on the state store for a get operation
      })
    });

    return result as KeyValueType[];
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.client.execute(`/state/${storeName}/${key}`, {
      method: 'DELETE',
    });
  }

  async transaction(storeName: string, operations: OperationType[] = [], metadata: IRequestMetadata | null = null): Promise<void> {
    await this.client.execute(`/state/${storeName}/transaction`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operations,
        metadata
      })
    });
  }

  async query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType> {
    const result = await this.client.executeWithApiVersion("v1.0-alpha1", `/state/${storeName}/query`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...query
      })
    });

    return result as StateQueryResponseType;
  }
}

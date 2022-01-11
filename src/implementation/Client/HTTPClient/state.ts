import HTTPClient from './HTTPClient';
import { KeyValuePairType } from '../../../types/KeyValuePair.type';
import { OperationType } from '../../../types/Operation.type';
import { IRequestMetadata } from '../../../types/RequestMetadata.type';
import IClientState from '../../../interfaces/Client/IClientState';
import { KeyValueType } from '../../../types/KeyValue.type';
import { StateQueryType } from '../../../types/StateQuery.type';
import { StateQueryResponseType } from '../../../types/StateQueryResponse.type';

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

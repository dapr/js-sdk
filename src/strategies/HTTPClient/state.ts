import { KeyValuePairType } from '../../types/KeyValuePair.type';
import { OperationType } from '../../types/Operation.type';
import { IRequestMetadata } from '../../types/RequestMetadata.type';
import HTTPClient from './HTTPClient';
import IClientStateStrategy from '../IClientStateStrategy';
import HttpStatusCode from '../../enum/HttpStatusCode.enum';
import { KeyValueType } from '../../types/KeyValue.type';

// https://docs.dapr.io/reference/api/state_api/
export default class DaprClientState implements IClientStateStrategy {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async save(storeName: string, stateObjects: KeyValuePairType[]): Promise<void> {
    const res = await this.client.execute(`/state/${storeName}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(stateObjects),
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "STATE_STORE_PROBLEM",
          error_msg: "The state store is missing or misconfigured or malformed request"
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
        throw new Error(JSON.stringify({
          error: "STATE_STORE_COULD_NOT_SAVE",
          error_msg: "Failed to save the state"
        }));
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async get(storeName: string, key: string): Promise<KeyValueType | string> {
    const res = await this.client.execute(`/state/${storeName}/${key}`);

    switch (res.status) {
      case HttpStatusCode.OK: {
        try {
          const json = await res.json();
          return json;
        } catch (e) {
          const text = await res.text();
          return text;
        }
      }
      case HttpStatusCode.NO_CONTENT:
        return ""; // empty response, key not found
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "MALFORMED_REQUEST",
          error_msg: `The request was malformed and failed, is the state store missing or misconfigured?`
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify({
          error: "REQUEST_FAILED",
          error_msg: `The request failed with error: ${json}`
        }));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async getBulk(storeName: string, keys: string[], parallelism: number = 10, metadata: string = ""): Promise<KeyValueType[]> {
    const res = await this.client.execute(`/state/${storeName}/bulk${metadata ? `?${metadata}` : ""}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        keys,
        parallelism // the number of parallel operations executed on the state store for a get operation
      })
    });

    switch (res.status) {
      case HttpStatusCode.OK: {
        const json = await res.json();
        return json;
      }
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "MALFORMED_REQUEST",
          error_msg: `The request was malformed and failed, is the state store missing or misconfigured?`
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify({
          error: "REQUEST_FAILED",
          error_msg: `The request failed with error: ${json}`
        }));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async delete(storeName: string, key: string): Promise<void> {
    const res = await this.client.execute(`/state/${storeName}/${key}`, {
      method: 'DELETE',
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "STATE_STORE_PROBLEM",
          error_msg: "The state store is missing or misconfigured or malformed request"
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
        throw new Error(JSON.stringify({
          error: "STATE_STORE_COULD_NOT_DELETE",
          error_msg: "Failed to delete the state"
        }));
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async transaction(storeName: string, operations: OperationType[] = [], metadata: IRequestMetadata | null = null): Promise<void> {
    const res = await this.client.execute(`/state/${storeName}/transaction`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operations,
        metadata
      })
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "STATE_STORE_PROBLEM",
          error_msg: "The state store is missing or misconfigured or malformed request"
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
        throw new Error(JSON.stringify({
          error: "STATE_STORE_TRANSACTION_FAILED",
          error_msg: "Failed to execute the transaction"
        }));
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }
}

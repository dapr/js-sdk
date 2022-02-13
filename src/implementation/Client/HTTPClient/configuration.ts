import IClientConfiguration from '../../../interfaces/Client/IClientConfiguration';
import { KeyValueType } from '../../../types/KeyValue.type';
import { GetConfigurationResponse as GetConfigurationResponseResult } from '../../../types/configuration/GetConfigurationResponse';
import HTTPClient from './HTTPClient';
import { SubscribeConfigurationCallback } from '../../../types/configuration/SubscribeConfigurationCallback';

// https://docs.dapr.io/reference/api/configuration_api
export default class HTTPClientConfiguration implements IClientConfiguration {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async subscribe(storeName: string, cb: SubscribeConfigurationCallback): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async subscribeWithKeys(storeName: string, keys: string[], cb: SubscribeConfigurationCallback): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async subscribeWithMetadata(storeName: string, keys: string[], metadata: KeyValueType, cb: SubscribeConfigurationCallback): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async get(storeName: string, keys: string[], metadata?: KeyValueType): Promise<GetConfigurationResponseResult> {
    throw new Error('Method not implemented.');
  }
}

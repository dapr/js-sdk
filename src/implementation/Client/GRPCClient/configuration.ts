import GRPCClient from './GRPCClient';
import { GetConfigurationRequest, GetConfigurationResponse, SubscribeConfigurationRequest, SubscribeConfigurationResponse } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import IClientConfiguration from '../../../interfaces/Client/IClientConfiguration';
import { KeyValueType } from '../../../types/KeyValue.type';
import { GetConfigurationResponse as GetConfigurationResponseResult } from '../../../types/configuration/GetConfigurationResponse';
import { SubscribeConfigurationResponse as SubscribeConfigurationResponseResult } from '../../../types/configuration/SubscribeConfigurationResponse';
import { merge } from '../../../utils/Map.util';
import { SubscribeConfigurationCallback } from '../../../types/configuration/SubscribeConfigurationCallback';

// https://docs.dapr.io/reference/api/configuration_api
export default class GRPCClientConfiguration implements IClientConfiguration {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async get(storeName: string, keys: string[], metadata?: KeyValueType): Promise<GetConfigurationResponseResult> {
    const msg = new GetConfigurationRequest();
    msg.setStoreName(storeName);
    msg.setKeysList(keys.filter(i => i !== ""));

    if (metadata) {
      merge(msg.getMetadataMap(), metadata);
    }

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.getConfigurationAlpha1(msg, (err, res: GetConfigurationResponse) => {
        if (err) {
          return reject(err);
        }

        const wrapped: GetConfigurationResponseResult = {
          items: res.getItemsList().map((item) => ({
            key: item.getKey(),
            value: item.getValue(),
            version: item.getVersion(),
            metadata: item.getMetadataMap().toObject().reduce((result: object, [key, value]) => {
              // @ts-ignore
              result[key] = value;
              return result
            }, {}),
          }))
        }

        return resolve(wrapped);
      });
    });
  }

  async subscribe(storeName: string, cb: SubscribeConfigurationCallback): Promise<void> {
    return this._subscribe(storeName, cb)
  }

  async subscribeWithKeys(storeName: string, keys: string[], cb: SubscribeConfigurationCallback): Promise<void> {
    return this._subscribe(storeName, cb, keys)
  }

  async subscribeWithMetadata(storeName: string, keys: string[], metadata: KeyValueType, cb: SubscribeConfigurationCallback): Promise<void> {
    return this._subscribe(storeName, cb, keys)
  }

  async _subscribe(storeName: string, cb: SubscribeConfigurationCallback, keys?: string[], metadata?: KeyValueType): Promise<void> {
    const msg = new SubscribeConfigurationRequest();
    msg.setStoreName(storeName);

    if (keys && keys.length > 0) {
      msg.setKeysList(keys.filter(i => i !== ""));
    }

    if (metadata) {
      merge(msg.getMetadataMap(), metadata);
    }

    const client = this.client.getClient();

    // Open a stream. Note that this is a never-ending stream 
    // and will stay open as long as the client is open
    // we will thus create a set with our listeners so we don't 
    // break on multi listeners
    const stream = client.subscribeConfigurationAlpha1(msg);

    stream.on("data", async (data: SubscribeConfigurationResponse) => {
      const wrapped: SubscribeConfigurationResponseResult = {
        items: data.getItemsList().map((item) => ({
          key: item.getKey(),
          value: item.getValue(),
          version: item.getVersion(),
          metadata: item.getMetadataMap().toObject().reduce((result: object, [key, value]) => {
            // @ts-ignore
            result[key] = value;
            return result
          }, {}),
        }))
      }

      await cb(wrapped);
    });

    // Do not do anything on resolve
    // stream.on("end", resolve);
  }

}
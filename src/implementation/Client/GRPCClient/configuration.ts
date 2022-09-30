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
import * as grpc from "@grpc/grpc-js";
import {
  GetConfigurationRequest,
  GetConfigurationResponse,
  SubscribeConfigurationRequest,
  SubscribeConfigurationResponse,
  UnsubscribeConfigurationRequest,
  UnsubscribeConfigurationResponse,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientConfiguration from "../../../interfaces/Client/IClientConfiguration";
import { KeyValueType } from "../../../types/KeyValue.type";
import { GetConfigurationResponse as GetConfigurationResponseResult } from "../../../types/configuration/GetConfigurationResponse";
import { SubscribeConfigurationResponse as SubscribeConfigurationResponseResult } from "../../../types/configuration/SubscribeConfigurationResponse";
import { SubscribeConfigurationCallback } from "../../../types/configuration/SubscribeConfigurationCallback";
import { SubscribeConfigurationStream } from "../../../types/configuration/SubscribeConfigurationStream";

export default class GRPCClientConfiguration implements IClientConfiguration {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async get(storeName: string, keys: string[], metadataObj?: KeyValueType): Promise<GetConfigurationResponseResult> {
    const metadata = new grpc.Metadata();

    const msg = new GetConfigurationRequest();
    msg.setStoreName(storeName);

    if (keys && keys.length > 0) {
      msg.setKeysList(keys.filter((i) => i !== ""));
    }

    if (metadataObj) {
      for (const [key, value] of Object.entries(metadataObj)) {
        metadata.add(key, value);
      }
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.getConfigurationAlpha1(msg, metadata, (err, res: GetConfigurationResponse) => {
        if (err) {
          return reject(err);
        }

        const wrapped: GetConfigurationResponseResult = {
          items: res.getItemsList().map((item) => ({
            key: item.getKey(),
            value: item.getValue(),
            version: item.getVersion(),
            metadata: item
              .getMetadataMap()
              .toObject()
              .reduce((result: object, [key, value]) => {
                // @ts-ignore
                result[key] = value;
                return result;
              }, {}),
          })),
        };

        return resolve(wrapped);
      });
    });
  }

  async subscribe(storeName: string, cb: SubscribeConfigurationCallback): Promise<SubscribeConfigurationStream> {
    return this._subscribe(storeName, cb);
  }

  async subscribeWithKeys(
    storeName: string,
    keys: string[],
    cb: SubscribeConfigurationCallback,
  ): Promise<SubscribeConfigurationStream> {
    return this._subscribe(storeName, cb, keys);
  }

  async subscribeWithMetadata(
    storeName: string,
    keys: string[],
    metadata: KeyValueType,
    cb: SubscribeConfigurationCallback,
  ): Promise<SubscribeConfigurationStream> {
    return this._subscribe(storeName, cb, keys, metadata);
  }

  async _subscribe(
    storeName: string,
    cb: SubscribeConfigurationCallback,
    keys?: string[],
    metadataObj?: KeyValueType,
  ): Promise<SubscribeConfigurationStream> {
    const metadata = new grpc.Metadata();

    const msg = new SubscribeConfigurationRequest();
    msg.setStoreName(storeName);

    if (keys && keys.length > 0) {
      msg.setKeysList(keys.filter((i) => i !== ""));
    } else {
      msg.setKeysList([]);
    }

    if (metadataObj) {
      for (const [key, value] of Object.entries(metadataObj)) {
        metadata.add(key, value);
      }
    }

    const client = await this.client.getClient();

    // Open a stream. Note that this is a never-ending stream
    // and will stay open as long as the client is open
    // we will thus create a set with our listeners so we don't
    // break on multi listeners
    const stream = client.subscribeConfigurationAlpha1(msg, metadata);
    let streamId: string;

    stream.on("data", async (data: SubscribeConfigurationResponse) => {
      streamId = data.getId();

      const wrapped: SubscribeConfigurationResponseResult = {
        items: data.getItemsList().map((item) => ({
          key: item.getKey(),
          value: item.getValue(),
          version: item.getVersion(),
          metadata: item
            .getMetadataMap()
            .toObject()
            .reduce((result: object, [key, value]) => {
              // @ts-ignore
              result[key] = value;
              return result;
            }, {}),
        })),
      };

      await cb(wrapped);
    });

    return {
      stop: async () => {
        return new Promise((resolve, reject) => {
          const req = new UnsubscribeConfigurationRequest();
          req.setStoreName(storeName);
          req.setId(streamId);

          client.unsubscribeConfigurationAlpha1(req, (err, res: UnsubscribeConfigurationResponse) => {
            if (err || !res.getOk()) {
              return reject(res.getMessage());
            }

            // Clean up the node.js event emitter
            stream.removeAllListeners();
            stream.destroy();

            return resolve();
          });
        });
      },
    };
  }
}

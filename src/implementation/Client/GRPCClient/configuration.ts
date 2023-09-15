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
import { ConfigurationItem } from "../../../types/configuration/ConfigurationItem";
import { createConfigurationType } from "../../../utils/Client.util";
import { promisify } from "util";

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

    const getConfiguration = promisify<GetConfigurationRequest, grpc.Metadata, GetConfigurationResponse>(
      client.getConfiguration,
    );
    const res = await getConfiguration(msg, metadata);

    const configMap: { [k: string]: ConfigurationItem } = createConfigurationType(res.getItemsMap());

    return {
      items: configMap,
    };
    /*return new Promise((resolve, reject) => {
      client.getConfiguration(msg, metadata, (err, res: GetConfigurationResponse) => {
        if (err) {
          return reject(err);
        }

        const configMap: { [k: string]: ConfigurationItem } = createConfigurationType(res.getItemsMap());

        const result: SubscribeConfigurationResponseResult = {
          items: configMap,
        };

        return resolve(result);
      });
    });*/
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
    const stream = client.subscribeConfiguration(msg, metadata);
    let streamId: string;

    stream.on("data", async (data: SubscribeConfigurationResponse) => {
      streamId = data.getId();
      const items = data.getItemsMap();

      if (items.getLength() == 0) {
        return;
      }

      const configMap: { [k: string]: ConfigurationItem } = createConfigurationType(items);

      const wrapped: SubscribeConfigurationResponseResult = {
        items: configMap,
      };

      await cb(wrapped);
    });

    return {
      stop: async () => {
        const req = new UnsubscribeConfigurationRequest();
        req.setStoreName(storeName);
        req.setId(streamId);

        let res: UnsubscribeConfigurationResponse | undefined = undefined;
        let hasError = false;
        try {
          const unsubscribe = promisify<UnsubscribeConfigurationRequest, UnsubscribeConfigurationResponse>(
            client.unsubscribeConfiguration,
          );
          res = await unsubscribe(req);
          hasError = !res.getOk();
        } catch (e) {
          hasError = true;
        }

        if (res !== undefined && hasError) {
          throw res.getMessage();
        }

        // Clean up the node.js event emitter
        stream.removeAllListeners();
        stream.destroy();
      },
    };
    /*return {
      stop: async () => {
        return new Promise((resolve, reject) => {
          const req = new UnsubscribeConfigurationRequest();
          req.setStoreName(storeName);
          req.setId(streamId);

          const unsubscribe = promisify<UnsubscribeConfigurationRequest, UnsubscribeConfigurationResponse>(
            client.unsubscribeConfiguration,
          );
          const res = await unsubscribe(req);
          client.unsubscribeConfiguration(req, (err, res: UnsubscribeConfigurationResponse) => {
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
    };*/
  }
}

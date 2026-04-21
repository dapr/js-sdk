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

import { create } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import {
  GetConfigurationRequestSchema,
  SubscribeConfigurationRequestSchema,
  UnsubscribeConfigurationRequestSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientConfiguration from "../../../interfaces/Client/IClientConfiguration";
import { KeyValueType } from "../../../types/KeyValue.type";
import { GetConfigurationResponse as GetConfigurationResponseResult } from "../../../types/configuration/GetConfigurationResponse";
import { SubscribeConfigurationResponse as SubscribeConfigurationResponseResult } from "../../../types/configuration/SubscribeConfigurationResponse";
import { SubscribeConfigurationCallback } from "../../../types/configuration/SubscribeConfigurationCallback";
import { SubscribeConfigurationStream } from "../../../types/configuration/SubscribeConfigurationStream";
import { ConfigurationItem } from "../../../types/configuration/ConfigurationItem";
import { createConfigurationType } from "../../../utils/Client.util";

export default class GRPCClientConfiguration implements IClientConfiguration {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async get(storeName: string, keys: string[], metadataObj?: KeyValueType): Promise<GetConfigurationResponseResult> {
    const client = await this.client.getClient();

    const res = await client.getConfiguration(create(GetConfigurationRequestSchema, {
      storeName,
      keys: keys ? keys.filter((i) => i !== "") : [],
      metadata: metadataObj ?? {},
    }));

    const configMap: { [k: string]: ConfigurationItem } = createConfigurationType(res.items);

    return { items: configMap };
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
    const client = await this.client.getClient();

    const msg = create(SubscribeConfigurationRequestSchema, {
      storeName,
      keys: keys ? keys.filter((i) => i !== "") : [],
      metadata: metadataObj ?? {},
    });

    const abortController = new AbortController();
    let streamId = "";

    // Start consuming the stream in the background
    (async () => {
      try {
        const stream = client.subscribeConfiguration(msg, { signal: abortController.signal });
        for await (const data of stream) {
          streamId = data.id;

          if (Object.keys(data.items).length === 0) {
            continue;
          }

          const configMap: { [k: string]: ConfigurationItem } = createConfigurationType(data.items);
          await cb({ items: configMap });
        }
      } catch (e: any) {
        // Ignore abort errors; they are expected when stop() is called
        if (!abortController.signal.aborted) {
          // Unexpected error - swallow silently
        }
      }
    })();

    return {
      stop: async () => {
        abortController.abort();

        // Also explicitly unsubscribe if we have a streamId
        if (streamId) {
          try {
            const unsubClient = await this.client.getClient(false);
            await unsubClient.unsubscribeConfiguration(create(UnsubscribeConfigurationRequestSchema, {
              storeName,
              id: streamId,
            }));
          } catch (_e) {
            // Ignore errors during cleanup
          }
        }
      },
    };
  }
}

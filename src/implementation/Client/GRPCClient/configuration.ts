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

/**
 * gRPC-based configuration building block implementation.
 *
 * Configuration allows reading and subscribing to configuration items from external stores.
 * This implementation uses gRPC for efficient streaming and subscription management.
 *
 * Supports configuration stores like Consul, Kubernetes ConfigMaps, AWS Parameter Store, etc.
 * Subscriptions enable reactive updates when configuration changes in the backing store.
 *
 * @implements {IClientConfiguration}
 * @see {@link https://docs.dapr.io/reference/api/configuration_api/} Dapr Configuration API
 * @see {@link DaprClient.configuration} for unified API
 *
 * @internal
 */
export default class GRPCClientConfiguration implements IClientConfiguration {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC configuration building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Retrieves configuration items from a configuration store.
   *
   * @param storeName - Name of the configuration store
   * @param keys - Configuration keys to retrieve (empty list = all keys)
   * @param metadataObj - Optional store-specific metadata
   *
   * @returns Promise resolving to retrieved configuration items
   *
   * @throws Rejects if store does not exist or retrieval fails
   *
   * @example
   * ```typescript
   * const config = await client.configuration.get("myconfig", ["db-host", "db-port"]);
   * console.log(config.items["db-host"]); // { key: "db-host", value: "localhost", version: "1" }
   * ```
   *
   * @see {@link https://docs.dapr.io/reference/api/configuration_api/#getting-configuration}
   */
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

  /**
   * Subscribes to all configuration items in a store.
   *
   * Invokes the callback immediately with current values, then again whenever values change.
   * Returns a subscription handle to stop listening.
   *
   * @param storeName - Name of the configuration store
   * @param cb - Callback invoked on subscription and configuration changes
   *
   * @returns Promise resolving to a subscription handle with stop() method
   *
   * @throws Rejects if store does not exist or subscription fails
   *
   * @example
   * ```typescript
   * const subscription = await client.configuration.subscribe("myconfig", (items) => {
   *   console.log("Configuration updated:", items);
   * });
   * // ... later ...
   * await subscription.stop();
   * ```
   *
   * @see {@link subscribeWithKeys}
   * @see {@link subscribeWithMetadata}
   */
  async subscribe(storeName: string, cb: SubscribeConfigurationCallback): Promise<SubscribeConfigurationStream> {
    return this._subscribe(storeName, cb);
  }

  /**
   * Subscribes to specific configuration keys.
   *
   * @param storeName - Name of the configuration store
   * @param keys - Configuration keys to subscribe to
   * @param cb - Callback invoked on subscription and when keys change
   *
   * @returns Promise resolving to a subscription handle with stop() method
   *
   * @throws Rejects if store does not exist or subscription fails
   *
   * @example
   * ```typescript
   * const subscription = await client.configuration.subscribeWithKeys(
   *   "myconfig",
   *   ["db-host", "db-port"],
   *   (items) => console.log("DB config changed:", items)
   * );
   * ```
   *
   * @see {@link subscribe}
   * @see {@link subscribeWithMetadata}
   */
  async subscribeWithKeys(
    storeName: string,
    keys: string[],
    cb: SubscribeConfigurationCallback,
  ): Promise<SubscribeConfigurationStream> {
    return this._subscribe(storeName, cb, keys);
  }

  /**
   * Subscribes to configuration with store-specific metadata.
   *
   * @param storeName - Name of the configuration store
   * @param keys - Configuration keys to subscribe to
   * @param metadata - Store-specific metadata for the subscription
   * @param cb - Callback invoked on subscription and when keys change
   *
   * @returns Promise resolving to a subscription handle with stop() method
   *
   * @throws Rejects if store does not exist or subscription fails
   *
   * @see {@link subscribe}
   * @see {@link subscribeWithKeys}
   */
  async subscribeWithMetadata(
    storeName: string,
    keys: string[],
    metadata: KeyValueType,
    cb: SubscribeConfigurationCallback,
  ): Promise<SubscribeConfigurationStream> {
    return this._subscribe(storeName, cb, keys, metadata);
  }

  /**
   * Internal implementation for all subscribe methods.
   *
   * Establishes a gRPC streaming subscription with automatic cleanup.
   * Handles stream lifecycle (abort on stop) and unsubscribe messages.
   *
   * @private
   * @internal
   */
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

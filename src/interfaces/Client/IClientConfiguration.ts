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

import { GetConfigurationResponse } from "../../types/configuration/GetConfigurationResponse";
import { SubscribeConfigurationCallback } from "../../types/configuration/SubscribeConfigurationCallback";
import { SubscribeConfigurationStream } from "../../types/configuration/SubscribeConfigurationStream";
import { KeyValueType } from "../../types/KeyValue.type";

/**
 * Dapr client interface for Configuration management.
 * Provides methods to retrieve application configuration from Dapr configuration stores
 * with support for subscriptions to configuration changes.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/configuration/
 */
export default interface IClientConfiguration {
  /**
   * Retrieves configuration items from the store.
   *
   * @param storeName - The name of the configuration store component.
   * @param keys - Optional array of specific configuration keys to retrieve.
   * If not provided, all keys are returned based on store semantics.
   * @param metadata - Optional store-specific metadata for the request.
   * @returns A promise that resolves to a configuration response containing key-value pairs.
   *
   * @example
   * ```ts
   * const config = await client.configuration.get(
   *   "myConfigStore",
   *   ["db.host", "db.port"]
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/configuration_api/
   */
  get(storeName: string, keys?: string[], metadata?: KeyValueType): Promise<GetConfigurationResponse>;

  /**
   * Subscribes to all configuration changes in the store.
   * Calls the callback whenever any configuration item is updated.
   *
   * @param storeName - The name of the configuration store component.
   * @param cb - Callback function invoked on configuration changes.
   * @returns A promise that resolves to a subscription stream for managing the subscription.
   *
   * @see https://docs.dapr.io/reference/api/configuration_api/
   */
  subscribe(storeName: string, cb: SubscribeConfigurationCallback): Promise<SubscribeConfigurationStream>;

  /**
   * Subscribes to changes for specific configuration keys.
   *
   * @param storeName - The name of the configuration store component.
   * @param keys - Array of configuration keys to watch for changes.
   * @param cb - Callback function invoked when subscribed keys are updated.
   * @returns A promise that resolves to a subscription stream for managing the subscription.
   *
   * @example
   * ```ts
   * const stream = await client.configuration.subscribeWithKeys(
   *   "myConfigStore",
   *   ["db.host", "db.port"],
   *   (changes) => console.log("Config updated:", changes)
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/configuration_api/
   */
  subscribeWithKeys(
    storeName: string,
    keys: string[],
    cb: SubscribeConfigurationCallback,
  ): Promise<SubscribeConfigurationStream>;

  /**
   * Subscribes to configuration changes with optional metadata.
   * Allows specifying store-specific metadata along with keys to monitor.
   *
   * @param storeName - The name of the configuration store component.
   * @param keys - Array of configuration keys to watch for changes.
   * @param metadata - Store-specific metadata to pass with the subscription request.
   * @param cb - Callback function invoked when subscribed keys are updated.
   * @returns A promise that resolves to a subscription stream for managing the subscription.
   *
   * @see https://docs.dapr.io/reference/api/configuration_api/
   */
  subscribeWithMetadata(
    storeName: string,
    keys: string[],
    metadata: KeyValueType,
    cb: SubscribeConfigurationCallback,
  ): Promise<SubscribeConfigurationStream>;
}

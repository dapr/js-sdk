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

import { DaprClientOptions } from "../../types/DaprClientOptions";

/**
 * Base Dapr client interface for managing client lifecycle and initialization.
 * Handles connection management to the Dapr sidecar and provides options configuration.
 */
export default interface IClient {
  /**
   * Configuration options for the Dapr client.
   * Contains settings for sidecar address, port, protocol, and other connection parameters.
   */
  options: DaprClientOptions;

  /**
   * Retrieves the underlying client instance.
   *
   * @param requiresInitialization - If true, ensures the client is initialized before returning.
   * Defaults to false.
   * @returns A promise that resolves to the internal client instance.
   *
   * @see https://docs.dapr.io/reference/api/
   */
  getClient(requiresInitialization?: boolean): Promise<any>;

  /**
   * Sets the initialization state of the client.
   *
   * @param isInitialized - Boolean flag indicating whether the client is initialized.
   * Used internally to track connection state to the Dapr sidecar.
   */
  setIsInitialized(isInitialized: boolean): void;

  /**
   * Checks if the client is initialized and connected to the sidecar.
   *
   * @returns True if the client has completed initialization; false otherwise.
   */
  getIsInitialized(): boolean;

  /**
   * Stops the client and closes the connection to the Dapr sidecar.
   *
   * @returns A promise that resolves when the client has been stopped.
   *
   * @see https://docs.dapr.io/concepts/dapr-services/sidecar/
   */
  stop(): Promise<void>;

  /**
   * Starts the client and establishes a connection to the Dapr sidecar.
   *
   * @returns A promise that resolves when the client has been initialized and connected.
   *
   * @see https://docs.dapr.io/concepts/dapr-services/sidecar/
   */
  start(): Promise<void>;
}

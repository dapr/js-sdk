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

import { GetMetadataResponse } from "../../types/metadata/GetMetadataResponse";

/**
 * Dapr client interface for retrieving and updating runtime metadata.
 * Provides access to Dapr runtime configuration and status information.
 *
 * @see https://docs.dapr.io/reference/api/
 */
export default interface IClientMetadata {
  /**
   * Retrieves metadata about the Dapr sidecar runtime.
   * Includes information about components, configuration, and runtime status.
   *
   * @returns A promise that resolves to metadata response containing runtime information.
   *
   * @see https://docs.dapr.io/reference/api/
   */
  get(): Promise<GetMetadataResponse>;

  /**
   * Sets a metadata value on the Dapr runtime.
   *
   * @param key - The metadata key to set.
   * @param value - The value to set for the key.
   * @returns A promise that resolves to true if the operation succeeds; false otherwise.
   *
   * @see https://docs.dapr.io/reference/api/
   */
  set(key: string, value: string): Promise<boolean>;
}

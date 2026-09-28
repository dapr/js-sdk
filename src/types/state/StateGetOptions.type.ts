/*
Copyright 2023 The Dapr Authors
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

import { IRequestMetadata } from "../RequestMetadata.type";
import { IStateOptions } from "./StateOptions.type";

/**
 * Options for state retrieval operations.
 *
 * Specifies consistency requirements and optional metadata when reading state values
 * from a Dapr state store.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * // Get state with strong consistency
 * const options: StateGetOptions = {
 *   consistency: StateConsistencyEnum.Strong,
 *   metadata: { "timeout": "5000" }
 * };
 * const value = await client.state.get("my-store", "key", options);
 *
 * // Get state with eventual consistency
 * const eventualOptions: StateGetOptions = {
 *   consistency: StateConsistencyEnum.Eventual,
 *   metadata: {}
 * };
 * ```
 */
export type StateGetOptions = Pick<IStateOptions, "consistency"> & {
  /**
   * Component-specific metadata to pass to the state store during retrieval.
   * The exact metadata accepted depends on the configured state store component
   * (e.g., Redis, CosmosDB, PostgreSQL, etc.).
   *
   * @example
   * ```typescript
   * {
   *   "timeout": "5000",
   *   "region": "us-east-1"
   * }
   * ```
   */
  metadata: IRequestMetadata;
};

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
import { KeyValuePairType } from "../KeyValuePair.type";

/**
 * Options for state delete operations.
 *
 * Specifies consistency, concurrency, and ETag requirements when deleting state.
 * The ETag field enables optimistic concurrency control—the delete only succeeds
 * if the stored ETag matches, preventing deletions of unexpectedly-modified state.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * // Delete with strong consistency and first-write-wins
 * const options: StateDeleteOptions = {
 *   consistency: StateConsistencyEnum.Strong,
 *   concurrency: StateConcurrencyEnum.FirstWrite,
 *   etag: "v5",
 *   metadata: {}
 * };
 * await client.state.delete("my-store", "key-123", options);
 *
 * // Delete with eventual consistency and last-write-wins
 * const simpleDelete: StateDeleteOptions = {
 *   consistency: StateConsistencyEnum.Eventual,
 *   concurrency: StateConcurrencyEnum.LastWrite,
 *   etag: undefined,
 *   metadata: {}
 * };
 * ```
 */
export type StateDeleteOptions = IStateOptions & {
  /**
   * Component-specific metadata to pass to the state store during delete operations.
   * Can include delete-specific configuration or hints for the store component.
   */
  metadata: IRequestMetadata;

  /**
   * The ETag (entity tag) for optimistic concurrency control.
   * When provided, the delete only succeeds if the current state's ETag matches this value.
   * Helps prevent accidental deletion of state that was modified by another client.
   * Can be undefined for last-write-wins semantics without concurrency checks.
   *
   * @example
   * ```typescript
   * etag: "v5"  // Delete only if current version is v5
   * ```
   */
  etag: KeyValuePairType["etag"];
};

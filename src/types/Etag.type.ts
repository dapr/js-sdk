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

/**
 * Represents an entity tag (ETag) for optimistic concurrency control in state operations.
 *
 * ETags are used to prevent lost updates when multiple clients attempt to modify the same state.
 * When retrieving state, the ETag identifies the specific version. When updating state, providing
 * an ETag ensures the update only succeeds if the state version matches.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * // Retrieve state with ETag
 * const state = await client.state.get("order-service", "order-123");
 * // state.etag contains the current version identifier
 *
 * // Update state with ETag for concurrency control
 * await client.state.save("order-service", [{
 *   key: "order-123",
 *   value: updatedOrder,
 *   etag: state.etag  // Ensures this version is being updated
 * }]);
 * ```
 */
export type IEtag = {
  /**
   * The version identifier for the state value.
   * This opaque string uniquely identifies a specific version of state.
   * Use this value in concurrent updates to ensure the expected version is being modified.
   */
  value: string;
};

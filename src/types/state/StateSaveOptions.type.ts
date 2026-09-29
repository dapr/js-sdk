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

import { KeyValueType } from "../KeyValue.type";

/**
 * Options for state save/upsert operations.
 *
 * Specifies optional metadata to pass to the state store when saving or updating state values.
 * Metadata can include component-specific options like TTL, partitioning hints, or other store settings.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 * @see {@link https://dapr.io/docs/reference/components-reference/state-stores/ | State Store Components}
 *
 * @example
 * ```typescript
 * // Save state with TTL metadata
 * await client.state.save("my-store", [{
 *   key: "session-123",
 *   value: { data: "session content" },
 * }], {
 *   metadata: { "ttlInSeconds": "3600" }
 * });
 *
 * // Save with component-specific metadata
 * const saveOptions: StateSaveOptions = {
 *   metadata: {
 *     "partitionKey": "user-456",
 *     "consistencyLevel": "strong"
 *   }
 * };
 * await client.state.save("cosmosdb-store", [request], saveOptions);
 * ```
 */
export type StateSaveOptions = {
  /**
   * Component-specific metadata to pass to the state store during save operations.
   * The metadata accepted depends on the configured state store component
   * (e.g., Redis accepts ttlInSeconds, CosmosDB accepts partitionKey, etc.).
   *
   * Common metadata keys:
   * - `ttlInSeconds`: Set time-to-live for the state (if supported by store)
   * - `partitionKey`: Hint for partitioning (CosmosDB, etc.)
   * - `consistencyLevel`: Specify consistency for this operation
   * - Component-specific configuration options
   *
   * @example
   * ```typescript
   * {
   *   "ttlInSeconds": "86400",
   *   "partitionKey": "user-123"
   * }
   * ```
   */
  metadata?: KeyValueType;
};

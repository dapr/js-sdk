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

import { IEtag } from "./Etag.type";
import { IRequestMetadata } from "./RequestMetadata.type";
import { IStateOptions } from "./state/StateOptions.type";

/**
 * Represents a state operation request for transactional state management.
 *
 * Used in state transactions to specify the key, value, ETag, and operation options
 * for create, update, or delete operations. The ETag field enables optimistic concurrency control.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * // Create a new state entry
 * const createRequest: IRequest = {
 *   key: "inventory-item-123",
 *   value: { quantity: 50, lastUpdated: "2023-01-15" }
 * };
 *
 * // Update existing state with ETag concurrency control
 * const updateRequest: IRequest = {
 *   key: "inventory-item-123",
 *   value: { quantity: 45, lastUpdated: "2023-01-15T10:30:00Z" },
 *   etag: { value: "v2" },
 *   options: {
 *     consistency: "strong",
 *     concurrency: "first-write"
 *   }
 * };
 *
 * // Delete state
 * const deleteRequest: IRequest = {
 *   key: "inventory-item-123",
 *   etag: { value: "v2" }
 * };
 * ```
 */
export type IRequest = {
  /**
   * The unique identifier for the state entry within the store.
   * Must be provided for all operations (create, update, delete).
   * State keys are unique per state store.
   */
  key: string;

  /**
   * The value to store or update. Can be any JSON-serializable data.
   * Omit for delete operations.
   *
   * @example
   * ```typescript
   * // Simple value
   * value: "string-data"
   *
   * // Object
   * value: { name: "Alice", age: 30, verified: true }
   *
   * // Array
   * value: [1, 2, 3, 4, 5]
   * ```
   */
  value?: any;

  /**
   * The ETag (entity tag) for optimistic concurrency control.
   * When provided, the update/delete only succeeds if the stored ETag matches.
   * Prevents lost updates when multiple clients modify the same key.
   * Omit for "last-write-wins" semantics without concurrency checks.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | State Management - Concurrency}
   */
  etag?: IEtag;

  /**
   * Request-level metadata passed to the state store component.
   * Allows specifying request-specific behavior or component-specific options.
   */
  metadata?: IRequestMetadata;

  /**
   * State operation options controlling consistency model, concurrency semantics,
   * and state store-specific behaviors. Overrides defaults for this specific operation.
   */
  options?: IStateOptions;
};

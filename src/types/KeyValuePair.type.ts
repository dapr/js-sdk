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

import { KeyValueType } from "./KeyValue.type";
import { IStateOptions } from "./state/StateOptions.type";

/**
 * Represents a key-value pair returned from bulk state retrieval operations.
 *
 * Used as the response format when fetching multiple state entries from a state store.
 * Includes the retrieved value, its ETag for concurrency control, associated metadata,
 * and operation options used when storing the value.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * // Retrieved state pairs from bulk get
 * const pairs: KeyValuePairType[] = await client.state.getBulk("order-store", [
 *   "order-123", "order-124", "order-125"
 * ]);
 *
 * // Process retrieved pairs
 * pairs.forEach(pair => {
 *   console.log(`Key: ${pair.key}`);
 *   console.log(`Value:`, pair.value);
 *   console.log(`ETag: ${pair.etag}`);
 *   if (pair.metadata) {
 *     console.log("Metadata:", pair.metadata);
 *   }
 * });
 *
 * // Update a retrieved pair with original ETag
 * await client.state.save("order-store", [{
 *   key: pairs[0].key,
 *   value: { ...pairs[0].value, status: "shipped" },
 *   etag: { value: pairs[0].etag }
 * }]);
 * ```
 */
export type KeyValuePairType = {
  /**
   * The unique key that identifies this state entry within the store.
   */
  key: string;

  /**
   * The stored value associated with the key.
   * Can be any JSON-serializable data: objects, arrays, strings, numbers, etc.
   */
  value: any;

  /**
   * The ETag (entity tag) of the current state value.
   * Used for optimistic concurrency control when updating the state.
   * Can be passed as the etag in future update/delete operations to ensure
   * the value hasn't changed since retrieval.
   */
  etag?: string;

  /**
   * Metadata about the retrieved state entry.
   * Component-specific metadata that was associated with the stored value,
   * such as TTL information, partition keys, or custom attributes.
   */
  metadata?: KeyValueType;

  /**
   * State operation options used when this value was originally stored.
   * Reflects the consistency model and concurrency semantics configured for this entry.
   */
  options?: IStateOptions;
};

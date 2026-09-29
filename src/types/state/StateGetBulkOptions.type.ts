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
 * Options for bulk state retrieval operations.
 *
 * Controls parallelism and metadata when fetching multiple state entries concurrently.
 * Parallelism limits prevent overwhelming the underlying state store during high-volume reads.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * // Fetch multiple orders with controlled parallelism
 * const options: StateGetBulkOptions = {
 *   parallelism: 5,  // Fetch max 5 at a time
 *   metadata: { "consistency": "strong" }
 * };
 * const orders = await client.state.getBulk("order-store", [
 *   "order-100", "order-101", "order-102", "order-103", "order-104"
 * ], options);
 *
 * // Default parallelism
 * const manyOrders = await client.state.getBulk("order-store", orderIds);
 * ```
 */
export type StateGetBulkOptions = {
  /**
   * Maximum number of state entries to retrieve in parallel.
   * Limits concurrent requests to the state store to prevent overload.
   * If you need to fetch N items with parallelism P, they'll be fetched in ceil(N/P) batches.
   * Defaults to 10 if not specified.
   *
   * Higher values: Faster retrieval but more load on the store.
   * Lower values: Slower retrieval but gentler on the store.
   *
   * @example
   * ```typescript
   * parallelism: 5   // Fetch 5 items concurrently at most
   * parallelism: 20  // Fetch 20 items concurrently (higher throughput)
   * parallelism: 1   // Fetch items sequentially (minimal store load)
   * ```
   */
  parallelism?: number;

  /**
   * Component-specific metadata to pass to the state store during bulk retrieval.
   * Can include options for controlling retrieval behavior per the store component.
   *
   * @example
   * ```typescript
   * {
   *   "consistency": "strong",
   *   "timeout": "5000"
   * }
   * ```
   */
  metadata?: KeyValueType;
};

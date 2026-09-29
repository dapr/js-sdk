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

import { IRequest } from "./Request.type";

/**
 * Represents a single operation in a batch state operation.
 *
 * Used when performing transactional state modifications where multiple operations
 * (create, update, delete) are applied atomically as a single transaction.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
 *
 * @example
 * ```typescript
 * const operations: OperationType[] = [
 *   {
 *     operation: "upsert",
 *     request: {
 *       key: "order-123",
 *       value: { status: "shipped", trackingId: "TRK123" }
 *     }
 *   },
 *   {
 *     operation: "delete",
 *     request: { key: "temp-order-456" }
 *   }
 * ];
 * await client.state.transact("order-service", operations);
 * ```
 */
export type OperationType = {
  /**
   * The operation type to perform.
   * Valid values: "upsert" (create or update), "delete" (remove state), "upsert", etc.
   * Exact valid operations depend on the state store implementation.
   */
  operation: string;

  /**
   * The request details for this operation, including key, value, ETag, and options.
   * For delete operations, typically only the key and etag are used.
   */
  request: IRequest;
};

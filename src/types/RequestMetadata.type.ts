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
 * Metadata attached to a state operation request.
 *
 * A flexible key-value map for passing request-specific metadata to the state store component.
 * The exact metadata keys and values accepted depend on the specific state store implementation
 * being used (e.g., Redis, CosmosDB, PostgreSQL, etc.).
 *
 * @see {@link https://dapr.io/docs/reference/components-reference/state-stores/ | Dapr State Store Components}
 *
 * @example
 * ```typescript
 * // Metadata for TTL (Time To Live)
 * const metadata: IRequestMetadata = {
 *   "ttlInSeconds": "3600"  // Expire after 1 hour
 * };
 *
 * // Component-specific metadata
 * const cosmosMetadata: IRequestMetadata = {
 *   "partitionKey": "tenant-123",
 *   "consistencyLevel": "eventual"
 * };
 *
 * // Use in state request
 * await client.state.save("my-store", [{
 *   key: "session-456",
 *   value: sessionData,
 *   metadata: cosmosMetadata
 * }]);
 * ```
 */
export type IRequestMetadata = {
  /**
   * Metadata value as a string. The interpretation depends on the state store component.
   * Common patterns: component-specific options, TTL values, routing hints, etc.
   */
  [key: string]: string;
};

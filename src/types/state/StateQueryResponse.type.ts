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
 * Response from a state query operation.
 *
 * Contains query results with optional pagination token for fetching additional results.
 * Supports state stores that implement querying capabilities (e.g., CosmosDB, MongoDB, PostgreSQL).
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/howto-state-store-query/ | Dapr State Store Query}
 *
 * @example
 * ```typescript
 * // Query orders with status = 'pending'
 * const query = { query: "SELECT * FROM c WHERE c.status = 'pending'" };
 * const response = await client.state.query("order-store", query);
 *
 * console.log(`Found ${response.results.length} results`);
 * response.results.forEach(result => {
 *   console.log(`Key: ${result.key}, Data:`, result.data);
 * });
 *
 * // Handle pagination
 * if (response.token) {
 *   const nextPage = await client.state.query("order-store", query, { pageToken: response.token });
 * }
 * ```
 */
export type StateQueryResponseType = {
  /**
   * Array of query result entries.
   * Each entry contains a key, data, optional ETag, and optional error.
   */
  results: StateQueryResponseResult[];

  /**
   * Continuation token for pagination.
   * If present, indicates there are more results. Use this token in the next query
   * to fetch the subsequent page of results.
   * Omit if there are no more results to fetch.
   *
   * @example
   * ```typescript
   * if (response.token) {
   *   const nextResponse = await client.state.query(storeName, query, {
   *     pageToken: response.token
   *   });
   * }
   * ```
   */
  token?: string;
};

/**
 * Individual result from a state query operation.
 *
 * Contains the state key, queried data, optional version identifier (ETag),
 * and optional error if this particular result failed.
 */
type StateQueryResponseResult = {
  /**
   * The state key that matched the query.
   */
  key: string;

  /**
   * The state value data retrieved by the query.
   * Typically a JSON object or other serialized data.
   */
  data: any;

  /**
   * The ETag (entity tag) of the returned state entry.
   * Can be used in subsequent update/delete operations for concurrency control.
   * May be undefined if the state store doesn't support ETags.
   */
  etag?: string;

  /**
   * Optional error message if this result failed to retrieve.
   * If present, indicates that `data` may be incomplete or invalid.
   * Omit if retrieval succeeded.
   */
  error?: string;
};

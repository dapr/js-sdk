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

import { Enumerable } from "../common/Enumerable.type";

/**
 * Query specification for state store querying.
 *
 * Supports querying state entries using filters, sorting, and pagination.
 * Availability depends on the state store component—only stores with querying capabilities
 * (e.g., CosmosDB, MongoDB, PostgreSQL) support these operations.
 *
 * The query uses a structured filter/sort/pagination model rather than direct SQL or
 * query language syntax, providing a uniform interface across different stores.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/howto-state-store-query/ | Dapr State Store Query}
 *
 * @example
 * ```typescript
 * // Query orders where status='pending', sorted by date, limit 10
 * const query: StateQueryType = {
 *   filter: {
 *     EQ: { "status": "pending" }
 *   },
 *   sort: [{ key: "date", order: "DESC" }],
 *   page: { limit: 10 }
 * };
 * const response = await client.state.query("order-store", query);
 *
 * // Complex filter: orders with status='shipped' AND amount > 100
 * const complexQuery: StateQueryType = {
 *   filter: {
 *     AND: [
 *       { EQ: { "status": "shipped" } },
 *       { GT: { "amount": 100 } }  // If supported by store
 *     ]
 *   },
 *   sort: [],
 *   page: { limit: 50, token: nextPageToken }
 * };
 * ```
 */
export type StateQueryType = {
  /**
   * Filter criteria for matching state entries.
   * Supports logical operations (AND, OR) and comparison operations (EQ, IN).
   * Nested filter structures enable complex filtering logic.
   */
  filter: StateQueryFilter;

  /**
   * Sort specification for result ordering.
   * Can sort by multiple fields with ASC (ascending) or DESC (descending) order.
   * If empty, results are in undefined order (store-dependent).
   *
   * @example
   * ```typescript
   * sort: [
   *   { key: "date", order: "DESC" },  // Primary sort: by date descending
   *   { key: "name", order: "ASC" }     // Secondary sort: by name ascending
   * ]
   * ```
   */
  sort: StateQuerySort[];

  /**
   * Pagination parameters for controlling result set size and position.
   * Enables fetching large result sets in manageable pages.
   */
  page: StateQueryPagination;
};

/**
 * Sort specification for a single field in query results.
 */
type StateQuerySort = {
  /**
   * The state entry property/field name to sort by.
   * Must be a property that exists in the stored state objects.
   *
   * @example
   * ```typescript
   * key: "date"
   * key: "priority"
   * key: "createdAt"
   * ```
   */
  key: string;

  /**
   * Sort direction: ascending (ASC) or descending (DESC).
   * Defaults to ASC if not specified.
   */
  order?: "ASC" | "DESC";
};

/**
 * Pagination parameters for query result limiting.
 */
type StateQueryPagination = {
  /**
   * Maximum number of results to return in this page.
   * Actual returned results may be less if there aren't enough matching entries.
   *
   * @example
   * ```typescript
   * limit: 10   // Return at most 10 results
   * limit: 100  // Return at most 100 results
   * ```
   */
  limit: number;

  /**
   * Continuation token for fetching subsequent pages.
   * Obtained from the previous query response when more results are available.
   * Omit for the first page.
   *
   * @example
   * ```typescript
   * // First query
   * const response1 = await client.state.query("store", query);
   *
   * // Fetch next page if available
   * if (response1.token) {
   *   const response2 = await client.state.query("store", {
   *     ...query,
   *     page: { limit: 10, token: response1.token }
   *   });
   * }
   * ```
   */
  token?: string;
};

/**
 * Filter specification for state query matching.
 *
 * Supports logical operations (AND, OR) and comparison operations (EQ, IN).
 * Filters can be nested to express complex query conditions.
 */
type StateQueryFilter = {
  /**
   * Logical AND: ALL conditions must match.
   * Array of filter conditions; all must be true for a match.
   */
  AND?: Enumerable<StateQueryFilterInput>;

  /**
   * Logical OR: AT LEAST ONE condition must match.
   * Array of filter conditions; at least one must be true for a match.
   */
  OR?: Enumerable<StateQueryFilterInput>;

  /**
   * Equality comparison: field equals value.
   * Matches entries where the field exactly equals the specified value.
   */
  EQ?: Enumerable<StateQueryFilterInput>;

  /**
   * Membership test: field is in set of values.
   * Matches entries where the field value is one of the specified values.
   */
  IN?: Enumerable<StateQueryFilterInput>;
};

/**
 * Individual filter condition or nested filter structure.
 *
 * Can be either a leaf condition (property: value pair) or a nested logical expression.
 */
type StateQueryFilterInput = {
  /**
   * Nested AND condition: all nested conditions must match.
   */
  AND?: Enumerable<StateQueryFilterInput>;

  /**
   * Nested OR condition: at least one nested condition must match.
   */
  OR?: Enumerable<StateQueryFilterInput>;

  /**
   * Nested EQ condition: nested field must equal value.
   */
  EQ?: Enumerable<StateQueryFilterInput>;

  /**
   * Nested IN condition: nested field must be in set.
   */
  IN?: Enumerable<StateQueryFilterInput>;

  /**
   * Property equality condition.
   * Matches entries where the property (key) equals the value.
   * The key can be any state entry property (e.g., "status", "amount", "email").
   *
   * @example
   * ```typescript
   * { "status": "pending" }           // status must equal "pending"
   * { "amount": 100 }                 // amount must equal 100
   * { "email": "user@example.com" }   // email must equal user@example.com
   * ```
   */
  [key: string]: any;
};

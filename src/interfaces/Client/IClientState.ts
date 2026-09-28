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

import { OperationType } from "../../types/Operation.type";
import { IRequestMetadata } from "../../types/RequestMetadata.type";
import { KeyValuePairType } from "../../types/KeyValuePair.type";
import { KeyValueType } from "../../types/KeyValue.type";
import { StateQueryType } from "../../types/state/StateQuery.type";
import { StateQueryResponseType } from "../../types/state/StateQueryResponse.type";
import { StateGetBulkOptions } from "../../types/state/StateGetBulkOptions.type";
import { StateSaveResponseType } from "../../types/state/StateSaveResponseType";
import { StateSaveOptions } from "../../types/state/StateSaveOptions.type";
import { StateDeleteOptions } from "../../types/state/StateDeleteOptions.type";
import { StateGetOptions } from "../../types/state/StateGetOptions.type";

/**
 * Dapr client interface for State management.
 * Provides methods to store, retrieve, and manage application state using Dapr state management.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/state-management/
 */
export default interface IClientState {
  /**
   * Saves one or more state values to the state store.
   * Each state object is stored as a key-value pair with optional metadata.
   *
   * @param storeName - The name of the state store component.
   * @param stateObjects - Array of key-value pairs to save.
   * Each object must have a key property and a value property.
   * @param options - Optional save options (concurrency, consistency, etc.).
   * @returns A promise that resolves to a response indicating save results and any errors.
   *
   * @example
   * ```ts
   * await client.state.save(
   *   "myStateStore",
   *   [
   *     { key: "user:123", value: { name: "Alice", age: 30 } },
   *     { key: "user:124", value: { name: "Bob", age: 25 } }
   *   ],
   *   { consistency: "strong" }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/state_api/
   */
  save(storeName: string, stateObjects: KeyValuePairType[], options?: StateSaveOptions): Promise<StateSaveResponseType>;

  /**
   * Retrieves a single state value from the state store.
   *
   * @param storeName - The name of the state store component.
   * @param key - The state key to retrieve.
   * @param options - Optional get options (consistency, metadata, etc.).
   * @returns A promise that resolves to the state value or undefined if not found.
   * The value may be returned as a KeyValueType object or a string depending on the state store.
   *
   * @example
   * ```ts
   * const userData = await client.state.get(
   *   "myStateStore",
   *   "user:123"
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/state_api/
   */
  get(storeName: string, key: string, options?: Partial<StateGetOptions>): Promise<KeyValueType | string>;

  /**
   * Retrieves multiple state values from the state store.
   * More efficient than calling get() individually for multiple keys.
   *
   * @param storeName - The name of the state store component.
   * @param keys - Array of state keys to retrieve.
   * @param options - Optional bulk get options (parallelism, consistency, etc.).
   * @returns A promise that resolves to an array of state values in the same order as keys requested.
   * Values not found in the store may be undefined.
   *
   * @example
   * ```ts
   * const users = await client.state.getBulk(
   *   "myStateStore",
   *   ["user:123", "user:124", "user:125"]
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/state_api/
   */
  getBulk(storeName: string, keys: string[], options?: StateGetBulkOptions): Promise<KeyValueType[]>;

  /**
   * Deletes a state value from the state store.
   *
   * @param storeName - The name of the state store component.
   * @param key - The state key to delete.
   * @param options - Optional delete options (concurrency, consistency, etc.).
   * @returns A promise that resolves to a response indicating deletion status.
   *
   * @example
   * ```ts
   * await client.state.delete(
   *   "myStateStore",
   *   "user:123"
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/state_api/
   */
  delete(storeName: string, key: string, options?: Partial<StateDeleteOptions>): Promise<StateSaveResponseType>;

  /**
   * Performs a transactional state update.
   * Allows atomic multi-key operations (upsert, delete) on state with consistency guarantees.
   *
   * @param storeName - The name of the state store component.
   * @param operations - Array of transactional operations (upsert, delete).
   * Executed atomically; if any operation fails, the entire transaction is rolled back (if supported by the store).
   * @param metadata - Optional request metadata (e.g., consistency settings, correlation IDs).
   * @returns A promise that resolves when the transaction completes.
   *
   * @example
   * ```ts
   * await client.state.transaction(
   *   "myStateStore",
   *   [
   *     { operation: "upsert", request: { key: "account:1", value: { balance: 100 } } },
   *     { operation: "upsert", request: { key: "account:2", value: { balance: 200 } } }
   *   ]
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/state_api/#transactional-state
   */
  transaction(storeName: string, operations?: OperationType[], metadata?: IRequestMetadata | null): Promise<void>;

  /**
   * Queries state values using a query language (e.g., SQL, MongoDB query syntax).
   * Store-specific query language and capabilities depend on the configured state store component.
   *
   * @param storeName - The name of the state store component.
   * @param query - The query specification (language, filter, sorting, pagination).
   * @returns A promise that resolves to a query response containing matched state values.
   *
   * @example
   * ```ts
   * const results = await client.state.query(
   *   "myStateStore",
   *   {
   *     query: "SELECT * FROM state WHERE age > 25 ORDER BY name",
   *     language: "sql"
   *   }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/state_api/#querying-state
   */
  query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType>;
}

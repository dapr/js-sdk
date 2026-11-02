/*
Copyright 2026 The Dapr Authors
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

import {
  VectorBatchQueryResult,
  VectorCollection,
  VectorCreateCollectionOptions,
  VectorIndexAck,
  VectorIndexingOptions,
  VectorOptions,
  VectorQuery,
  VectorQueryResult,
  VectorRecord,
  VectorUpsertResult,
} from "../../types/vector/Vector.types";

/** Dense, pre-embedded vector storage and similarity search (Dapr Vector Alpha1). */
export default interface IClientVector {
  createCollection(storeName: string, collection: string, options: VectorCreateCollectionOptions): Promise<void>;
  getCollection(storeName: string, collection: string, options?: VectorOptions): Promise<VectorCollection>;
  listCollections(storeName: string, options?: VectorOptions): Promise<string[]>;
  deleteCollection(storeName: string, collection: string, options?: VectorOptions): Promise<void>;
  upsertVectors(
    storeName: string,
    collection: string,
    records: readonly VectorRecord[],
    options?: VectorIndexingOptions,
  ): Promise<VectorUpsertResult>;
  /** Missing IDs are omitted; found records retain request order. Payloads and metadata are always retrieved. */
  getVectors(
    storeName: string,
    collection: string,
    ids: readonly string[],
    options?: VectorOptions & { includeValues?: boolean },
  ): Promise<VectorRecord[]>;
  /** Missing IDs are not errors. */
  deleteVectors(
    storeName: string,
    collection: string,
    ids: readonly string[],
    options?: VectorIndexingOptions,
  ): Promise<VectorIndexAck>;
  queryVectors(
    storeName: string,
    collection: string,
    query: VectorQuery,
    options?: VectorOptions,
  ): Promise<VectorQueryResult>;
  /** All queries target this store/collection; individual runtime/provider failures remain in their result slots. */
  batchQueryVectors(
    storeName: string,
    collection: string,
    queries: readonly VectorQuery[],
    options?: VectorOptions,
  ): Promise<VectorBatchQueryResult[]>;
}

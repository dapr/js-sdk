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

import type {
  IndexAck,
  IndexDocumentsResult,
  IndexingOptions,
  SearchDocument,
  SearchIndex,
  SearchOptions,
  SearchQuery,
  SearchResult,
} from "../../types/search/Search.types";

/** Search Alpha1 (Dapr 1.19+, HTTP only). Provider capabilities determine supported query options. */
export default interface IClientSearch {
  createIndex(storeName: string, index: string, options?: SearchOptions): Promise<void>;
  getIndex(storeName: string, index: string, options?: SearchOptions): Promise<SearchIndex>;
  listIndexes(storeName: string, options?: SearchOptions): Promise<string[]>;
  deleteIndex(storeName: string, index: string, options?: SearchOptions): Promise<void>;

  /** Upserts JSON documents. Non-object content is reported as an item failure by the runtime. */
  indexDocuments<T>(
    storeName: string,
    index: string,
    documents: readonly SearchDocument<T>[],
    options?: IndexingOptions,
  ): Promise<IndexDocumentsResult>;

  /** Returns found documents in request order, omitting missing IDs and, by default, content. */
  getDocuments<T = unknown>(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: SearchOptions & { includeContent?: boolean },
  ): Promise<SearchDocument<T>[]>;

  deleteDocuments(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: IndexingOptions,
  ): Promise<IndexAck>;

  search<T = unknown>(
    storeName: string,
    index: string,
    query?: SearchQuery,
    options?: SearchOptions,
  ): Promise<SearchResult<T>>;
}

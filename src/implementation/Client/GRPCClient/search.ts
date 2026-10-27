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

import { create } from "@bufbuild/protobuf";
import IClientSearch from "../../../interfaces/Client/IClientSearch";
import * as Proto from "../../../proto/dapr/proto/runtime/v1/search_pb";
import {
  IndexAck,
  IndexDocumentsResult,
  IndexingOptions,
  SearchDocument,
  SearchIndex,
  SearchOptions,
  SearchQuery,
  SearchResult,
} from "../../../types/search/Search.types";
import { withAbortSignal } from "../../../utils/Client.util";
import {
  fromDeleteDocuments,
  fromIndexDocuments,
  fromSearchDocuments,
  fromSearchIndex,
  fromSearchIndexes,
  fromSearchResult,
  indexingOptions,
  optionalBoolean,
  searchIndexRequest,
  searchQuery,
  searchStoreRequest,
  serializeDocuments,
  strings,
} from "../../../utils/Search.util";
import GRPCClient from "./GRPCClient";

export default class GRPCClientSearch implements IClientSearch {
  constructor(private readonly client: GRPCClient) {}

  async createIndex(storeName: string, index: string, options?: SearchOptions): Promise<void> {
    const request = create(Proto.CreateIndexRequestAlpha1Schema, searchIndexRequest(storeName, index, options));
    const client = await this.getClient(options);
    await client.createIndexAlpha1(request, { signal: options?.signal });
  }

  async getIndex(storeName: string, index: string, options?: SearchOptions): Promise<SearchIndex> {
    const request = create(Proto.GetIndexRequestAlpha1Schema, searchIndexRequest(storeName, index, options));
    const client = await this.getClient(options);
    return fromSearchIndex(await client.getIndexAlpha1(request, { signal: options?.signal }));
  }

  async listIndexes(storeName: string, options?: SearchOptions): Promise<string[]> {
    const request = create(Proto.ListIndexesRequestAlpha1Schema, searchStoreRequest(storeName, options));
    const client = await this.getClient(options);
    return fromSearchIndexes(await client.listIndexesAlpha1(request, { signal: options?.signal }));
  }

  async deleteIndex(storeName: string, index: string, options?: SearchOptions): Promise<void> {
    const request = create(Proto.DeleteIndexRequestAlpha1Schema, searchIndexRequest(storeName, index, options));
    const client = await this.getClient(options);
    await client.deleteIndexAlpha1(request, { signal: options?.signal });
  }

  async indexDocuments<T>(
    storeName: string,
    index: string,
    documents: readonly SearchDocument<T>[],
    options?: IndexingOptions,
  ): Promise<IndexDocumentsResult> {
    const request = create(Proto.IndexDocumentsRequestAlpha1Schema, {
      ...searchIndexRequest(storeName, index, options),
      documents: serializeDocuments(documents),
      options: indexingOptions(options),
    });
    const client = await this.getClient(options);
    return fromIndexDocuments(await client.indexDocumentsAlpha1(request, { signal: options?.signal }));
  }

  async getDocuments<T = unknown>(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: SearchOptions & { includeContent?: boolean },
  ): Promise<SearchDocument<T>[]> {
    const request = create(Proto.GetDocumentsRequestAlpha1Schema, {
      ...searchIndexRequest(storeName, index, options),
      ids: strings(ids, "Search document IDs"),
      includeContent: optionalBoolean(options?.includeContent),
    });
    const client = await this.getClient(options);
    return fromSearchDocuments<T>(await client.getDocumentsAlpha1(request, { signal: options?.signal }));
  }

  async deleteDocuments(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: IndexingOptions,
  ): Promise<IndexAck> {
    const request = create(Proto.DeleteDocumentsRequestAlpha1Schema, {
      ...searchIndexRequest(storeName, index, options),
      ids: strings(ids, "Search document IDs"),
      options: indexingOptions(options),
    });
    const client = await this.getClient(options);
    return fromDeleteDocuments(await client.deleteDocumentsAlpha1(request, { signal: options?.signal }));
  }

  async search<T = unknown>(
    storeName: string,
    index: string,
    query?: SearchQuery,
    options?: SearchOptions,
  ): Promise<SearchResult<T>> {
    const request = create(Proto.SearchRequestAlpha1Schema, {
      ...searchIndexRequest(storeName, index, options),
      query: searchQuery(query),
    });
    const client = await this.getClient(options);
    return fromSearchResult<T>(await client.searchAlpha1(request, { signal: options?.signal }));
  }

  private async getClient(options?: SearchOptions) {
    options?.signal?.throwIfAborted();
    const client = await withAbortSignal(this.client.getClient(), options?.signal);
    options?.signal?.throwIfAborted();
    return client;
  }
}

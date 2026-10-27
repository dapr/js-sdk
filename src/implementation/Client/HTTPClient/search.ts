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

import IClientSearch from "../../../interfaces/Client/IClientSearch";
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
import { createHTTPQueryParam } from "../../../utils/Client.util";
import {
  fromDeleteDocuments,
  fromIndexDocuments,
  fromSearchDocuments,
  fromSearchIndex,
  fromSearchIndexes,
  fromSearchResult,
  indexingOptionsJson,
  optionalBoolean,
  searchName,
  searchQueryJson,
  searchStoreRequest,
  serializeDocuments,
  strings,
} from "../../../utils/Search.util";
import HTTPClient from "./HTTPClient";

export default class HTTPClientSearch implements IClientSearch {
  constructor(private readonly client: HTTPClient) {}

  async createIndex(storeName: string, index: string, options?: SearchOptions): Promise<void> {
    await this.execute(storeName, index, "", "POST", options);
  }

  async getIndex(storeName: string, index: string, options?: SearchOptions): Promise<SearchIndex> {
    return fromSearchIndex(await this.execute(storeName, searchName(index, "Search index"), "", "GET", options));
  }

  async listIndexes(storeName: string, options?: SearchOptions): Promise<string[]> {
    return fromSearchIndexes(await this.execute(storeName, undefined, "", "GET", options));
  }

  async deleteIndex(storeName: string, index: string, options?: SearchOptions): Promise<void> {
    await this.execute(storeName, index, "", "DELETE", options);
  }

  async indexDocuments<T>(
    storeName: string,
    index: string,
    documents: readonly SearchDocument<T>[],
    options?: IndexingOptions,
  ): Promise<IndexDocumentsResult> {
    const body = {
      documents: serializeDocuments(documents).map((document) => ({
        ...document,
        content: document.content.toString("base64"),
      })),
      options: indexingOptionsJson(options),
    };
    return fromIndexDocuments(await this.execute(storeName, index, "/documents", "POST", options, body));
  }

  async getDocuments<T = unknown>(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: SearchOptions & { includeContent?: boolean },
  ): Promise<SearchDocument<T>[]> {
    return fromSearchDocuments<T>(
      await this.execute(storeName, index, "/documents/get", "POST", options, {
        ids: strings(ids, "Search document IDs"),
        includeContent: optionalBoolean(options?.includeContent),
      }),
    );
  }

  async deleteDocuments(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: IndexingOptions,
  ): Promise<IndexAck> {
    return fromDeleteDocuments(
      await this.execute(storeName, index, "/documents/delete", "POST", options, {
        ids: strings(ids, "Search document IDs"),
        options: indexingOptionsJson(options),
      }),
    );
  }

  async search<T = unknown>(
    storeName: string,
    index: string,
    query?: SearchQuery,
    options?: SearchOptions,
  ): Promise<SearchResult<T>> {
    return fromSearchResult<T>(
      await this.execute(storeName, index, "/query", "POST", options, { query: searchQueryJson(query) }),
    );
  }

  private async execute(
    storeName: string,
    index: string | undefined,
    suffix: string,
    method: "GET" | "POST" | "DELETE",
    options: SearchOptions = {},
    body: object = {},
  ): Promise<unknown> {
    const request = searchStoreRequest(storeName, options);
    let path = `/search/${encodeURIComponent(request.storeName)}/indexes`;
    if (index !== undefined) {
      path += `/${encodeURIComponent(searchName(index, "Search index"))}`;
    } else if (method !== "GET" || suffix !== "") {
      throw new TypeError("Search index is required");
    }
    path += suffix;
    const metadata = options.metadata === undefined ? undefined : request.metadata;
    if (method !== "POST") {
      const query = createHTTPQueryParam({ data: metadata, type: "metadata" });
      if (query) {
        path += `?${query}`;
      }
    }
    return this.client.executeWithApiVersion("v1.0-alpha1", path, {
      method,
      ...(method === "POST" ? { body: { ...body, ...(metadata === undefined ? {} : { metadata }) } } : {}),
      signal: options.signal,
    });
  }
}

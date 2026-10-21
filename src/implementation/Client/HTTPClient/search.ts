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

import { fromJson, JsonObject, toJson } from "@bufbuild/protobuf";
import { BytesValueSchema, DurationSchema } from "@bufbuild/protobuf/wkt";
import IClientSearch from "../../../interfaces/Client/IClientSearch";
import { JsonSerializer } from "../../../serialization/JsonSerializer";
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
import { validateJson } from "../../../utils/Json.util";
import HTTPClient from "./HTTPClient";

const serializer = new JsonSerializer();

export default class HTTPClientSearch implements IClientSearch {
  constructor(private readonly client: HTTPClient) {}

  async createIndex(storeName: string, index: string, options?: SearchOptions): Promise<void> {
    await this.execute(storeName, index, "", "POST", options);
  }

  async getIndex(storeName: string, index: string, options?: SearchOptions): Promise<SearchIndex> {
    const response = object(
      await this.execute(storeName, nonemptyString(index, "Search index"), "", "GET", options),
      "Search index response",
    );
    return {
      index: nonemptyString(response.index, "Search index"),
      documentCount: count(response.documentCount ?? "0"),
      properties: stringMap(response.properties ?? {}, "Search index properties"),
    };
  }

  async listIndexes(storeName: string, options?: SearchOptions): Promise<string[]> {
    const response = object(await this.execute(storeName, undefined, "", "GET", options), "Search indexes response");
    return strings(response.indexes ?? [], "Search indexes");
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
      documents: array(documents, "Search documents").map((value) => {
        const document = object(value, "Search document");
        return {
          id: nonemptyString(document.id, "Search document ID"),
          content: Buffer.from(serializer.serialize(document.content === undefined ? null : document.content)).toString(
            "base64",
          ),
          metadata:
            document.metadata === undefined ? undefined : stringMap(document.metadata, "Search document metadata"),
        };
      }),
      options: indexingOptions(options),
    };
    const response = object(
      await this.execute(storeName, index, "/documents", "POST", options, body),
      "Search indexing response",
    );
    return {
      ack: acknowledgement(response.ack),
      failedItems: array(response.failedItems ?? [], "Search failed items").map((value) => {
        const item = object(value, "Search failed item");
        const error = object(item.error, "Search item error");
        if (typeof error.code !== "number" || !Number.isInteger(error.code) || error.code < 1 || error.code > 16) {
          throw new TypeError("Search returned an item failure without a non-OK canonical status");
        }
        return {
          id: nonemptyString(item.id, "Search failed item ID"),
          errorCode: error.code,
          errorMessage: string(error.message ?? "", "Search item error message"),
          details: array(error.details ?? [], "Search error details").map((detail) => {
            const result = jsonObject(detail, "Search error detail");
            nonemptyString(result["@type"], "Search error detail @type");
            return result;
          }),
        };
      }),
    };
  }

  async getDocuments<T = unknown>(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: SearchOptions & { includeContent?: boolean },
  ): Promise<SearchDocument<T>[]> {
    const response = object(
      await this.execute(storeName, index, "/documents/get", "POST", options, {
        ids: strings(ids, "Search document IDs"),
        includeContent: optionalBoolean(options?.includeContent),
      }),
      "Search documents response",
    );
    return array(response.documents ?? [], "Search documents").map(document<T>);
  }

  async deleteDocuments(
    storeName: string,
    index: string,
    ids: readonly string[],
    options?: IndexingOptions,
  ): Promise<IndexAck> {
    const response = object(
      await this.execute(storeName, index, "/documents/delete", "POST", options, {
        ids: strings(ids, "Search document IDs"),
        options: indexingOptions(options),
      }),
      "Search deletion response",
    );
    return acknowledgement(response.ack);
  }

  async search<T = unknown>(
    storeName: string,
    index: string,
    query?: SearchQuery,
    options?: SearchOptions,
  ): Promise<SearchResult<T>> {
    const response = object(
      await this.execute(storeName, index, "/query", "POST", options, { query: searchQuery(query) }),
      "Search response",
    );
    return {
      hits: array(response.hits ?? [], "Search hits").map((value) => {
        const hit = object(value, "Search hit");
        const score = hit.score ?? 0;
        if (typeof score !== "number" || !Number.isFinite(score)) {
          throw new TypeError("Search hit score must be finite");
        }
        return {
          document: document<T>(hit.document),
          score,
          highlights: stringMap(hit.highlights ?? {}, "Search highlights"),
        };
      }),
      totalHits: response.totalHits == null ? undefined : count(response.totalHits),
      totalHitsRelation: totalHitsRelation(response.totalHitsRelation),
      continuationToken:
        response.continuationToken == null
          ? undefined
          : string(response.continuationToken, "Search continuation token"),
    };
  }

  private async execute(
    storeName: string,
    index: string | undefined,
    suffix: string,
    method: "GET" | "POST" | "DELETE",
    options: SearchOptions = {},
    body: object = {},
  ): Promise<unknown> {
    let path = `/search/${pathSegment(storeName, "Search store name")}/indexes`;
    if (index !== undefined) {
      path += `/${pathSegment(index, "Search index")}`;
    } else if (method !== "GET" || suffix !== "") {
      throw new TypeError("Search index is required");
    }
    path += suffix;
    object(options, "Search options");
    const metadata = options.metadata === undefined ? undefined : stringMap(options.metadata, "Search metadata");
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

function object(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }
  return value;
}

function string(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }
  return value;
}

function nonemptyString(value: unknown, field: string): string {
  const result = string(value, field);
  if (!result.trim()) {
    throw new TypeError(`${field} must not be empty`);
  }
  return result;
}

function pathSegment(value: unknown, field: string): string {
  const result = nonemptyString(value, field);
  if (result === "." || result === "..") {
    throw new TypeError(`${field} must not be a dot path segment`);
  }
  return encodeURIComponent(result);
}

function strings(value: unknown, field: string): string[] {
  return array(value, field).map((item) => nonemptyString(item, field));
}

function stringMap(value: unknown, field: string): Record<string, string> {
  return Object.fromEntries(Object.entries(object(value, field)).map(([key, item]) => [key, string(item, field)]));
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value !== undefined && typeof value !== "boolean") {
    throw new TypeError("Search includeContent must be a boolean");
  }
  return value;
}

function jsonObject(value: unknown, field: string): JsonObject {
  validateJson(value, field);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be a JSON object`);
  }
  return value;
}

function indexingOptions(options?: IndexingOptions): object | undefined {
  if (options === undefined) {
    return undefined;
  }
  object(options, "Search indexing options");
  if (options.mode === "waitForCompletion") {
    if (typeof options.waitTimeout !== "string") {
      throw new TypeError("waitForCompletion requires a positive waitTimeout");
    }
    const duration = fromJson(DurationSchema, options.waitTimeout);
    if (duration.seconds < 0n || duration.nanos < 0 || (duration.seconds === 0n && duration.nanos === 0)) {
      throw new RangeError("waitForCompletion requires a positive waitTimeout");
    }
    if (options.onWaitTimeout !== "continueAsync" && options.onWaitTimeout !== "failRequest") {
      throw new TypeError("waitForCompletion requires an explicit onWaitTimeout action");
    }
    return {
      mode: "INDEXING_MODE_WAIT_FOR_COMPLETION",
      waitTimeout: toJson(DurationSchema, duration),
      onWaitTimeout:
        options.onWaitTimeout === "continueAsync"
          ? "INDEXING_WAIT_TIMEOUT_ACTION_CONTINUE_ASYNC"
          : "INDEXING_WAIT_TIMEOUT_ACTION_FAIL_REQUEST",
    };
  }
  if (options.mode !== undefined && options.mode !== "returnOnAcceptance") {
    throw new TypeError("Unknown search indexing mode");
  }
  if (options.waitTimeout !== undefined || options.onWaitTimeout !== undefined) {
    throw new TypeError("waitTimeout and onWaitTimeout require waitForCompletion");
  }
  return options.mode === undefined ? undefined : { mode: "INDEXING_MODE_RETURN_ON_ACCEPTANCE" };
}

function searchQuery(query?: SearchQuery): object | undefined {
  if (query === undefined) {
    return undefined;
  }
  object(query, "Search query");
  if (query.text !== undefined && query.native !== undefined) {
    throw new TypeError("Search text and native queries are mutually exclusive");
  }
  if (query.topK !== undefined && (!Number.isInteger(query.topK) || query.topK < 0 || query.topK > 0xffffffff)) {
    throw new RangeError("Search topK must be an integer between 0 and 4294967295");
  }
  return {
    text: query.text === undefined ? undefined : string(query.text, "Search text"),
    native: query.native === undefined ? undefined : jsonObject(query.native, "Search native query"),
    filter: query.filter === undefined ? undefined : jsonObject(query.filter, "Search filter"),
    topK: query.topK,
    continuationToken:
      query.continuationToken === undefined ? undefined : string(query.continuationToken, "Search continuation token"),
    includeContent: optionalBoolean(query.includeContent),
    returnFields: query.returnFields === undefined ? undefined : strings(query.returnFields, "Search return fields"),
    searchFields: query.searchFields === undefined ? undefined : strings(query.searchFields, "Search fields"),
    highlightFields:
      query.highlightFields === undefined ? undefined : strings(query.highlightFields, "Search highlight fields"),
    sort:
      query.sort === undefined
        ? undefined
        : array(query.sort, "Search sort").map((value) => {
            const clause = object(value, "Search sort clause");
            if (clause.order !== undefined && clause.order !== "asc" && clause.order !== "desc") {
              throw new TypeError("Unknown search sort order");
            }
            return {
              field: nonemptyString(clause.field, "Search sort field"),
              order: clause.order === "desc" ? "SORT_ORDER_DESC" : "SORT_ORDER_ASC",
            };
          }),
  };
}

function document<T>(value: unknown): SearchDocument<T> {
  const result = object(value, "Search document");
  let content: T | undefined;
  if (result.content != null && result.content !== "") {
    const encoded = string(result.content, "Search document content");
    const bytes = fromJson(BytesValueSchema, encoded).value;
    content = serializer.deserialize<T>(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  }
  return {
    id: nonemptyString(result.id, "Search document ID"),
    content,
    metadata: stringMap(result.metadata ?? {}, "Search document metadata"),
  };
}

function acknowledgement(value: unknown): IndexAck {
  switch (value) {
    case 1:
    case "INDEX_ACK_QUEUED":
      return "queued";
    case 2:
    case "INDEX_ACK_COMPLETED":
      return "completed";
    default:
      throw new TypeError(`Search returned an invalid write acknowledgement: ${String(value)}`);
  }
}

function count(value: unknown): number {
  if ((typeof value !== "string" || !/^\d+$/.test(value)) && (typeof value !== "number" || !Number.isInteger(value))) {
    throw new TypeError("Search count must be an unsigned integer");
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new RangeError("Search count exceeds the safe integer range");
  }
  return result;
}

function totalHitsRelation(value: unknown): SearchResult["totalHitsRelation"] {
  switch (value) {
    case undefined:
    case null:
    case 0:
    case "TOTAL_HITS_RELATION_UNSPECIFIED":
      return "unspecified";
    case 1:
    case "TOTAL_HITS_RELATION_EXACT":
      return "exact";
    case 2:
    case "TOTAL_HITS_RELATION_LOWER_BOUND":
      return "lowerBound";
    case 3:
    case "TOTAL_HITS_RELATION_ESTIMATE":
      return "estimate";
    default:
      throw new TypeError(`Search returned an invalid total hits relation: ${String(value)}`);
  }
}

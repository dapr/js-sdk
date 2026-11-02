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

import { create, fromJson, JsonObject, toJson } from "@bufbuild/protobuf";
import { BytesValueSchema, DurationSchema } from "@bufbuild/protobuf/wkt";
import * as Proto from "../proto/dapr/proto/runtime/v1/search_pb";
import { JsonSerializer } from "../serialization/JsonSerializer";
import {
  IndexAck,
  IndexDocumentsResult,
  IndexingOptions,
  SearchDocument,
  SearchIndex,
  SearchOptions,
  SearchQuery,
  SearchResult,
} from "../types/search/Search.types";
import { validateJson } from "./Json.util";

const serializer = new JsonSerializer();

export function searchStoreRequest(storeName: string, options: SearchOptions = {}) {
  object(options, "Search options");
  return {
    storeName: searchName(storeName, "Search store name"),
    metadata: options.metadata === undefined ? {} : stringMap(options.metadata, "Search metadata"),
  };
}

export function searchIndexRequest(storeName: string, index: string, options?: SearchOptions) {
  return { ...searchStoreRequest(storeName, options), index: searchName(index, "Search index") };
}

export function serializeDocuments<T>(documents: readonly SearchDocument<T>[]) {
  return array(documents, "Search documents").map((value) => {
    const document = object(value, "Search document");
    return {
      id: nonemptyString(document.id, "Search document ID"),
      content: Buffer.from(serializer.serialize(document.content === undefined ? null : document.content)),
      metadata: document.metadata === undefined ? undefined : stringMap(document.metadata, "Search document metadata"),
    };
  });
}

export function indexingOptions(options?: IndexingOptions): Proto.IndexingOptionsAlpha1 | undefined {
  if (options === undefined) {
    return undefined;
  }
  object(options, "Search indexing options");
  if (options.mode === "waitForCompletion") {
    if (typeof options.waitTimeout !== "string") {
      throw new TypeError("waitForCompletion requires a positive waitTimeout");
    }
    const waitTimeout = fromJson(DurationSchema, options.waitTimeout);
    if (waitTimeout.seconds < 0n || waitTimeout.nanos < 0 || (waitTimeout.seconds === 0n && waitTimeout.nanos === 0)) {
      throw new RangeError("waitForCompletion requires a positive waitTimeout");
    }
    if (options.onWaitTimeout !== "continueAsync" && options.onWaitTimeout !== "failRequest") {
      throw new TypeError("waitForCompletion requires an explicit onWaitTimeout action");
    }
    return create(Proto.IndexingOptionsAlpha1Schema, {
      mode: Proto.IndexingMode.WAIT_FOR_COMPLETION,
      waitTimeout,
      onWaitTimeout:
        options.onWaitTimeout === "continueAsync"
          ? Proto.IndexingWaitTimeoutAction.CONTINUE_ASYNC
          : Proto.IndexingWaitTimeoutAction.FAIL_REQUEST,
    });
  }
  if (options.mode !== undefined && options.mode !== "returnOnAcceptance") {
    throw new TypeError("Unknown search indexing mode");
  }
  if (options.waitTimeout !== undefined || options.onWaitTimeout !== undefined) {
    throw new TypeError("waitTimeout and onWaitTimeout require waitForCompletion");
  }
  return options.mode === undefined
    ? undefined
    : create(Proto.IndexingOptionsAlpha1Schema, { mode: Proto.IndexingMode.RETURN_ON_ACCEPTANCE });
}

export function indexingOptionsJson(options?: IndexingOptions) {
  const message = indexingOptions(options);
  return message === undefined ? undefined : toJson(Proto.IndexingOptionsAlpha1Schema, message);
}

export function searchQuery(query?: SearchQuery): Proto.SearchQuery | undefined {
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
  return create(Proto.SearchQuerySchema, {
    kind:
      query.text !== undefined
        ? { case: "text", value: string(query.text, "Search text") }
        : query.native !== undefined
        ? { case: "native", value: jsonObject(query.native, "Search native query") }
        : undefined,
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
              order: clause.order === "desc" ? Proto.SortOrder.DESC : Proto.SortOrder.ASC,
            };
          }),
  });
}

export function searchQueryJson(query?: SearchQuery): JsonObject | undefined {
  const message = searchQuery(query);
  if (message === undefined || query === undefined) {
    return undefined;
  }
  const result = jsonObject(toJson(Proto.SearchQuerySchema, message), "Search query");
  // Preserve explicitly supplied empty lists in the existing HTTP contract.
  for (const field of ["returnFields", "searchFields", "highlightFields", "sort"] as const) {
    if (query[field] !== undefined && message[field].length === 0) {
      result[field] = [];
    }
  }
  return result;
}

export function fromSearchIndex(value: unknown): SearchIndex {
  const response = object(value, "Search index response");
  return {
    index: nonemptyString(response.index, "Search index"),
    documentCount: count(response.documentCount ?? "0"),
    properties: stringMap(response.properties ?? {}, "Search index properties"),
  };
}

export function fromSearchIndexes(value: unknown): string[] {
  const response = object(value, "Search indexes response");
  return strings(response.indexes ?? [], "Search indexes");
}

export function fromIndexDocuments(value: unknown): IndexDocumentsResult {
  const response = object(value, "Search indexing response");
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
        details: array(error.details ?? [], "Search error details").map((value) => {
          const detail = object(value, "Search error detail");
          // Provider-specific Any schemas are not necessarily available to decode gRPC details.
          if (detail.value instanceof Uint8Array) {
            return {
              "@type": nonemptyString(detail.typeUrl, "Search error detail type URL"),
              value: Buffer.from(detail.value).toString("base64"),
            };
          }
          const result = jsonObject(detail, "Search error detail");
          nonemptyString(result["@type"], "Search error detail @type");
          return result;
        }),
      };
    }),
  };
}

export function fromSearchDocuments<T>(value: unknown): SearchDocument<T>[] {
  const response = object(value, "Search documents response");
  return array(response.documents ?? [], "Search documents").map(document<T>);
}

export function fromDeleteDocuments(value: unknown): IndexAck {
  return acknowledgement(object(value, "Search deletion response").ack);
}

export function fromSearchResult<T>(value: unknown): SearchResult<T> {
  const response = object(value, "Search response");
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
      response.continuationToken == null ? undefined : string(response.continuationToken, "Search continuation token"),
  };
}

function document<T>(value: unknown): SearchDocument<T> {
  const result = object(value, "Search document");
  let content: T | undefined;
  if (result.content != null && result.content !== "") {
    const bytes =
      result.content instanceof Uint8Array
        ? result.content
        : fromJson(BytesValueSchema, string(result.content, "Search document content")).value;
    if (bytes.length > 0) {
      content = serializer.deserialize<T>(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    }
  }
  return {
    id: nonemptyString(result.id, "Search document ID"),
    content,
    metadata: stringMap(result.metadata ?? {}, "Search document metadata"),
  };
}

function acknowledgement(value: unknown): IndexAck {
  switch (value) {
    case Proto.IndexAck.QUEUED:
    case "INDEX_ACK_QUEUED":
      return "queued";
    case Proto.IndexAck.COMPLETED:
    case "INDEX_ACK_COMPLETED":
      return "completed";
    default:
      throw new TypeError(`Search returned an invalid write acknowledgement: ${String(value)}`);
  }
}

function count(value: unknown): number {
  if (
    typeof value !== "bigint" &&
    (typeof value !== "string" || !/^\d+$/.test(value)) &&
    (typeof value !== "number" || !Number.isInteger(value))
  ) {
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
    case Proto.TotalHitsRelation.UNSPECIFIED:
    case "TOTAL_HITS_RELATION_UNSPECIFIED":
      return "unspecified";
    case Proto.TotalHitsRelation.EXACT:
    case "TOTAL_HITS_RELATION_EXACT":
      return "exact";
    case Proto.TotalHitsRelation.LOWER_BOUND:
    case "TOTAL_HITS_RELATION_LOWER_BOUND":
      return "lowerBound";
    case Proto.TotalHitsRelation.ESTIMATE:
    case "TOTAL_HITS_RELATION_ESTIMATE":
      return "estimate";
    default:
      throw new TypeError(`Search returned an invalid total hits relation: ${String(value)}`);
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
  return Array.from(value);
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

export function searchName(value: unknown, field: string): string {
  const result = nonemptyString(value, field);
  if (result === "." || result === "..") {
    throw new TypeError(`${field} must not be a dot path segment`);
  }
  return result;
}

export function strings(value: unknown, field: string): string[] {
  return array(value, field).map((item) => nonemptyString(item, field));
}

function stringMap(value: unknown, field: string): Record<string, string> {
  return Object.fromEntries(Object.entries(object(value, field)).map(([key, item]) => [key, string(item, field)]));
}

export function optionalBoolean(value: unknown): boolean | undefined {
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

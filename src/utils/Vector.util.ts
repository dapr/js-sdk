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

import { create, DescMessage, fromJson, JsonObject, MessageShape } from "@bufbuild/protobuf";
import { DurationSchema } from "@bufbuild/protobuf/wkt";
import * as Proto from "../proto/dapr/proto/runtime/v1/vector_pb";
import {
  IndexAck,
  IndexingMode,
  IndexingOptionsAlpha1Schema,
  IndexingWaitTimeoutAction,
} from "../proto/dapr/proto/runtime/v1/search_pb";
import { Status } from "../proto/google/rpc/status_pb";
import {
  VectorBatchQueryResult,
  VectorCollection,
  VectorCreateCollectionOptions,
  VectorDistanceMetric,
  VectorError,
  VectorIndexAck,
  VectorIndexingOptions,
  VectorOptions,
  VectorQuery,
  VectorQueryResult,
  VectorRecord,
  VectorUpsertResult,
} from "../types/vector/Vector.types";
import { validateJson } from "./Json.util";

export function vectorStoreRequest(storeName: string, options: VectorOptions = {}) {
  object(options, "Vector options");
  return {
    storeName: name(storeName, "Vector store name"),
    metadata: options.metadata === undefined ? {} : stringMap(options.metadata),
  };
}

export function vectorCollectionRequest(storeName: string, collection: string, options?: VectorOptions) {
  return { ...vectorStoreRequest(storeName, options), collection: name(collection, "Vector collection") };
}

export function toCreateCollectionRequest(
  storeName: string,
  collection: string,
  options: VectorCreateCollectionOptions,
) {
  object(options, "Vector collection options");
  return create(Proto.CreateCollectionRequestAlpha1Schema, {
    ...vectorCollectionRequest(storeName, collection, options),
    dimensions: uint32(options.dimensions, "Vector dimensions", 1),
    metric: toMetric(options.metric),
  });
}

export function toUpsertVectorsRequest(
  storeName: string,
  collection: string,
  records: readonly VectorRecord[],
  options?: VectorIndexingOptions,
) {
  return create(Proto.UpsertVectorsRequestAlpha1Schema, {
    ...vectorCollectionRequest(storeName, collection, options),
    records: array(records, "Vector records").map((entry) => {
      const record = object(entry, "Vector record");
      if (record.payload !== undefined && !(record.payload instanceof Uint8Array)) {
        throw new TypeError("Vector payload must be a Uint8Array or Buffer");
      }
      return {
        id: nonemptyString(record.id, "Vector record ID"),
        values: values(record.values),
        payload: record.payload === undefined ? undefined : Uint8Array.from(record.payload),
        metadata: record.metadata === undefined ? undefined : jsonObject(record.metadata, "Vector record metadata"),
      };
    }),
    options: toIndexingOptions(options),
  });
}

export function toGetVectorsRequest(
  storeName: string,
  collection: string,
  ids: readonly string[],
  options?: VectorOptions & { includeValues?: boolean },
) {
  return create(Proto.GetVectorsRequestAlpha1Schema, {
    ...vectorCollectionRequest(storeName, collection, options),
    ids: vectorStrings(ids),
    includeValues: optionalBoolean(options?.includeValues),
  });
}

export function toDeleteVectorsRequest(
  storeName: string,
  collection: string,
  ids: readonly string[],
  options?: VectorIndexingOptions,
) {
  return create(Proto.DeleteVectorsRequestAlpha1Schema, {
    ...vectorCollectionRequest(storeName, collection, options),
    ids: vectorStrings(ids),
    options: toIndexingOptions(options),
  });
}

export function toQueryVectorsRequest(
  storeName: string,
  collection: string,
  query: VectorQuery,
  options?: VectorOptions,
) {
  return create(Proto.QueryVectorsRequestAlpha1Schema, {
    ...vectorCollectionRequest(storeName, collection, options),
    query: toQuery(query),
  });
}

export function toBatchQueryVectorsRequest(
  storeName: string,
  collection: string,
  queries: readonly VectorQuery[],
  options?: VectorOptions,
) {
  return create(Proto.BatchQueryVectorsRequestAlpha1Schema, {
    ...vectorCollectionRequest(storeName, collection, options),
    queries: array(queries, "Vector queries").map(toQuery),
  });
}

function toQuery(value: unknown): Proto.VectorQuery {
  const query = object(value, "Vector query");
  if ((query.vector === undefined) === (query.byId === undefined)) {
    throw new TypeError("Vector query must specify exactly one of vector or byId");
  }
  return create(Proto.VectorQuerySchema, {
    kind:
      query.vector !== undefined
        ? { case: "vector", value: { values: values(query.vector) } }
        : { case: "byId", value: string(query.byId, "Vector query byId") },
    topK: query.topK === undefined ? undefined : uint32(query.topK, "Vector topK"),
    filter: query.filter === undefined ? undefined : jsonObject(query.filter, "Vector filter"),
    includeValues: optionalBoolean(query.includeValues),
    includePayload: optionalBoolean(query.includePayload),
    metric: toMetric(query.metric),
    scoreThreshold:
      query.scoreThreshold === undefined ? undefined : finiteNumber(query.scoreThreshold, "Vector scoreThreshold"),
  });
}

function toIndexingOptions(options?: VectorIndexingOptions) {
  if (options === undefined) {
    return undefined;
  }
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
    return create(IndexingOptionsAlpha1Schema, {
      mode: IndexingMode.WAIT_FOR_COMPLETION,
      waitTimeout,
      onWaitTimeout:
        options.onWaitTimeout === "continueAsync"
          ? IndexingWaitTimeoutAction.CONTINUE_ASYNC
          : IndexingWaitTimeoutAction.FAIL_REQUEST,
    });
  }
  if (options.mode !== undefined && options.mode !== "returnOnAcceptance") {
    throw new TypeError("Unknown vector indexing mode");
  }
  if (options.waitTimeout !== undefined || options.onWaitTimeout !== undefined) {
    throw new TypeError("waitTimeout and onWaitTimeout require waitForCompletion");
  }
  return options.mode === undefined
    ? undefined
    : create(IndexingOptionsAlpha1Schema, { mode: IndexingMode.RETURN_ON_ACCEPTANCE });
}

function toMetric(metric: unknown): Proto.DistanceMetric {
  switch (metric) {
    case undefined:
      return Proto.DistanceMetric.UNSPECIFIED;
    case "cosine":
      return Proto.DistanceMetric.COSINE;
    case "dotProduct":
      return Proto.DistanceMetric.DOT_PRODUCT;
    case "euclidean":
      return Proto.DistanceMetric.EUCLIDEAN;
    default:
      throw new TypeError(`Unknown vector distance metric: ${String(metric)}`);
  }
}

function fromMetric(metric: Proto.DistanceMetric): VectorDistanceMetric {
  switch (metric) {
    case Proto.DistanceMetric.COSINE:
      return "cosine";
    case Proto.DistanceMetric.DOT_PRODUCT:
      return "dotProduct";
    case Proto.DistanceMetric.EUCLIDEAN:
      return "euclidean";
    default:
      throw new TypeError(`Vector response must contain a concrete distance metric: ${metric}`);
  }
}

export function fromVectorCollection(response: Proto.GetCollectionResponseAlpha1): VectorCollection {
  const recordCount = Number(response.recordCount);
  if (!Number.isSafeInteger(recordCount) || recordCount < 0) {
    throw new RangeError("Vector recordCount exceeds JavaScript safe integer precision");
  }
  return {
    collection: nonemptyString(response.collection, "Vector collection"),
    recordCount,
    dimensions: uint32(response.dimensions, "Vector dimensions", 1),
    properties: stringMap(response.properties),
    metric: fromMetric(response.metric),
  };
}

export function fromVectorRecord(record: Proto.VectorRecord): VectorRecord {
  return {
    id: nonemptyString(record.id, "Vector record ID"),
    values: values(record.values),
    payload: record.payload === undefined ? undefined : Uint8Array.from(record.payload),
    metadata: record.metadata === undefined ? undefined : jsonObject(record.metadata, "Vector record metadata"),
  };
}

export function fromVectorQuery(response: Proto.QueryVectorsResponseAlpha1): VectorQueryResult {
  return {
    matches: response.matches.map((match) => {
      if (match.record === undefined) {
        throw new TypeError("Vector match is missing its record");
      }
      return { record: fromVectorRecord(match.record), score: finiteNumber(match.score, "Vector match score") };
    }),
    metric: fromMetric(response.metric),
  };
}

export function fromVectorAck(ack: IndexAck): VectorIndexAck {
  switch (ack) {
    case IndexAck.QUEUED:
      return "queued";
    case IndexAck.COMPLETED:
      return "completed";
    default:
      throw new TypeError(`Vector response contains an invalid write acknowledgement: ${ack}`);
  }
}

function errorCode(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 16) {
    throw new TypeError("Vector error must contain a non-OK canonical status code");
  }
  return value;
}

function fromError(error: Status | undefined): VectorError {
  if (error === undefined) {
    throw new TypeError("Vector failure is missing its error");
  }
  return {
    code: errorCode(error.code),
    message: error.message,
    details: error.details.map((detail) => ({
      typeUrl: nonemptyString(detail.typeUrl, "Vector error detail type URL"),
      value: Uint8Array.from(detail.value),
    })),
  };
}

export function fromVectorUpsert(response: Proto.UpsertVectorsResponseAlpha1): VectorUpsertResult {
  return {
    ack: fromVectorAck(response.ack),
    failedItems: response.failedItems.map((item) => ({
      id: nonemptyString(item.id, "Vector failed item ID"),
      error: fromError(item.error),
    })),
  };
}

export function fromVectorBatch(
  response: Proto.BatchQueryVectorsResponseAlpha1,
  queryCount: number,
): VectorBatchQueryResult[] {
  batchSize(response.results.length, queryCount);
  return response.results.map(({ result }) => {
    switch (result.case) {
      case "response":
        return { response: fromVectorQuery(result.value) };
      case "error":
        return { error: fromError(result.value) };
      default:
        throw new TypeError("Vector batch result must contain a response or error");
    }
  });
}

export function parseVectorResponse<D extends DescMessage>(schema: D, response: unknown): MessageShape<D> {
  return fromJson(schema, jsonObject(response, "Vector response"), { ignoreUnknownFields: true });
}

// Decode HTTP statuses separately: arbitrary provider Any details need not have a registered protobuf schema.
function fromHttpError(value: unknown): VectorError {
  const error = object(value, "Vector error");
  return {
    code: errorCode(error.code),
    message: string(error.message ?? "", "Vector error message"),
    details: array(error.details ?? [], "Vector error details").map((detail) => {
      const { "@type": typeUrl, ...fields } = jsonObject(detail, "Vector error detail");
      return { typeUrl: nonemptyString(typeUrl, "Vector error detail @type"), value: fields };
    }),
  };
}

export function fromVectorHttpUpsert(value: unknown): VectorUpsertResult {
  const { failedItems, ...response } = object(value, "Vector upsert response");
  return {
    ack: fromVectorAck(parseVectorResponse(Proto.UpsertVectorsResponseAlpha1Schema, response).ack),
    failedItems: array(failedItems ?? [], "Vector failed items").map((value) => {
      const item = object(value, "Vector failed item");
      return { id: nonemptyString(item.id, "Vector failed item ID"), error: fromHttpError(item.error) };
    }),
  };
}

export function fromVectorHttpBatch(value: unknown, queryCount: number): VectorBatchQueryResult[] {
  const response = object(value, "Vector batch response");
  const results = array(response.results ?? [], "Vector batch results");
  batchSize(results.length, queryCount);
  return results.map((value) => {
    const result = object(value, "Vector batch result");
    if ((result.response == null) === (result.error == null)) {
      throw new TypeError("Vector batch result must contain exactly one response or error");
    }
    return result.response != null
      ? { response: fromVectorQuery(parseVectorResponse(Proto.QueryVectorsResponseAlpha1Schema, result.response)) }
      : { error: fromHttpError(result.error) };
  });
}

function batchSize(actual: number, expected: number): void {
  if (actual !== expected) {
    throw new TypeError(`Vector batch returned ${actual} results for ${expected} queries`);
  }
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function jsonObject(value: unknown, field: string): JsonObject {
  validateJson(value, field);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be a JSON object`);
  }
  return value;
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

function name(value: unknown, field: string): string {
  const result = nonemptyString(value, field);
  if (result === "." || result === "..") {
    throw new TypeError(`${field} must not be a dot path segment`);
  }
  return result;
}

export function vectorStrings(value: unknown): string[] {
  return array(value, "Vector names or IDs").map((value) => nonemptyString(value, "Vector name or ID"));
}

function stringMap(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(object(value, "Vector metadata")).map(([key, value]) => [
      key,
      string(value, "Vector metadata value"),
    ]),
  );
}

function uint32(value: unknown, field: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > 0xffffffff) {
    throw new RangeError(`${field} must be an integer between ${minimum} and 4294967295`);
  }
  return value;
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value !== undefined && typeof value !== "boolean") {
    throw new TypeError("Vector includeValues and includePayload must be booleans");
  }
  return value;
}

function finiteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${field} must be a finite number`);
  }
  return value;
}

function values(value: unknown): number[] {
  return array(value, "Vector values").map((value) => {
    const number = finiteNumber(value, "Vector value");
    if (!Number.isFinite(Math.fround(number))) {
      throw new RangeError("Vector value exceeds the finite float32 range");
    }
    return number;
  });
}

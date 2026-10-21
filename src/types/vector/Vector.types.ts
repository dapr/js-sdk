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

import type { JsonObject } from "@bufbuild/protobuf";

/** Cosine and dot product scores are higher-is-better; Euclidean distances are lower-is-better. */
export type VectorDistanceMetric = "cosine" | "dotProduct" | "euclidean";

export type VectorOptions = {
  /** Component-specific request metadata, separate from the filterable metadata on a record. */
  metadata?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
};

export type VectorCreateCollectionOptions = VectorOptions & {
  /** Positive uint32 dimension count, required for every vector in the collection. */
  dimensions: number;
  /** Omission selects the component's documented default. */
  metric?: VectorDistanceMetric;
};

/** Uses the same acknowledgement and timeout semantics as the Search building block. */
export type VectorIndexingOptions = VectorOptions &
  (
    | { mode?: "returnOnAcceptance"; waitTimeout?: never; onWaitTimeout?: never }
    | {
        mode: "waitForCompletion";
        /** Positive protobuf duration, e.g. "20s" or "0.250s", shorter than the request/resiliency timeout. */
        waitTimeout: string;
        /** A timeout does not guarantee cancellation of provider-side work. */
        onWaitTimeout: "continueAsync" | "failRequest";
      }
  );

/** Queued work can still fail later; this API does not expose its eventual result. */
export type VectorIndexAck = "queued" | "completed";

export type VectorCollection = {
  collection: string;
  /** Approximate count, or zero when unavailable. Counts beyond Number.MAX_SAFE_INTEGER reject. */
  recordCount: number;
  properties: Record<string, string>;
  dimensions: number;
  metric: VectorDistanceMetric;
};

export type VectorRecord = {
  id: string;
  /** Dense float32 values. Empty on retrieval unless includeValues is true. */
  values: readonly number[];
  /** Opaque bytes, returned unchanged. Buffer is also accepted; custom serializers are not used. */
  payload?: Uint8Array;
  /** Structured, filterable JSON attributes; payload is not filterable. */
  metadata?: JsonObject;
};

export type VectorQuery = {
  /** Omitted or zero uses the component's default number of matches. */
  topK?: number;
  /** Portable filter DSL applied to record metadata, including dotted field paths. */
  filter?: JsonObject;
  /** Defaults to false. */
  includeValues?: boolean;
  /** Defaults to false. */
  includePayload?: boolean;
  /** Omission uses the collection's metric. Unsupported overrides fail explicitly. */
  metric?: VectorDistanceMetric;
  /** Inclusive cutoff on the metric's unnormalized scale, not a normalized similarity. */
  scoreThreshold?: number;
} & ({ vector: readonly number[]; byId?: never } | { vector?: never; byId: string });

export type VectorQueryResult = {
  matches: {
    record: VectorRecord;
    score: number;
  }[];
  /** Effective metric used for scores, including when the request omitted metric. */
  metric: VectorDistanceMetric;
};

export type VectorErrorDetail = {
  typeUrl: string;
  /** HTTP: protobuf JSON fields (without @type). gRPC: original protobuf bytes. */
  value: JsonObject | Uint8Array;
};

export type VectorError = {
  /** Canonical non-OK google.rpc.Code (1-16). */
  code: number;
  message: string;
  details: VectorErrorDetail[];
};

export type VectorUpsertResult = {
  ack: VectorIndexAck;
  /** Item failures known at the acknowledgement boundary; inspect even when the call succeeds. */
  failedItems: { id: string; error: VectorError }[];
};

/** One result per input query, in request order. Request-wide failures reject the call. */
export type VectorBatchQueryResult =
  | { response: VectorQueryResult; error?: never }
  | { response?: never; error: VectorError };

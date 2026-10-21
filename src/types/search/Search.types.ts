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

export type SearchOptions = {
  /** Component-specific request metadata, separate from stored document metadata. */
  metadata?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
};

/** Controls when document indexing and deletion return. Omission means acceptance, not completion. */
export type IndexingOptions = SearchOptions &
  (
    | { mode?: "returnOnAcceptance"; waitTimeout?: never; onWaitTimeout?: never }
    | {
        mode: "waitForCompletion";
        /** Positive protobuf duration (for example "20s" or "0.250s"), shorter than the request/resiliency timeout. */
        waitTimeout: string;
        /** A timeout does not necessarily cancel provider-side work. */
        onWaitTimeout: "continueAsync" | "failRequest";
      }
  );

export type SearchDocument<T = unknown> = {
  id: string;
  /** Must serialize to a JSON object for indexing. Omitted when content was not requested. */
  content?: T;
  /** Opaque stored metadata; not indexed, searchable, or filterable. */
  metadata?: Readonly<Record<string, string>>;
};

export type SearchIndex = {
  index: string;
  /** Approximate count, or zero when unavailable. Counts beyond Number.MAX_SAFE_INTEGER reject. */
  documentCount: number;
  properties: Record<string, string>;
};

/** Selects one page. Omitting both text and native matches all documents, subject to filter. */
export type SearchQuery = {
  /** Portable filter object: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $exists, $and, $or, $not. */
  filter?: JsonObject;
  /** Omitted or zero uses the provider's default page size. */
  topK?: number;
  continuationToken?: string;
  returnFields?: readonly string[];
  /** Defaults to false. Projection alone does not request content. */
  includeContent?: boolean;
  searchFields?: readonly string[];
  /** Ordered sort clauses. Omitted order means ascending. */
  sort?: readonly { field: string; order?: "asc" | "desc" }[];
  highlightFields?: readonly string[];
} & ({ text?: string; native?: never } | { text?: never; native: JsonObject });

export type SearchResult<T = unknown> = {
  hits: {
    document: SearchDocument<T>;
    /** Provider-specific, unnormalized relevance score. */
    score: number;
    highlights: Record<string, string>;
  }[];
  /** Absent when unavailable. Counts beyond Number.MAX_SAFE_INTEGER reject. */
  totalHits?: number;
  totalHitsRelation: "unspecified" | "exact" | "lowerBound" | "estimate";
  continuationToken?: string;
};

/** Queued work may still fail later; this API does not expose its eventual result. */
export type IndexAck = "queued" | "completed";

export type IndexDocumentsResult = {
  ack: IndexAck;
  /** Failures known at the acknowledgement boundary; inspect even when the call succeeds. */
  failedItems: {
    id: string;
    /** Canonical non-OK google.rpc.Code. */
    errorCode: number;
    errorMessage: string;
    /** Provider details in protobuf JSON form, including their @type URLs. */
    details: JsonObject[];
  }[];
};

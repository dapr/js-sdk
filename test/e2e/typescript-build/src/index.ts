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

import {
  ConversationCompletionUsage,
  ConversationJsonObject,
  ConversationMessage,
  ConversationRequestAlpha2,
  ConversationResponseAlpha2,
  ConversationToolCalls,
  DaprClient,
  IClientConversation,
  IClientSearch,
  IndexAck,
  IndexDocumentsResult,
  IndexingOptions,
  SearchDocument,
  SearchIndex,
  SearchOptions,
  SearchQuery,
  SearchResult,
  DaprPubSubStatusEnum,
  PubSubStreamingSubscription,
  PubSubStreamingSubscriptionOptions,
  Temporal,
  IClientVector,
  VectorBatchQueryResult,
  VectorCollection,
  VectorCreateCollectionOptions,
  VectorDistanceMetric,
  VectorError,
  VectorErrorDetail,
  VectorIndexAck,
  VectorIndexingOptions,
  VectorOptions,
  VectorQuery,
  VectorQueryResult,
  VectorRecord,
  VectorUpsertResult,
} from "@dapr/dapr";

export async function subscribe(client: DaprClient): Promise<PubSubStreamingSubscription> {
  const options: PubSubStreamingSubscriptionOptions = {
    metadata: { rawPayload: "true" },
    deadLetterTopic: "failed",
    signal: new AbortController().signal,
  };
  return client.pubsub.subscribeStream("pubsub", "topic", async () => DaprPubSubStatusEnum.SUCCESS, options);
}

// @ts-expect-error Streaming subscriptions do not accept server-side routing options.
const _streamRoute: PubSubStreamingSubscriptionOptions = { route: "/events" };

// Compile against the built package's public surface, not this checkout's source or generated types.
export async function converse(client: DaprClient): Promise<ConversationResponseAlpha2> {
  const schema: ConversationJsonObject = {
    type: "object",
    properties: { query: { type: "string" } },
    required: ["query"],
  };
  const messages: ConversationMessage[] = [
    { ofDeveloper: { content: [{ text: "Use tools when needed" }] } },
    { ofSystem: { content: [{ text: "Be concise" }] } },
    { ofUser: { content: [{ text: "What is Dapr?" }] } },
  ];
  const request: ConversationRequestAlpha2 = {
    name: "llm",
    inputs: [{ messages, scrubPii: true }],
    parameters: { custom: [null, true, 42] },
    tools: [{ function: { name: "search", parameters: schema } }],
    responseFormat: schema,
    promptCacheRetention: Temporal.Duration.from({ hours: 24 }),
    maxTokens: 100,
  };
  const conversation: IClientConversation = client.conversation;
  const response = await conversation.converse(request);
  const usage: ConversationCompletionUsage | undefined = response.outputs[0]?.usage;
  const tokens: number | undefined = usage?.totalTokens;
  console.log(tokens);
  const toolCalls: ConversationToolCalls[] = response.outputs[0]?.choices[0]?.message?.toolCalls ?? [];
  if (toolCalls.length > 0) {
    messages.push({ ofAssistant: { toolCalls } });
    messages.push({
      ofTool: { toolId: toolCalls[0].id, name: toolCalls[0].function.name, content: [{ text: "result" }] },
    });
  }
  return response;
}

// @ts-expect-error A message must have exactly one role.
const _twoRoles: ConversationMessage = { ofUser: { content: [] }, ofSystem: { content: [] } };
// @ts-expect-error A message must have a role.
const _noRole: ConversationMessage = {};
// @ts-expect-error Tool arguments remain model-generated strings.
const _parsedArguments: ConversationToolCalls = { function: { name: "search", arguments: {} } };
// @ts-expect-error Cache retention uses Temporal.Duration, not a provider-specific string.
const _rawDuration: ConversationRequestAlpha2 = { name: "llm", inputs: [], promptCacheRetention: "24h" };

export async function vectors(client: DaprClient): Promise<VectorBatchQueryResult[]> {
  const vector: IClientVector = client.vector;
  const metric: VectorDistanceMetric = "cosine";
  const options: VectorOptions = { metadata: { tenant: "test" }, signal: new AbortController().signal };
  const createOptions: VectorCreateCollectionOptions = { ...options, dimensions: 3, metric };
  await vector.createCollection("vectors", "documents", createOptions);
  const collection: VectorCollection = await vector.getCollection("vectors", "documents", options);
  const names: string[] = await vector.listCollections("vectors", options);
  const records: readonly VectorRecord[] = [
    { id: "doc", values: [1, 0, 0], payload: Buffer.from("opaque"), metadata: { nested: { tags: ["docs", null] } } },
  ];
  const writeOptions: VectorIndexingOptions = {
    ...options,
    mode: "waitForCompletion",
    waitTimeout: "5s",
    onWaitTimeout: "failRequest",
  };
  const write: VectorUpsertResult = await vector.upsertVectors("vectors", "documents", records, writeOptions);
  const error: VectorError | undefined = write.failedItems[0]?.error;
  const detail: VectorErrorDetail | undefined = error?.details[0];
  const read: VectorRecord[] = await vector.getVectors("vectors", "documents", ["doc"], { includeValues: true });
  const query: VectorQuery = { vector: [1, 0, 0], topK: 3, includePayload: true, filter: { title: { $exists: true } } };
  const result: VectorQueryResult = await vector.queryVectors("vectors", "documents", query, options);
  const batch = await vector.batchQueryVectors("vectors", "documents", [query, { byId: "doc" }], options);
  const ack: VectorIndexAck = await vector.deleteVectors("vectors", "documents", ["doc"], writeOptions);
  await vector.deleteCollection("vectors", "documents", options);
  console.log(collection, names, detail, read, result, ack);
  return batch;
}

// @ts-expect-error Vector queries require exactly one source.
const _twoVectorSources: VectorQuery = { vector: [1], byId: "doc" };
// @ts-expect-error Vector queries require a source.
const _noVectorSource: VectorQuery = { topK: 10 };
// @ts-expect-error Waiting requires an explicit timeout action.
const _missingTimeoutAction: VectorIndexingOptions = { mode: "waitForCompletion", waitTimeout: "5s" };
// @ts-expect-error Acceptance does not accept wait settings.
const _acceptanceTimeout: VectorIndexingOptions = { mode: "returnOnAcceptance", waitTimeout: "5s" };
// @ts-expect-error Collection dimensions are required.
const _noDimensions: VectorCreateCollectionOptions = { metric: "cosine" };
// @ts-expect-error Payloads are opaque bytes, not application objects.
const _jsonVectorPayload: VectorRecord = { id: "doc", values: [1], payload: { text: "not bytes" } };
// @ts-expect-error A batch slot cannot contain both a response and an error.
const _ambiguousVectorResult: VectorBatchQueryResult = {
  response: { matches: [], metric: "cosine" },
  error: { code: 3, message: "error", details: [] },
};
// @ts-expect-error A batch result cannot omit both discriminants.
const _emptyVectorResult: VectorBatchQueryResult = {};
// @ts-expect-error Request metadata is string-valued, unlike structured record metadata.
const _structuredRequestMetadata: VectorOptions = { metadata: { nested: { key: "value" } } };
// @ts-expect-error Inclusion flags are booleans, not protobuf JSON strings.
const _stringInclusionFlag: VectorQuery = { byId: "doc", includePayload: "false" };
// @ts-expect-error Unsupported metrics cannot silently change query semantics.
const _unknownVectorMetric: VectorQuery = { byId: "doc", metric: "manhattan" };
const _numericVectorTimeout: VectorIndexingOptions = {
  mode: "waitForCompletion",
  // @ts-expect-error Waiting requires a protobuf duration, not a numeric millisecond count.
  waitTimeout: 1000,
  onWaitTimeout: "failRequest",
};
// @ts-expect-error Wait settings require the waitForCompletion mode.
const _implicitVectorWait: VectorIndexingOptions = { waitTimeout: "1s", onWaitTimeout: "continueAsync" };

export function vectorBatchSummary(result: VectorBatchQueryResult): string | number {
  if (result.error !== undefined) return result.error.message;
  return result.response.matches.length;
}

export async function search(client: DaprClient): Promise<SearchResult<{ title: string }>> {
  const search: IClientSearch = client.search;
  const options: SearchOptions = { metadata: { tenant: "sample" }, signal: new AbortController().signal };
  const indexing: IndexingOptions = {
    ...options,
    mode: "waitForCompletion",
    waitTimeout: "20s",
    onWaitTimeout: "failRequest",
  };
  const documents: readonly SearchDocument<{ title: string }>[] = [{ id: "1", content: { title: "Dapr" } }];
  await search.createIndex("store", "products", options);
  const indexed: IndexDocumentsResult = await search.indexDocuments("store", "products", documents, indexing);
  const info: SearchIndex = await search.getIndex("store", "products", options);
  const indexes: string[] = await search.listIndexes("store", options);
  const found = await search.getDocuments<{ title: string }>("store", "products", ["1"], {
    ...options,
    includeContent: true,
  });
  const query: SearchQuery = {
    text: "Dapr",
    includeContent: true,
    filter: { title: { $eq: "Dapr" } },
    sort: [{ field: "title", order: "asc" }],
  };
  const result = await search.search<{ title: string }>("store", "products", query, options);
  const title: string | undefined = result.hits[0]?.document.content?.title;
  const deleted: IndexAck = await search.deleteDocuments("store", "products", ["1"], indexing);
  await search.deleteIndex("store", "products", options);
  console.log(indexed.failedItems, info.documentCount, indexes, found[0]?.content?.title, title, deleted);
  return result;
}

// @ts-expect-error Text and native queries are mutually exclusive.
const _twoSearchKinds: SearchQuery = { text: "Dapr", native: { q: "Dapr" } };
// @ts-expect-error Waiting requires an explicit timeout and timeout action.
const _missingSearchWait: IndexingOptions = { mode: "waitForCompletion" };
// @ts-expect-error Acceptance must not have a wait policy.
const _acceptanceWait: IndexingOptions = { mode: "returnOnAcceptance", waitTimeout: "1s" };
// @ts-expect-error Provider request metadata is string-valued.
const _invalidSearchMetadata: SearchOptions = { metadata: { enabled: true } };
// @ts-expect-error Sort order is an SDK-owned string union, not a protobuf enum.
const _invalidSearchSort: SearchQuery = { sort: [{ field: "title", order: 1 }] };

const daprHost = "127.0.0.1";
const daprPortDefault = "3500";

async function start() {
  const _client = new DaprClient({ daprHost, daprPort: process.env.DAPR_HTTP_PORT ?? daprPortDefault });
  console.log("e2e test to show successful typescript build");
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

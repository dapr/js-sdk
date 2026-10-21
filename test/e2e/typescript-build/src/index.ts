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

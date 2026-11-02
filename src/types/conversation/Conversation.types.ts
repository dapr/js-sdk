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

import type { Temporal } from "@js-temporal/polyfill";

export type ConversationJsonValue = null | boolean | number | string | ConversationJsonValue[] | ConversationJsonObject;

export interface ConversationJsonObject {
  [key: string]: ConversationJsonValue;
}

export interface ConversationMessageContent {
  text: string;
}

export interface ConversationMessageOfDeveloper {
  name?: string;
  content: ConversationMessageContent[];
}

export interface ConversationMessageOfSystem {
  name?: string;
  content: ConversationMessageContent[];
}

export interface ConversationMessageOfUser {
  name?: string;
  content: ConversationMessageContent[];
}

export interface ConversationMessageOfAssistant {
  name?: string;
  content?: ConversationMessageContent[];
  toolCalls?: ConversationToolCalls[];
}

export interface ConversationMessageOfTool {
  toolId?: string;
  name: string;
  content: ConversationMessageContent[];
}

type MessageTypes = {
  ofDeveloper: ConversationMessageOfDeveloper;
  ofSystem: ConversationMessageOfSystem;
  ofUser: ConversationMessageOfUser;
  ofAssistant: ConversationMessageOfAssistant;
  ofTool: ConversationMessageOfTool;
};

/** Exactly one role per message. Tool-only assistant messages may omit content. */
export type ConversationMessage = {
  [Role in keyof MessageTypes]: { [Key in Role]: MessageTypes[Key] } & {
    [Key in Exclude<keyof MessageTypes, Role>]?: never;
  };
}[keyof MessageTypes];

export interface ConversationInputAlpha2 {
  messages: ConversationMessage[];
  /** Obfuscate PII in this input's text. */
  scrubPii?: boolean;
}

export interface ConversationToolsFunction {
  name: string;
  description?: string;
  /** JSON Schema describing the function's arguments. */
  parameters?: ConversationJsonObject;
}

export interface ConversationTools {
  function: ConversationToolsFunction;
}

export interface ConversationToolCallsOfFunction {
  name: string;
  /** Model-generated text; validate before parsing or executing a tool. */
  arguments: string;
}

export interface ConversationToolCalls {
  id?: string;
  function: ConversationToolCallsOfFunction;
}

export interface ConversationRequestAlpha2 {
  name: string;
  /** Correlation value; does not cause the runtime to retain message history. */
  contextId?: string;
  inputs: ConversationInputAlpha2[];
  /** Reserved by Dapr. JSON values are encoded internally as protobuf Value messages. */
  parameters?: ConversationJsonObject;
  metadata?: Record<string, string>;
  temperature?: number;
  /** Obfuscate PII in response text. */
  scrubPii?: boolean;
  tools?: ConversationTools[];
  /** "auto", "none", "required", or an exact function name. */
  toolChoice?: string;
  responseFormat?: ConversationJsonObject;
  /** Nonnegative fixed duration; calendar years, months, and weeks are not supported. */
  promptCacheRetention?: Temporal.Duration;
  /** Positive integer up to 2147483647. Requires Dapr 1.19 or later. */
  maxTokens?: number;
}

export interface ConversationResultMessage {
  content: string;
  toolCalls: ConversationToolCalls[];
}

export interface ConversationResultChoices {
  /** Usually "stop", "length", "tool_calls", or "content_filter". */
  finishReason: string;
  index: number;
  message?: ConversationResultMessage;
}

export interface ConversationCompletionTokensDetails {
  acceptedPredictionTokens: number;
  audioTokens: number;
  reasoningTokens: number;
  rejectedPredictionTokens: number;
}

export interface ConversationPromptTokensDetails {
  audioTokens: number;
  cachedTokens: number;
}

/** Counts are safe JavaScript integers; out-of-range responses reject instead of losing precision. */
export interface ConversationCompletionUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
  completionTokensDetails?: ConversationCompletionTokensDetails;
  promptTokensDetails?: ConversationPromptTokensDetails;
}

export interface ConversationResultAlpha2 {
  choices: ConversationResultChoices[];
  model?: string;
  usage?: ConversationCompletionUsage;
}

export interface ConversationResponseAlpha2 {
  contextId?: string;
  outputs: ConversationResultAlpha2[];
}

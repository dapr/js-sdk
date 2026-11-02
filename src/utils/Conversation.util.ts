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

import { create, createRegistry, fromJson, fromJsonString, toJson } from "@bufbuild/protobuf";
import { anyPack, ValueSchema } from "@bufbuild/protobuf/wkt";
import { Temporal } from "@js-temporal/polyfill";
import * as Proto from "../proto/dapr/proto/runtime/v1/ai_pb";
import {
  ConversationJsonObject,
  ConversationJsonValue,
  ConversationMessage,
  ConversationRequestAlpha2,
  ConversationResponseAlpha2,
  ConversationToolCalls,
} from "../types/conversation/Conversation.types";

const parameterRegistry = createRegistry(ValueSchema);

export function toConversationRequest(request: ConversationRequestAlpha2): Proto.ConversationRequestAlpha2 {
  if (typeof request.name !== "string" || request.name.trim() === "") {
    throw new TypeError("Conversation component name is required");
  }
  if (!Array.isArray(request.inputs) || request.inputs.length === 0) {
    throw new TypeError("Conversation inputs must contain at least one input");
  }
  if (request.temperature !== undefined && !Number.isFinite(request.temperature)) {
    throw new RangeError("Conversation temperature must be finite");
  }
  if (
    request.maxTokens !== undefined &&
    (!Number.isInteger(request.maxTokens) || request.maxTokens <= 0 || request.maxTokens > 2147483647)
  ) {
    throw new RangeError("Conversation maxTokens must be an integer between 1 and 2147483647");
  }
  if (request.responseFormat !== undefined) {
    validateJsonObject(request.responseFormat);
  }
  if (request.parameters !== undefined) {
    validateJsonObject(request.parameters);
  }
  const parameters = Object.fromEntries(
    Object.entries(request.parameters ?? {}).map(([key, value]) => [
      key,
      anyPack(ValueSchema, fromJson(ValueSchema, value)),
    ]),
  );
  return create(Proto.ConversationRequestAlpha2Schema, {
    name: request.name,
    contextId: request.contextId,
    inputs: request.inputs.map((input) => {
      if (!Array.isArray(input.messages) || input.messages.length === 0) {
        throw new TypeError("Conversation input messages must contain at least one message");
      }
      return { scrubPii: input.scrubPii, messages: input.messages.map(toMessage) };
    }),
    parameters,
    metadata: request.metadata,
    temperature: request.temperature,
    scrubPii: request.scrubPii,
    tools: request.tools?.map((tool) => {
      if (!tool.function || typeof tool.function.name !== "string" || tool.function.name.trim() === "") {
        throw new TypeError("Conversation tool function name is required");
      }
      if (tool.function.parameters !== undefined) {
        validateJsonObject(tool.function.parameters);
      }
      return create(Proto.ConversationToolsSchema, { toolTypes: { case: "function", value: tool.function } });
    }),
    toolChoice: request.toolChoice,
    responseFormat: request.responseFormat,
    promptCacheRetention:
      request.promptCacheRetention === undefined ? undefined : toDuration(request.promptCacheRetention),
    maxTokens: request.maxTokens === undefined ? undefined : BigInt(request.maxTokens),
  });
}

function toMessage(message: ConversationMessage): Proto.ConversationMessage {
  const roles = ["ofDeveloper", "ofSystem", "ofUser", "ofAssistant", "ofTool"] as const;
  if (message === null || typeof message !== "object") {
    throw new TypeError("Conversation message must be an object");
  }
  const selectedRoles = roles.filter((role) => message[role] !== undefined);
  if (selectedRoles.length !== 1) {
    throw new TypeError("Conversation message must specify exactly one role");
  }
  const payload = message[selectedRoles[0]];
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Conversation role must contain a message object");
  }
  if (
    (payload.content === undefined && selectedRoles[0] !== "ofAssistant") ||
    (payload.content !== undefined &&
      (!Array.isArray(payload.content) ||
        payload.content.some((part) => part === null || typeof part !== "object" || typeof part.text !== "string")))
  ) {
    throw new TypeError("Conversation content must be an array of text messages");
  }
  if (
    (payload.name !== undefined && typeof payload.name !== "string") ||
    (selectedRoles[0] === "ofTool" && (typeof payload.name !== "string" || payload.name.trim() === ""))
  ) {
    throw new TypeError("Conversation participant names must be strings and tool names must not be empty");
  }
  if (message.ofDeveloper !== undefined) {
    return create(Proto.ConversationMessageSchema, {
      messageTypes: { case: "ofDeveloper", value: message.ofDeveloper },
    });
  }
  if (message.ofSystem !== undefined) {
    return create(Proto.ConversationMessageSchema, {
      messageTypes: { case: "ofSystem", value: message.ofSystem },
    });
  }
  if (message.ofUser !== undefined) {
    return create(Proto.ConversationMessageSchema, {
      messageTypes: { case: "ofUser", value: message.ofUser },
    });
  }
  if (message.ofAssistant !== undefined) {
    return create(Proto.ConversationMessageSchema, {
      messageTypes: {
        case: "ofAssistant",
        value: {
          name: message.ofAssistant.name,
          content: message.ofAssistant.content,
          toolCalls: message.ofAssistant.toolCalls?.map(toToolCall),
        },
      },
    });
  }
  if (message.ofTool !== undefined) {
    return create(Proto.ConversationMessageSchema, { messageTypes: { case: "ofTool", value: message.ofTool } });
  }
  throw new TypeError("Conversation message must specify a supported role");
}

function toToolCall(call: ConversationToolCalls): Proto.ConversationToolCalls {
  if (
    !call.function ||
    typeof call.function.name !== "string" ||
    call.function.name.trim() === "" ||
    typeof call.function.arguments !== "string"
  ) {
    throw new TypeError("Conversation tool call requires a function name and string arguments");
  }
  return create(Proto.ConversationToolCallsSchema, {
    id: call.id,
    toolTypes: { case: "function", value: call.function },
  });
}

function toDuration(value: Temporal.Duration) {
  const duration = Temporal.Duration.from(value);
  if (duration.sign < 0 || duration.years !== 0 || duration.months !== 0 || duration.weeks !== 0) {
    throw new RangeError("Conversation promptCacheRetention must be a nonnegative fixed duration");
  }
  const fields = [
    duration.days,
    duration.hours,
    duration.minutes,
    duration.seconds,
    duration.milliseconds,
    duration.microseconds,
    duration.nanoseconds,
  ];
  if (!fields.every(Number.isSafeInteger)) {
    throw new RangeError("Conversation promptCacheRetention fields must be safe integers");
  }
  const nanoseconds =
    (BigInt(duration.days) * 86400n +
      BigInt(duration.hours) * 3600n +
      BigInt(duration.minutes) * 60n +
      BigInt(duration.seconds)) *
      1_000_000_000n +
    BigInt(duration.milliseconds) * 1_000_000n +
    BigInt(duration.microseconds) * 1000n +
    BigInt(duration.nanoseconds);
  if (nanoseconds > 315_576_000_000n * 1_000_000_000n) {
    throw new RangeError("Conversation promptCacheRetention exceeds the protobuf duration range");
  }
  return { seconds: nanoseconds / 1_000_000_000n, nanos: Number(nanoseconds % 1_000_000_000n) };
}

function validateJson(value: ConversationJsonValue, ancestors = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return;
  }
  if (
    typeof value !== "object" ||
    (!Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new TypeError("Conversation schemas and parameters must contain only finite JSON values");
  }
  if (ancestors.has(value)) {
    throw new TypeError("Conversation schemas and parameters must not contain cycles");
  }
  ancestors.add(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    validateJson(child, ancestors);
  }
  ancestors.delete(value);
}

function validateJsonObject(value: ConversationJsonObject): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Conversation schemas and parameters must be JSON objects");
  }
  validateJson(value);
}

export function toConversationHttpBody(request: Proto.ConversationRequestAlpha2) {
  const body = toJson(Proto.ConversationRequestAlpha2Schema, request, { registry: parameterRegistry });
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new TypeError("Conversation request must serialize to a JSON object");
  }
  delete body.name;
  return body;
}

export function fromConversationHttpResponse(response: object | string): ConversationResponseAlpha2 {
  const message = fromJsonString(
    Proto.ConversationResponseAlpha2Schema,
    typeof response === "string" ? response : JSON.stringify(response),
    { ignoreUnknownFields: true },
  );
  return fromConversationResponse(message);
}

export function fromConversationResponse(response: Proto.ConversationResponseAlpha2): ConversationResponseAlpha2 {
  return {
    contextId: response.contextId,
    outputs: response.outputs.map((output) => ({
      choices: output.choices.map((choice) => ({
        finishReason: choice.finishReason,
        index: safeInteger(choice.index, "choice index"),
        message:
          choice.message === undefined
            ? undefined
            : { content: choice.message.content, toolCalls: choice.message.toolCalls.map(fromToolCall) },
      })),
      model: output.model,
      usage:
        output.usage === undefined
          ? undefined
          : {
              completionTokens: safeInteger(output.usage.completionTokens, "completionTokens"),
              promptTokens: safeInteger(output.usage.promptTokens, "promptTokens"),
              totalTokens: safeInteger(output.usage.totalTokens, "totalTokens"),
              completionTokensDetails:
                output.usage.completionTokensDetails === undefined
                  ? undefined
                  : {
                      acceptedPredictionTokens: safeInteger(
                        output.usage.completionTokensDetails.acceptedPredictionTokens,
                        "acceptedPredictionTokens",
                      ),
                      audioTokens: safeInteger(output.usage.completionTokensDetails.audioTokens, "audioTokens"),
                      reasoningTokens: safeInteger(
                        output.usage.completionTokensDetails.reasoningTokens,
                        "reasoningTokens",
                      ),
                      rejectedPredictionTokens: safeInteger(
                        output.usage.completionTokensDetails.rejectedPredictionTokens,
                        "rejectedPredictionTokens",
                      ),
                    },
              promptTokensDetails:
                output.usage.promptTokensDetails === undefined
                  ? undefined
                  : {
                      audioTokens: safeInteger(output.usage.promptTokensDetails.audioTokens, "audioTokens"),
                      cachedTokens: safeInteger(output.usage.promptTokensDetails.cachedTokens, "cachedTokens"),
                    },
            },
    })),
  };
}

function fromToolCall(call: Proto.ConversationToolCalls): ConversationToolCalls {
  if (call.toolTypes.case !== "function") {
    throw new TypeError("Unsupported conversation tool call: expected a function");
  }
  return {
    id: call.id,
    function: { name: call.toolTypes.value.name, arguments: call.toolTypes.value.arguments },
  };
}

function safeInteger(value: bigint, field: string): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw new RangeError(`Conversation ${field} exceeds JavaScript safe integer precision`);
  }
  return number;
}

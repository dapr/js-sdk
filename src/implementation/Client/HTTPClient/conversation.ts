/*
Copyright 2025 The Dapr Authors
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

import HTTPClient from "./HTTPClient";
import IClientConversation from "../../../interfaces/Client/IClientConversation";
import {
  ConversationOptions,
  ConversationResponse,
  ConversationInput,
  ConversationResult,
  ConversationResultChoice,
  ConversationResultToolCall,
} from "../../../types/conversation/Conversation.type";
import { Logger } from "../../../logger/Logger";

// https://docs.dapr.io/reference/api/conversation_api/
export default class HTTPClientConversation implements IClientConversation {
  private readonly client: HTTPClient;
  private readonly logger: Logger;

  constructor(client: HTTPClient) {
    this.client = client;
    this.logger = new Logger("HTTPClient", "Conversation", client.options.logger);
  }

  async converse(
    conversationComponentName: string,
    inputs: ConversationInput[],
    options?: ConversationOptions,
  ): Promise<ConversationResponse> {
    const body = this.buildRequestBody(inputs, options);

    try {
      const result = await this.client.executeWithApiVersion(
        "v1.0-alpha2",
        `/conversation/${conversationComponentName}/converse`,
        {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
        },
      );

      return this.mapResponse(result);
    } catch (e: any) {
      this.logger.error(`Error in conversation: ${e.message}`);
      throw e;
    }
  }

  private buildRequestBody(inputs: ConversationInput[], options?: ConversationOptions): object {
    const body: Record<string, unknown> = {};

    if (options?.contextId) {
      body.contextID = options.contextId;
    }

    body.inputs = inputs.map((input) => ({
      messages: input.messages.map((msg) => {
        switch (msg.role) {
          case "developer":
            return { ofDeveloper: { name: msg.name, content: msg.content } };
          case "system":
            return { ofSystem: { name: msg.name, content: msg.content } };
          case "user":
            return { ofUser: { name: msg.name, content: msg.content } };
          case "assistant":
            return {
              ofAssistant: {
                name: msg.name,
                content: msg.content,
                toolCalls: msg.toolCalls?.map((tc) => ({
                  id: tc.id,
                  function: tc.function,
                })),
              },
            };
          case "tool":
            return { ofTool: { toolId: msg.toolId, name: msg.name, content: msg.content } };
        }
      }),
      scrubPII: input.scrubPii,
    }));

    if (options?.metadata) {
      body.metadata = options.metadata;
    }

    if (options?.scrubPii !== undefined) {
      body.scrubPII = options.scrubPii;
    }

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (options?.tools?.length) {
      body.tools = options.tools.map((tool) => ({
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        },
      }));
    }

    if (options?.toolChoice) {
      body.toolChoice = options.toolChoice;
    }

    if (options?.promptCacheRetention) {
      body.promptCacheRetention = options.promptCacheRetention;
    }

    if (options?.responseFormat) {
      body.responseFormat = options.responseFormat;
    }

    return body;
  }

  private mapResponse(result: unknown): ConversationResponse {
    const res = result as Record<string, unknown>;

    const outputs: ConversationResult[] = ((res.outputs as any[]) ?? []).map((output: any) => {
      const choices: ConversationResultChoice[] = (output.choices ?? []).map((choice: any) => {
        const toolCalls: ConversationResultToolCall[] | undefined = choice.message?.toolCalls?.map((tc: any) => ({
          id: tc.id,
          function: tc.function,
        }));

        return {
          finishReason: choice.finishReason ?? choice.finish_reason ?? "",
          index: choice.index ?? 0,
          message: choice.message
            ? {
                content: choice.message.content ?? "",
                toolCalls: toolCalls?.length ? toolCalls : undefined,
              }
            : undefined,
        };
      });

      return { choices };
    });

    return {
      contextId: (res.contextID as string) ?? (res.context_id as string) ?? undefined,
      outputs,
    };
  }
}

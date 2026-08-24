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

import { create } from "@bufbuild/protobuf";
import type { JsonObject } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import IClientConversation from "../../../interfaces/Client/IClientConversation";
import {
  ConversationRequestAlpha2Schema,
  ConversationInputAlpha2Schema,
  ConversationMessageSchema,
  ConversationMessageContentSchema,
  ConversationMessageOfDeveloperSchema,
  ConversationMessageOfSystemSchema,
  ConversationMessageOfUserSchema,
  ConversationMessageOfAssistantSchema,
  ConversationMessageOfToolSchema,
  ConversationToolsSchema,
  ConversationToolsFunctionSchema,
  ConversationToolCallsSchema,
  ConversationToolCallsOfFunctionSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import type {
  ConversationInputAlpha2,
  ConversationMessage as ProtoConversationMessage,
  ConversationTools as ProtoConversationTools,
  ConversationResponseAlpha2,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import {
  ConversationOptions,
  ConversationResponse,
  ConversationInput,
  ConversationMessage,
  ConversationTool,
  ConversationResultChoice,
  ConversationResult,
  ConversationResultToolCall,
} from "../../../types/conversation/Conversation.type";

// https://docs.dapr.io/reference/api/conversation_api/
export default class GRPCClientConversation implements IClientConversation {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async converse(
    conversationComponentName: string,
    inputs: ConversationInput[],
    options?: ConversationOptions,
  ): Promise<ConversationResponse> {
    const client = await this.client.getClient();

    const protoInputs = inputs.map((input) => this.buildInput(input));
    const protoTools = (options?.tools ?? []).map((tool) => this.buildTool(tool));

    const protoRequest = create(ConversationRequestAlpha2Schema, {
      name: conversationComponentName,
      contextId: options?.contextId,
      inputs: protoInputs,
      metadata: options?.metadata ?? {},
      scrubPii: options?.scrubPii,
      temperature: options?.temperature,
      tools: protoTools,
      toolChoice: options?.toolChoice,
    });

    const res: ConversationResponseAlpha2 = await client.converseAlpha2(protoRequest);

    return this.mapResponse(res);
  }

  private buildInput(input: ConversationInput): ConversationInputAlpha2 {
    const messages = input.messages.map((msg) => this.buildMessage(msg));
    return create(ConversationInputAlpha2Schema, {
      messages,
      scrubPii: input.scrubPii,
    });
  }

  private buildMessage(msg: ConversationMessage): ProtoConversationMessage {
    const contentItems = msg.content.map((c) => create(ConversationMessageContentSchema, { text: c.text }));

    switch (msg.role) {
      case "developer":
        return create(ConversationMessageSchema, {
          messageTypes: {
            case: "ofDeveloper",
            value: create(ConversationMessageOfDeveloperSchema, {
              name: msg.name,
              content: contentItems,
            }),
          },
        });
      case "system":
        return create(ConversationMessageSchema, {
          messageTypes: {
            case: "ofSystem",
            value: create(ConversationMessageOfSystemSchema, {
              name: msg.name,
              content: contentItems,
            }),
          },
        });
      case "user":
        return create(ConversationMessageSchema, {
          messageTypes: {
            case: "ofUser",
            value: create(ConversationMessageOfUserSchema, {
              name: msg.name,
              content: contentItems,
            }),
          },
        });
      case "assistant": {
        const toolCalls = (msg.toolCalls ?? []).map((tc) =>
          create(ConversationToolCallsSchema, {
            id: tc.id,
            toolTypes: tc.function
              ? {
                  case: "function",
                  value: create(ConversationToolCallsOfFunctionSchema, {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                  }),
                }
              : { case: undefined, value: undefined },
          }),
        );
        return create(ConversationMessageSchema, {
          messageTypes: {
            case: "ofAssistant",
            value: create(ConversationMessageOfAssistantSchema, {
              name: msg.name,
              content: contentItems,
              toolCalls,
            }),
          },
        });
      }
      case "tool":
        return create(ConversationMessageSchema, {
          messageTypes: {
            case: "ofTool",
            value: create(ConversationMessageOfToolSchema, {
              toolId: msg.toolId,
              name: msg.name,
              content: contentItems,
            }),
          },
        });
    }
  }

  private buildTool(tool: ConversationTool): ProtoConversationTools {
    return create(ConversationToolsSchema, {
      toolTypes: {
        case: "function",
        value: create(ConversationToolsFunctionSchema, {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters as JsonObject | undefined,
        }),
      },
    });
  }

  private mapResponse(res: ConversationResponseAlpha2): ConversationResponse {
    const outputs: ConversationResult[] = (res.outputs ?? []).map((output) => {
      const choices: ConversationResultChoice[] = (output.choices ?? []).map((choice) => {
        const toolCalls: ConversationResultToolCall[] | undefined = choice.message?.toolCalls?.map((tc) => ({
          id: tc.id,
          function:
            tc.toolTypes.case === "function"
              ? { name: tc.toolTypes.value.name, arguments: tc.toolTypes.value.arguments }
              : undefined,
        }));

        return {
          finishReason: choice.finishReason,
          index: Number(choice.index),
          message: choice.message
            ? {
                content: choice.message.content,
                toolCalls: toolCalls?.length ? toolCalls : undefined,
              }
            : undefined,
        };
      });

      return { choices };
    });

    return {
      contextId: res.contextId,
      outputs,
    };
  }
}

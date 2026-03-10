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

import HTTPClient from "./HTTPClient";
import IClientConversation from "../../../interfaces/Client/IClientConversation";
import { ConversationInput } from "../../../types/conversation/ConversationInput.type";
import { ConversationOptions } from "../../../types/conversation/ConversationOptions.type";
import { ConversationResponse } from "../../../types/conversation/ConversationResponse.type";
import { PropertyRequiredError } from "../../../errors/PropertyRequiredError";

// https://docs.dapr.io/reference/api/conversation_api/
export default class HTTPClientConversation implements IClientConversation {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async converse(name: string, inputs: ConversationInput[], options: ConversationOptions = {}): Promise<ConversationResponse> {
    if (!name) {
      throw new PropertyRequiredError("name");
    }

    // JS camelCase options are mapped to snake_case for the Dapr HTTP API.
    // Only defined options are included in the body to avoid overriding component defaults.
    const body: Record<string, any> = {
      inputs: inputs.map((input) => ({
        messages: input.messages,
        scrub_pii: input.scrubPII,
      })),
    };

    if (options.contextId !== undefined) body["context_id"] = options.contextId;
    if (options.scrubPII !== undefined) body["scrub_pii"] = options.scrubPII;
    if (options.temperature !== undefined) body["temperature"] = options.temperature;
    if (options.metadata !== undefined) body["metadata"] = options.metadata;
    if (options.parameters !== undefined) body["parameters"] = options.parameters;
    if (options.tools !== undefined) body["tools"] = options.tools;
    if (options.toolChoice !== undefined) body["tool_choice"] = options.toolChoice;
    if (options.responseFormat !== undefined) body["response_format"] = options.responseFormat;
    if (options.promptCacheRetention !== undefined) body["prompt_cache_retention"] = options.promptCacheRetention;

    const result = (await this.client.executeWithApiVersion("v1.0-alpha2", `/conversation/${name}/converse`, {
      method: "POST",
      body,
    })) as Record<string, any>;

    return {
      contextId: result["context_id"],
      outputs: result["outputs"] ?? [],
      model: result["model"],
      usage: result["usage"]
        ? {
            inputTokens: result["usage"]["input_tokens"],
            outputTokens: result["usage"]["output_tokens"],
            totalTokens: result["usage"]["total_tokens"],
          }
        : undefined,
    };
  }
}

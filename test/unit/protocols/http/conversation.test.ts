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

import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import HTTPClientConversation from "../../../../src/implementation/Client/HTTPClient/conversation";
import { PropertyRequiredError } from "../../../../src/errors/PropertyRequiredError";
import { ConversationInput } from "../../../../src/types/conversation/ConversationInput.type";
import { ConversationOptions } from "../../../../src/types/conversation/ConversationOptions.type";

describe("conversation - HTTP", () => {
  const client = new HTTPClient({
    daprHost: "127.0.0.1",
    daprPort: "3500",
    communicationProtocol: 0,
  });
  const conversation = new HTTPClientConversation(client);

  const userInput: ConversationInput = {
    messages: [{ of_user: { content: [{ text: "Hello" }] } }],
  };

  it("should throw PropertyRequiredError when name is not provided", async () => {
    await expect(conversation.converse("", [userInput])).rejects.toThrow(PropertyRequiredError);
  });

  it("should return parsed outputs from the response", async () => {
    jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({
      outputs: [
        {
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: { content: "Hi!", tool_calls: [] },
            },
          ],
        },
      ],
    });

    const result = await conversation.converse("my-llm", [userInput]);

    expect(result.outputs).toHaveLength(1);
    expect(result.outputs?.[0].choices).toHaveLength(1);
    expect(result.outputs?.[0].choices?.[0].finishReason).toBe("stop");
    expect(result.outputs?.[0].choices?.[0].message?.content).toBe("Hi!");
    expect(result.contextId).toBeUndefined();
  });

  it("should include response_format in request body when provided", async () => {
    const spy = jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({ outputs: [] });
    const options: ConversationOptions = { responseFormat: { type: "json_object" } };

    await conversation.converse("my-llm", [userInput], options);

    expect(spy).toHaveBeenCalledWith(
      "v1.0-alpha2",
      "/conversation/my-llm/converse",
      expect.objectContaining({ body: expect.objectContaining({ response_format: { type: "json_object" } }) }),
    );
  });

  it("should include prompt_cache_retention in request body when provided", async () => {
    const spy = jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({ outputs: [] });
    const options: ConversationOptions = { promptCacheRetention: "10m" };

    await conversation.converse("my-llm", [userInput], options);

    expect(spy).toHaveBeenCalledWith(
      "v1.0-alpha2",
      "/conversation/my-llm/converse",
      expect.objectContaining({ body: expect.objectContaining({ prompt_cache_retention: "10m" }) }),
    );
  });

  it("should parse model from response output", async () => {
    jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({
      outputs: [{ choices: [], model: "gpt-4o" }],
    });

    const result = await conversation.converse("my-llm", [userInput]);

    expect(result.outputs?.[0].model).toBe("gpt-4o");
  });

  it("should parse usage from response output", async () => {
    jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({
      outputs: [
        {
          choices: [],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        },
      ],
    });

    const result = await conversation.converse("my-llm", [userInput]);

    expect(result.outputs?.[0].usage).toEqual({
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      completionTokensDetails: undefined,
      promptTokensDetails: undefined,
    });
  });

  it("should parse usage details from response output", async () => {
    jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({
      outputs: [
        {
          choices: [],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
            prompt_tokens_details: {
              audio_tokens: 5,
              cached_tokens: 20,
            },
            completion_tokens_details: {
              accepted_prediction_tokens: 10,
              audio_tokens: 3,
              reasoning_tokens: 15,
              rejected_prediction_tokens: 2,
            },
          },
        },
      ],
    });

    const result = await conversation.converse("my-llm", [userInput]);

    expect(result.outputs?.[0].usage).toEqual({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      promptTokensDetails: {
        audioTokens: 5,
        cachedTokens: 20,
      },
      completionTokensDetails: {
        acceptedPredictionTokens: 10,
        audioTokens: 3,
        reasoningTokens: 15,
        rejectedPredictionTokens: 2,
      },
    });
  });

  it("should map options fields to snake_case request body", async () => {
    const spy = jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({ outputs: [] });
    const options: ConversationOptions = {
      contextId: "ctx-123",
      scrubPII: true,
      temperature: 0.7,
      metadata: { key: "value" },
      toolChoice: "auto",
    };

    await conversation.converse("my-llm", [userInput], options);

    expect(spy).toHaveBeenCalledWith(
      "v1.0-alpha2",
      "/conversation/my-llm/converse",
      expect.objectContaining({
        body: expect.objectContaining({
          context_id: "ctx-123",
          scrub_pii: true,
          temperature: 0.7,
          metadata: { key: "value" },
          tool_choice: "auto",
        }),
      }),
    );
  });

  it("should parse context_id from response", async () => {
    jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({ outputs: [], context_id: "ctx-abc" });

    const result = await conversation.converse("my-llm", [userInput]);

    expect(result.contextId).toBe("ctx-abc");
  });

  it("should map scrubPII on inputs to snake_case", async () => {
    const spy = jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({ outputs: [] });
    const inputWithScrub: ConversationInput = { messages: [{ of_user: { content: [{ text: "secret" }] } }], scrubPII: true };

    await conversation.converse("my-llm", [inputWithScrub]);

    expect(spy).toHaveBeenCalledWith(
      "v1.0-alpha2",
      "/conversation/my-llm/converse",
      expect.objectContaining({
        body: expect.objectContaining({
          inputs: [expect.objectContaining({ scrub_pii: true })],
        }),
      }),
    );
  });

  it("should parse choice with message and tool_calls", async () => {
    jest.spyOn(client, "executeWithApiVersion").mockResolvedValueOnce({
      outputs: [
        {
          choices: [
            {
              index: 0,
              finish_reason: "tool_calls",
              message: {
                content: "Let me check that for you.",
                tool_calls: [{ id: "call_123", function: { name: "get_weather", arguments: '{"location":"NYC"}' } }],
              },
            },
          ],
        },
      ],
    });

    const result = await conversation.converse("my-llm", [userInput]);

    expect(result.outputs?.[0].choices?.[0].message?.content).toBe("Let me check that for you.");
    expect(result.outputs?.[0].choices?.[0].message?.toolCalls).toHaveLength(1);
    expect(result.outputs?.[0].choices?.[0].message?.toolCalls?.[0].id).toBe("call_123");
    expect(result.outputs?.[0].choices?.[0].message?.toolCalls?.[0].function?.name).toBe("get_weather");
  });
});

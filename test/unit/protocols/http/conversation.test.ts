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

import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import HTTPClientConversation from "../../../../src/implementation/Client/HTTPClient/conversation";
import {
  ConversationInput,
  ConversationOptions,
} from "../../../../src/types/conversation/Conversation.type";

describe("http/conversation", () => {
  let client: HTTPClient;
  let conversation: HTTPClientConversation;
  let executeSpy: jest.SpyInstance;

  beforeEach(() => {
    client = new HTTPClient({
      daprHost: "",
      daprPort: "",
      communicationProtocol: 0,
    });
    conversation = new HTTPClientConversation(client);
    executeSpy = jest.spyOn(client, "executeWithApiVersion").mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("converse with minimal inputs", () => {
    it("should call executeWithApiVersion with correct URL and method", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "Hello" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      expect(executeSpy).toHaveBeenCalledWith(
        "v1.0-alpha2",
        "/conversation/my-llm/converse",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("should build request body with single user message", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "Hello" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body).toEqual({
        inputs: [
          {
            messages: [{ ofUser: { name: undefined, content: [{ text: "Hello" }] } }],
            scrubPII: undefined,
          },
        ],
      });
    });
  });

  describe("converse with all message roles", () => {
    it("should map developer message correctly", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "developer", name: "dev1", content: [{ text: "dev msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs[0].messages[0]).toEqual({
        ofDeveloper: { name: "dev1", content: [{ text: "dev msg" }] },
      });
    });

    it("should map system message correctly", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "system", name: "sys1", content: [{ text: "system msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs[0].messages[0]).toEqual({
        ofSystem: { name: "sys1", content: [{ text: "system msg" }] },
      });
    });

    it("should map user message correctly", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", name: "usr1", content: [{ text: "user msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs[0].messages[0]).toEqual({
        ofUser: { name: "usr1", content: [{ text: "user msg" }] },
      });
    });

    it("should map assistant message correctly", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "assistant", name: "asst", content: [{ text: "assistant msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs[0].messages[0]).toEqual({
        ofAssistant: { name: "asst", content: [{ text: "assistant msg" }], toolCalls: undefined },
      });
    });

    it("should map assistant message with tool calls", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "assistant",
              name: "asst",
              content: [{ text: "calling tool" }],
              toolCalls: [
                { id: "tc-1", function: { name: "getWeather", arguments: '{"city":"NYC"}' } },
              ],
            },
          ],
        },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs[0].messages[0]).toEqual({
        ofAssistant: {
          name: "asst",
          content: [{ text: "calling tool" }],
          toolCalls: [
            { id: "tc-1", function: { name: "getWeather", arguments: '{"city":"NYC"}' } },
          ],
        },
      });
    });

    it("should map tool message correctly", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            { role: "tool", toolId: "tc-1", name: "getWeather", content: [{ text: "sunny" }] },
          ],
        },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs[0].messages[0]).toEqual({
        ofTool: { toolId: "tc-1", name: "getWeather", content: [{ text: "sunny" }] },
      });
    });

    it("should handle all roles in a single input", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            { role: "developer", content: [{ text: "dev" }] },
            { role: "system", content: [{ text: "sys" }] },
            { role: "user", content: [{ text: "usr" }] },
            { role: "assistant", content: [{ text: "asst" }] },
            { role: "tool", name: "fn", content: [{ text: "tool" }] },
          ],
        },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      const messages = body.inputs[0].messages;
      expect(messages).toHaveLength(5);
      expect(messages[0]).toHaveProperty("ofDeveloper");
      expect(messages[1]).toHaveProperty("ofSystem");
      expect(messages[2]).toHaveProperty("ofUser");
      expect(messages[3]).toHaveProperty("ofAssistant");
      expect(messages[4]).toHaveProperty("ofTool");
    });
  });

  describe("converse with options", () => {
    const minimalInputs: ConversationInput[] = [
      { messages: [{ role: "user", content: [{ text: "hi" }] }] },
    ];

    it("should include contextId as contextID", async () => {
      await conversation.converse("my-llm", minimalInputs, { contextId: "ctx-123" });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.contextID).toBe("ctx-123");
    });

    it("should include metadata", async () => {
      await conversation.converse("my-llm", minimalInputs, {
        metadata: { key1: "val1", key2: "val2" },
      });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.metadata).toEqual({ key1: "val1", key2: "val2" });
    });

    it("should map scrubPii to scrubPII", async () => {
      await conversation.converse("my-llm", minimalInputs, { scrubPii: true });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.scrubPII).toBe(true);
    });

    it("should include scrubPii when false", async () => {
      await conversation.converse("my-llm", minimalInputs, { scrubPii: false });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.scrubPII).toBe(false);
    });

    it("should include temperature", async () => {
      await conversation.converse("my-llm", minimalInputs, { temperature: 0.7 });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.temperature).toBe(0.7);
    });

    it("should include temperature when 0", async () => {
      await conversation.converse("my-llm", minimalInputs, { temperature: 0 });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.temperature).toBe(0);
    });

    it("should include tools", async () => {
      const options: ConversationOptions = {
        tools: [
          {
            function: {
              name: "getWeather",
              description: "Get weather info",
              parameters: { type: "object", properties: { city: { type: "string" } } },
            },
          },
        ],
      };

      await conversation.converse("my-llm", minimalInputs, options);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.tools).toEqual([
        {
          function: {
            name: "getWeather",
            description: "Get weather info",
            parameters: { type: "object", properties: { city: { type: "string" } } },
          },
        },
      ]);
    });

    it("should not include tools when array is empty", async () => {
      await conversation.converse("my-llm", minimalInputs, { tools: [] });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.tools).toBeUndefined();
    });

    it("should include toolChoice", async () => {
      await conversation.converse("my-llm", minimalInputs, { toolChoice: "auto" });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.toolChoice).toBe("auto");
    });

    it("should include promptCacheRetention", async () => {
      await conversation.converse("my-llm", minimalInputs, { promptCacheRetention: "5m" });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.promptCacheRetention).toBe("5m");
    });

    it("should include responseFormat", async () => {
      await conversation.converse("my-llm", minimalInputs, {
        responseFormat: { type: "json_object" },
      });

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.responseFormat).toEqual({ type: "json_object" });
    });

    it("should include all options at once", async () => {
      const options: ConversationOptions = {
        contextId: "ctx-1",
        metadata: { k: "v" },
        scrubPii: true,
        temperature: 1.5,
        tools: [{ function: { name: "fn1" } }],
        toolChoice: "required",
        promptCacheRetention: "1h",
        responseFormat: { type: "text" },
      };

      await conversation.converse("my-llm", minimalInputs, options);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.contextID).toBe("ctx-1");
      expect(body.metadata).toEqual({ k: "v" });
      expect(body.scrubPII).toBe(true);
      expect(body.temperature).toBe(1.5);
      expect(body.tools).toHaveLength(1);
      expect(body.toolChoice).toBe("required");
      expect(body.promptCacheRetention).toBe("1h");
      expect(body.responseFormat).toEqual({ type: "text" });
    });
  });

  describe("converse with input-level scrubPii", () => {
    it("should map input scrubPii to scrubPII in inputs", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "hi" }] }], scrubPii: true },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs[0].scrubPII).toBe(true);
    });
  });

  describe("response mapping", () => {
    const minimalInputs: ConversationInput[] = [
      { messages: [{ role: "user", content: [{ text: "hi" }] }] },
    ];

    it("should map basic response with contextID", async () => {
      executeSpy.mockResolvedValue({
        contextID: "ctx-resp",
        outputs: [
          {
            choices: [
              {
                finishReason: "stop",
                index: 0,
                message: { content: "Hello there!" },
              },
            ],
          },
        ],
      });

      const res = await conversation.converse("my-llm", minimalInputs);

      expect(res.contextId).toBe("ctx-resp");
      expect(res.outputs).toHaveLength(1);
      expect(res.outputs[0].choices).toHaveLength(1);
      expect(res.outputs[0].choices[0].finishReason).toBe("stop");
      expect(res.outputs[0].choices[0].index).toBe(0);
      expect(res.outputs[0].choices[0].message?.content).toBe("Hello there!");
      expect(res.outputs[0].choices[0].message?.toolCalls).toBeUndefined();
    });

    it("should map response with context_id (snake_case fallback)", async () => {
      executeSpy.mockResolvedValue({
        context_id: "ctx-snake",
        outputs: [],
      });

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.contextId).toBe("ctx-snake");
    });

    it("should handle response with no contextID", async () => {
      executeSpy.mockResolvedValue({ outputs: [] });

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.contextId).toBeUndefined();
    });

    it("should handle response with empty outputs", async () => {
      executeSpy.mockResolvedValue({ outputs: [] });

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.outputs).toEqual([]);
    });

    it("should handle response with missing outputs", async () => {
      executeSpy.mockResolvedValue({});

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.outputs).toEqual([]);
    });

    it("should map response with tool calls", async () => {
      executeSpy.mockResolvedValue({
        outputs: [
          {
            choices: [
              {
                finishReason: "tool_calls",
                index: 0,
                message: {
                  content: "",
                  toolCalls: [
                    {
                      id: "call-1",
                      function: { name: "getWeather", arguments: '{"city":"NYC"}' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      const res = await conversation.converse("my-llm", minimalInputs);

      const choice = res.outputs[0].choices[0];
      expect(choice.finishReason).toBe("tool_calls");
      expect(choice.message?.toolCalls).toHaveLength(1);
      expect(choice.message?.toolCalls?.[0].id).toBe("call-1");
      expect(choice.message?.toolCalls?.[0].function?.name).toBe("getWeather");
      expect(choice.message?.toolCalls?.[0].function?.arguments).toBe('{"city":"NYC"}');
    });

    it("should handle response with empty toolCalls array", async () => {
      executeSpy.mockResolvedValue({
        outputs: [
          {
            choices: [
              {
                finishReason: "stop",
                index: 0,
                message: { content: "hi", toolCalls: [] },
              },
            ],
          },
        ],
      });

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.outputs[0].choices[0].message?.toolCalls).toBeUndefined();
    });

    it("should handle choice with no message", async () => {
      executeSpy.mockResolvedValue({
        outputs: [
          {
            choices: [
              { finishReason: "stop", index: 0 },
            ],
          },
        ],
      });

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.outputs[0].choices[0].message).toBeUndefined();
    });

    it("should use finish_reason snake_case fallback", async () => {
      executeSpy.mockResolvedValue({
        outputs: [
          {
            choices: [
              {
                finish_reason: "length",
                index: 1,
                message: { content: "truncated" },
              },
            ],
          },
        ],
      });

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.outputs[0].choices[0].finishReason).toBe("length");
      expect(res.outputs[0].choices[0].index).toBe(1);
    });

    it("should default finishReason to empty string and index to 0", async () => {
      executeSpy.mockResolvedValue({
        outputs: [
          {
            choices: [
              { message: { content: "test" } },
            ],
          },
        ],
      });

      const res = await conversation.converse("my-llm", minimalInputs);
      expect(res.outputs[0].choices[0].finishReason).toBe("");
      expect(res.outputs[0].choices[0].index).toBe(0);
    });

    it("should map multiple outputs with multiple choices", async () => {
      executeSpy.mockResolvedValue({
        contextID: "ctx-multi",
        outputs: [
          {
            choices: [
              { finishReason: "stop", index: 0, message: { content: "a" } },
              { finishReason: "stop", index: 1, message: { content: "b" } },
            ],
          },
          {
            choices: [
              { finishReason: "length", index: 0, message: { content: "c" } },
            ],
          },
        ],
      });

      const res = await conversation.converse("my-llm", minimalInputs);

      expect(res.outputs).toHaveLength(2);
      expect(res.outputs[0].choices).toHaveLength(2);
      expect(res.outputs[0].choices[0].message?.content).toBe("a");
      expect(res.outputs[0].choices[1].message?.content).toBe("b");
      expect(res.outputs[1].choices).toHaveLength(1);
      expect(res.outputs[1].choices[0].message?.content).toBe("c");
    });
  });

  describe("multiple inputs", () => {
    it("should handle multiple inputs with different messages", async () => {
      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "first" }] }] },
        {
          messages: [
            { role: "system", content: [{ text: "be helpful" }] },
            { role: "user", content: [{ text: "second" }] },
          ],
          scrubPii: true,
        },
      ];

      await conversation.converse("my-llm", inputs);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs).toHaveLength(2);
      expect(body.inputs[0].messages).toHaveLength(1);
      expect(body.inputs[1].messages).toHaveLength(2);
      expect(body.inputs[1].scrubPII).toBe(true);
    });
  });

  describe("empty inputs", () => {
    it("should handle empty inputs array", async () => {
      await conversation.converse("my-llm", []);

      const body = executeSpy.mock.calls[0][2].body;
      expect(body.inputs).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should propagate errors from executeWithApiVersion", async () => {
      const error = new Error("network error");
      executeSpy.mockRejectedValue(error);

      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "hi" }] }] },
      ];

      await expect(conversation.converse("my-llm", inputs)).rejects.toThrow("network error");
    });

    it("should propagate the original error object", async () => {
      const error = new Error("timeout");
      executeSpy.mockRejectedValue(error);

      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "hi" }] }] },
      ];

      await expect(conversation.converse("my-llm", inputs)).rejects.toBe(error);
    });
  });
});

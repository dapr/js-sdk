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

import GRPCClientConversation from "../../../../src/implementation/Client/GRPCClient/conversation";
import {
  ConversationInput,
  ConversationOptions,
} from "../../../../src/types/conversation/Conversation.type";

describe("grpc/conversation", () => {
  const getMockClient = (requests: any[], response?: any) => {
    const mockConverseAlpha2 = async (req: any) => {
      requests.push(req);
      return response ?? { contextId: undefined, outputs: [] };
    };
    const mockClient = {
      getClient: () => {
        return { converseAlpha2: mockConverseAlpha2 };
      },
    } as any;
    return mockClient;
  };

  describe("converse with minimal inputs", () => {
    it("should call converseAlpha2 with correct component name", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "Hello" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      expect(requests).toHaveLength(1);
      expect(requests[0].name).toBe("my-llm");
    });

    it("should build proto input with user message", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "Hello" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      expect(requests[0].inputs).toHaveLength(1);
      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofUser");
      expect(msg.messageTypes.value.content).toHaveLength(1);
      expect(msg.messageTypes.value.content[0].text).toBe("Hello");
    });
  });

  describe("converse with all message roles", () => {
    it("should map developer message to ofDeveloper", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        { messages: [{ role: "developer", name: "dev1", content: [{ text: "dev msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofDeveloper");
      expect(msg.messageTypes.value.name).toBe("dev1");
      expect(msg.messageTypes.value.content[0].text).toBe("dev msg");
    });

    it("should map system message to ofSystem", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        { messages: [{ role: "system", name: "sys1", content: [{ text: "system msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofSystem");
      expect(msg.messageTypes.value.name).toBe("sys1");
      expect(msg.messageTypes.value.content[0].text).toBe("system msg");
    });

    it("should map user message to ofUser", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", name: "usr1", content: [{ text: "user msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofUser");
      expect(msg.messageTypes.value.name).toBe("usr1");
      expect(msg.messageTypes.value.content[0].text).toBe("user msg");
    });

    it("should map assistant message to ofAssistant", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        { messages: [{ role: "assistant", name: "asst", content: [{ text: "assistant msg" }] }] },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofAssistant");
      expect(msg.messageTypes.value.name).toBe("asst");
      expect(msg.messageTypes.value.content[0].text).toBe("assistant msg");
    });

    it("should map assistant message with tool calls", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "assistant",
              content: [{ text: "calling tool" }],
              toolCalls: [
                { id: "tc-1", function: { name: "getWeather", arguments: '{"city":"NYC"}' } },
              ],
            },
          ],
        },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofAssistant");
      expect(msg.messageTypes.value.toolCalls).toHaveLength(1);
      expect(msg.messageTypes.value.toolCalls[0].id).toBe("tc-1");
      expect(msg.messageTypes.value.toolCalls[0].toolTypes.case).toBe("function");
      expect(msg.messageTypes.value.toolCalls[0].toolTypes.value.name).toBe("getWeather");
      expect(msg.messageTypes.value.toolCalls[0].toolTypes.value.arguments).toBe('{"city":"NYC"}');
    });

    it("should map tool message to ofTool", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            { role: "tool", toolId: "tc-1", name: "getWeather", content: [{ text: "sunny" }] },
          ],
        },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofTool");
      expect(msg.messageTypes.value.toolId).toBe("tc-1");
      expect(msg.messageTypes.value.name).toBe("getWeather");
      expect(msg.messageTypes.value.content[0].text).toBe("sunny");
    });

    it("should handle all roles in a single input", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

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

      const messages = requests[0].inputs[0].messages;
      expect(messages).toHaveLength(5);
      expect(messages[0].messageTypes.case).toBe("ofDeveloper");
      expect(messages[1].messageTypes.case).toBe("ofSystem");
      expect(messages[2].messageTypes.case).toBe("ofUser");
      expect(messages[3].messageTypes.case).toBe("ofAssistant");
      expect(messages[4].messageTypes.case).toBe("ofTool");
    });
  });

  describe("converse with options", () => {
    const minimalInputs: ConversationInput[] = [
      { messages: [{ role: "user", content: [{ text: "hi" }] }] },
    ];

    it("should pass contextId", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse("my-llm", minimalInputs, { contextId: "ctx-123" });

      expect(requests[0].contextId).toBe("ctx-123");
    });

    it("should pass metadata", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse("my-llm", minimalInputs, {
        metadata: { key1: "val1", key2: "val2" },
      });

      expect(requests[0].metadata).toEqual({ key1: "val1", key2: "val2" });
    });

    it("should pass scrubPii", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse("my-llm", minimalInputs, { scrubPii: true });

      expect(requests[0].scrubPii).toBe(true);
    });

    it("should pass temperature", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse("my-llm", minimalInputs, { temperature: 0.7 });

      expect(requests[0].temperature).toBe(0.7);
    });

    it("should pass toolChoice", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse("my-llm", minimalInputs, { toolChoice: "auto" });

      expect(requests[0].toolChoice).toBe("auto");
    });

    it("should default metadata to empty object when not provided", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse("my-llm", minimalInputs);

      expect(requests[0].metadata).toEqual({});
    });
  });

  describe("tool building", () => {
    it("should build tools with function schema", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

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

      await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
        options,
      );

      expect(requests[0].tools).toHaveLength(1);
      const tool = requests[0].tools[0];
      expect(tool.toolTypes.case).toBe("function");
      expect(tool.toolTypes.value.name).toBe("getWeather");
      expect(tool.toolTypes.value.description).toBe("Get weather info");
    });

    it("should handle multiple tools", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const options: ConversationOptions = {
        tools: [
          { function: { name: "fn1", description: "first" } },
          { function: { name: "fn2", description: "second" } },
        ],
      };

      await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
        options,
      );

      expect(requests[0].tools).toHaveLength(2);
      expect(requests[0].tools[0].toolTypes.value.name).toBe("fn1");
      expect(requests[0].tools[1].toolTypes.value.name).toBe("fn2");
    });

    it("should handle no tools", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      expect(requests[0].tools).toEqual([]);
    });
  });

  describe("input-level scrubPii", () => {
    it("should pass input scrubPii in proto input", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        { messages: [{ role: "user", content: [{ text: "hi" }] }], scrubPii: true },
      ];

      await conversation.converse("my-llm", inputs);

      expect(requests[0].inputs[0].scrubPii).toBe(true);
    });
  });

  describe("response mapping", () => {
    it("should map basic response with contextId", async () => {
      const requests: any[] = [];
      const protoResponse = {
        contextId: "ctx-resp",
        outputs: [
          {
            choices: [
              {
                finishReason: "stop",
                index: BigInt(0),
                message: {
                  content: "Hello there!",
                  toolCalls: [],
                },
              },
            ],
          },
        ],
      };
      const conversation = new GRPCClientConversation(getMockClient(requests, protoResponse));

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      expect(res.contextId).toBe("ctx-resp");
      expect(res.outputs).toHaveLength(1);
      expect(res.outputs[0].choices).toHaveLength(1);
      expect(res.outputs[0].choices[0].finishReason).toBe("stop");
      expect(res.outputs[0].choices[0].index).toBe(0);
      expect(res.outputs[0].choices[0].message?.content).toBe("Hello there!");
      expect(res.outputs[0].choices[0].message?.toolCalls).toBeUndefined();
    });

    it("should handle empty outputs", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(
        getMockClient(requests, { contextId: undefined, outputs: [] }),
      );

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      expect(res.contextId).toBeUndefined();
      expect(res.outputs).toEqual([]);
    });

    it("should map response with tool calls", async () => {
      const requests: any[] = [];
      const protoResponse = {
        outputs: [
          {
            choices: [
              {
                finishReason: "tool_calls",
                index: BigInt(0),
                message: {
                  content: "",
                  toolCalls: [
                    {
                      id: "call-1",
                      toolTypes: {
                        case: "function" as const,
                        value: { name: "getWeather", arguments: '{"city":"NYC"}' },
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      const conversation = new GRPCClientConversation(getMockClient(requests, protoResponse));

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "weather?" }] }] }],
      );

      const choice = res.outputs[0].choices[0];
      expect(choice.finishReason).toBe("tool_calls");
      expect(choice.message?.toolCalls).toHaveLength(1);
      expect(choice.message?.toolCalls?.[0].id).toBe("call-1");
      expect(choice.message?.toolCalls?.[0].function?.name).toBe("getWeather");
      expect(choice.message?.toolCalls?.[0].function?.arguments).toBe('{"city":"NYC"}');
    });

    it("should handle tool call with non-function case", async () => {
      const requests: any[] = [];
      const protoResponse = {
        outputs: [
          {
            choices: [
              {
                finishReason: "tool_calls",
                index: BigInt(0),
                message: {
                  content: "",
                  toolCalls: [
                    {
                      id: "call-2",
                      toolTypes: { case: undefined, value: undefined },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      const conversation = new GRPCClientConversation(getMockClient(requests, protoResponse));

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      const choice = res.outputs[0].choices[0];
      expect(choice.message?.toolCalls).toHaveLength(1);
      expect(choice.message?.toolCalls?.[0].id).toBe("call-2");
      expect(choice.message?.toolCalls?.[0].function).toBeUndefined();
    });

    it("should handle empty tool calls array in response", async () => {
      const requests: any[] = [];
      const protoResponse = {
        outputs: [
          {
            choices: [
              {
                finishReason: "stop",
                index: BigInt(0),
                message: { content: "no tools", toolCalls: [] },
              },
            ],
          },
        ],
      };
      const conversation = new GRPCClientConversation(getMockClient(requests, protoResponse));

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      expect(res.outputs[0].choices[0].message?.toolCalls).toBeUndefined();
    });

    it("should handle choice with no message", async () => {
      const requests: any[] = [];
      const protoResponse = {
        outputs: [
          {
            choices: [
              { finishReason: "stop", index: BigInt(0), message: undefined },
            ],
          },
        ],
      };
      const conversation = new GRPCClientConversation(getMockClient(requests, protoResponse));

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      expect(res.outputs[0].choices[0].message).toBeUndefined();
    });

    it("should convert bigint index to number", async () => {
      const requests: any[] = [];
      const protoResponse = {
        outputs: [
          {
            choices: [
              {
                finishReason: "stop",
                index: BigInt(3),
                message: { content: "test", toolCalls: [] },
              },
            ],
          },
        ],
      };
      const conversation = new GRPCClientConversation(getMockClient(requests, protoResponse));

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      expect(res.outputs[0].choices[0].index).toBe(3);
      expect(typeof res.outputs[0].choices[0].index).toBe("number");
    });

    it("should map multiple outputs with multiple choices", async () => {
      const requests: any[] = [];
      const protoResponse = {
        contextId: "ctx-multi",
        outputs: [
          {
            choices: [
              { finishReason: "stop", index: BigInt(0), message: { content: "a", toolCalls: [] } },
              { finishReason: "stop", index: BigInt(1), message: { content: "b", toolCalls: [] } },
            ],
          },
          {
            choices: [
              {
                finishReason: "length",
                index: BigInt(0),
                message: { content: "c", toolCalls: [] },
              },
            ],
          },
        ],
      };
      const conversation = new GRPCClientConversation(getMockClient(requests, protoResponse));

      const res = await conversation.converse(
        "my-llm",
        [{ messages: [{ role: "user", content: [{ text: "hi" }] }] }],
      );

      expect(res.outputs).toHaveLength(2);
      expect(res.outputs[0].choices).toHaveLength(2);
      expect(res.outputs[0].choices[0].message?.content).toBe("a");
      expect(res.outputs[0].choices[1].message?.content).toBe("b");
      expect(res.outputs[1].choices).toHaveLength(1);
      expect(res.outputs[1].choices[0].message?.content).toBe("c");
    });
  });

  describe("multiple inputs", () => {
    it("should handle multiple inputs", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

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

      expect(requests[0].inputs).toHaveLength(2);
      expect(requests[0].inputs[0].messages).toHaveLength(1);
      expect(requests[0].inputs[1].messages).toHaveLength(2);
      expect(requests[0].inputs[1].scrubPii).toBe(true);
    });
  });

  describe("empty inputs", () => {
    it("should handle empty inputs array", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      await conversation.converse("my-llm", []);

      expect(requests[0].inputs).toEqual([]);
    });
  });

  describe("assistant message without tool calls", () => {
    it("should handle assistant without toolCalls property", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            { role: "assistant", content: [{ text: "plain response" }] },
          ],
        },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.case).toBe("ofAssistant");
      expect(msg.messageTypes.value.toolCalls).toEqual([]);
    });
  });

  describe("multiple content items", () => {
    it("should handle messages with multiple content items", async () => {
      const requests: any[] = [];
      const conversation = new GRPCClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "part1" }, { text: "part2" }, { text: "part3" }],
            },
          ],
        },
      ];

      await conversation.converse("my-llm", inputs);

      const msg = requests[0].inputs[0].messages[0];
      expect(msg.messageTypes.value.content).toHaveLength(3);
      expect(msg.messageTypes.value.content[0].text).toBe("part1");
      expect(msg.messageTypes.value.content[1].text).toBe("part2");
      expect(msg.messageTypes.value.content[2].text).toBe("part3");
    });
  });
});

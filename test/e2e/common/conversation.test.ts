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

import { Network, StartedNetwork } from "testcontainers";
import { DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient, LogLevel } from "../../../src";
import {
  ConversationInput,
  ConversationOptions,
  ConversationResponse,
} from "../../../src/types/conversation/Conversation.type";
import {
  buildConversationEchoComponent,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

// The Conversation API alpha2 requires Dapr >= 1.16.
// Use DAPR_RUNTIME_VER to override, otherwise default to 1.16.0.
const CONVERSATION_DAPR_VERSION = process.env.DAPR_RUNTIME_VER || "1.16.0";
const CONVERSATION_RUNTIME_IMAGE = `daprio/daprd:${CONVERSATION_DAPR_VERSION}`;
const CONVERSATION_PLACEMENT_IMAGE = `daprio/placement:${CONVERSATION_DAPR_VERSION}`;
const CONVERSATION_SCHEDULER_IMAGE = `daprio/scheduler:${CONVERSATION_DAPR_VERSION}`;

const loggerSettings = {
  level: LogLevel.Debug,
};

/**
 * Shared test suite for the Conversation API.  Called once per protocol
 * (HTTP and gRPC) so we exercise both transports against a real Dapr sidecar.
 */
function conversationTestSuite(protocol: "HTTP" | "GRPC") {
  let client: DaprClient;
  let network: StartedNetwork;
  let daprContainer: StartedDaprContainer;

  beforeAll(async () => {
    network = await new Network().start();

    daprContainer = await new DaprContainer(CONVERSATION_RUNTIME_IMAGE)
      .withPlacementImage(CONVERSATION_PLACEMENT_IMAGE)
      .withSchedulerImage(CONVERSATION_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildConversationEchoComponent())
      .start();

    const port =
      protocol === "HTTP" ? daprContainer.getHttpPort().toString() : daprContainer.getGrpcPort().toString();
    const commProtocol =
      protocol === "HTTP" ? CommunicationProtocolEnum.HTTP : CommunicationProtocolEnum.GRPC;

    client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: port,
      communicationProtocol: commProtocol,
      logger: loggerSettings,
    });
  }, 180 * 1000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await client.stop();
      await daprContainer.stop();
      await network.stop();
    });
  });

  describe("converse", () => {
    it("should send a simple user message and receive a response", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "Hello, Dapr!" }],
            },
          ],
        },
      ];

      const response: ConversationResponse = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices).toBeDefined();
      expect(response.outputs[0].choices.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices[0].message).toBeDefined();
      expect(response.outputs[0].choices[0].message!.content).toBeDefined();
    });

    it("should send a system message", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "system",
              content: [{ text: "You are a helpful assistant." }],
            },
            {
              role: "user",
              content: [{ text: "Repeat after me: test" }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should pass metadata in options", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "test with metadata" }] }],
        },
      ];

      const options: ConversationOptions = {
        metadata: { "test-key": "test-value" },
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should pass temperature in options", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "test with temperature" }] }],
        },
      ];

      const options: ConversationOptions = {
        temperature: 0.7,
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should handle multiple inputs", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "First message" }] }],
        },
        {
          messages: [{ role: "user", content: [{ text: "Second message" }] }],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      // The echo component should return results for all inputs
      expect(response.outputs.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle multiple content items in a single message", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "Part 1" }, { text: "Part 2" }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should reject requests for non-existent component", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "test" }] }],
        },
      ];

      await expect(client.conversation.converse("non-existent-component", inputs)).rejects.toThrow();
    });

    // ---------------------------------------------------------------
    // Agent roles
    // ---------------------------------------------------------------

    it("should send a developer role message", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "developer",
              content: [{ text: "You must always respond in JSON." }],
            },
            {
              role: "user",
              content: [{ text: "What is 1+1?" }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices[0].message).toBeDefined();
    });

    it("should send an assistant role message in a conversation history", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "Hello" }],
            },
            {
              role: "assistant",
              content: [{ text: "Hi there! How can I help you?" }],
            },
            {
              role: "user",
              content: [{ text: "What is the weather?" }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices.length).toBeGreaterThan(0);
    });

    it("should send a tool role message (tool result)", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "What is the weather in Seattle?" }],
            },
            {
              role: "assistant",
              content: [{ text: "" }],
              toolCalls: [
                {
                  id: "call_001",
                  function: {
                    name: "get_weather",
                    arguments: '{"location":"Seattle"}',
                  },
                },
              ],
            },
            {
              role: "tool",
              name: "get_weather",
              toolId: "call_001",
              content: [{ text: '{"temperature": 55, "unit": "fahrenheit"}' }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices.length).toBeGreaterThan(0);
    });

    // ---------------------------------------------------------------
    // Tool invocation
    // ---------------------------------------------------------------

    it("should pass tool definitions in options", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "What is the weather in Seattle?" }] }],
        },
      ];

      const options: ConversationOptions = {
        tools: [
          {
            function: {
              name: "get_weather",
              description: "Get the current weather for a location",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string", description: "City name" },
                },
                required: ["location"],
              },
            },
          },
        ],
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should pass multiple tool definitions", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "Book a flight and check weather" }] }],
        },
      ];

      const options: ConversationOptions = {
        tools: [
          {
            function: {
              name: "get_weather",
              description: "Get weather for a location",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
              },
            },
          },
          {
            function: {
              name: "book_flight",
              description: "Book a flight to a destination",
              parameters: {
                type: "object",
                properties: {
                  destination: { type: "string" },
                  date: { type: "string" },
                },
              },
            },
          },
        ],
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should pass toolChoice option", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "Use the weather tool" }] }],
        },
      ];

      const options: ConversationOptions = {
        tools: [
          {
            function: {
              name: "get_weather",
              description: "Get weather",
              parameters: { type: "object", properties: { location: { type: "string" } } },
            },
          },
        ],
        toolChoice: "auto",
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should handle assistant message with tool calls followed by tool results", async () => {
      // Simulates a multi-turn tool invocation flow:
      // 1. User asks a question
      // 2. Assistant responds with a tool call
      // 3. Tool returns a result
      // 4. User asks a follow-up
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "Look up order #12345" }],
            },
            {
              role: "assistant",
              content: [{ text: "" }],
              toolCalls: [
                {
                  id: "call_100",
                  function: {
                    name: "lookup_order",
                    arguments: '{"order_id":"12345"}',
                  },
                },
              ],
            },
            {
              role: "tool",
              name: "lookup_order",
              toolId: "call_100",
              content: [{ text: '{"status":"shipped","eta":"2026-05-20"}' }],
            },
            {
              role: "user",
              content: [{ text: "When will it arrive?" }],
            },
          ],
        },
      ];

      const options: ConversationOptions = {
        tools: [
          {
            function: {
              name: "lookup_order",
              description: "Look up an order by ID",
              parameters: {
                type: "object",
                properties: { order_id: { type: "string" } },
                required: ["order_id"],
              },
            },
          },
        ],
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices.length).toBeGreaterThan(0);
    });

    it("should handle all five roles in a single conversation", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "developer",
              content: [{ text: "Always respond concisely." }],
            },
            {
              role: "system",
              content: [{ text: "You are a travel assistant." }],
            },
            {
              role: "user",
              content: [{ text: "Find flights to Paris" }],
            },
            {
              role: "assistant",
              content: [{ text: "" }],
              toolCalls: [
                {
                  id: "call_200",
                  function: {
                    name: "search_flights",
                    arguments: '{"destination":"Paris"}',
                  },
                },
              ],
            },
            {
              role: "tool",
              name: "search_flights",
              toolId: "call_200",
              content: [{ text: '{"flights":[{"id":"FL001","price":450}]}' }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices[0].message).toBeDefined();
    });

    it("should handle assistant message with multiple tool calls", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "What is the weather in Seattle and New York?" }],
            },
            {
              role: "assistant",
              content: [{ text: "" }],
              toolCalls: [
                {
                  id: "call_301",
                  function: {
                    name: "get_weather",
                    arguments: '{"location":"Seattle"}',
                  },
                },
                {
                  id: "call_302",
                  function: {
                    name: "get_weather",
                    arguments: '{"location":"New York"}',
                  },
                },
              ],
            },
            {
              role: "tool",
              name: "get_weather",
              toolId: "call_301",
              content: [{ text: '{"temp":55}' }],
            },
            {
              role: "tool",
              name: "get_weather",
              toolId: "call_302",
              content: [{ text: '{"temp":72}' }],
            },
          ],
        },
      ];

      const options: ConversationOptions = {
        tools: [
          {
            function: {
              name: "get_weather",
              description: "Get weather",
              parameters: {
                type: "object",
                properties: { location: { type: "string" } },
              },
            },
          },
        ],
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });
  });
}

describe("common/conversation/http", () => {
  conversationTestSuite("HTTP");
});

describe("common/conversation/grpc", () => {
  conversationTestSuite("GRPC");
});

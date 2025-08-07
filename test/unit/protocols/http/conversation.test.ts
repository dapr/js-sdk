/*
Copyright 2023 The Dapr Authors
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

import HTTPClientConversation from "../../../../src/implementation/Client/HTTPClient/conversation";
import { ConversationInput } from "../../../../src/types/conversation/ConversationInput.type";
import { ConversationOptions } from "../../../../src/types/conversation/ConversationOptions.type";
import { ConversationResponse } from "../../../../src/types/conversation/ConversationResponse.type";

describe("http/conversation", () => {
  describe("converseAsync should call executeWithApiVersion with correct arguments", () => {
    const getMockClient = (requests: any[]) => {
      const mockExecuteWithApiVersion = async (apiVersion: string, url: string, params: any) => {
        requests.push({ apiVersion, url, params });
        return {
          outputs: [
            {
              choices: [
                {
                  finish_reason: "stop",
                  index: 0,
                  message: {
                    content: "This is a test response",
                  },
                },
              ],
            },
          ],
        } as ConversationResponse;
      };
      const mockClient = {
        executeWithApiVersion: mockExecuteWithApiVersion,
        options: { logger: undefined },
      } as any;
      return mockClient;
    };

    it("should create the correct conversation request with basic inputs", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Hello, how are you?" }],
              },
            },
          ],
          scrub_pii: false,
        },
      ];

      const response = await httpClientConversation.converseAsync("anthropic", inputs);

      // Check the request
      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.apiVersion).toBe("v1.0-alpha2");
      expect(request.url).toBe("/conversation/anthropic/converse");
      expect(request.params.method).toBe("POST");
      expect(request.params.body.name).toBe("anthropic");
      expect(request.params.body.inputs).toEqual(inputs);

      // Check the response
      expect(response.outputs).toHaveLength(1);
      expect(response.outputs[0].choices).toHaveLength(1);
      expect(response.outputs[0].choices[0].message.content).toBe("This is a test response");
      expect(response.outputs[0].choices[0].finish_reason).toBe("stop");
    });

    it("should include conversation options in the request", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "What's the weather like?" }],
              },
            },
          ],
        },
      ];

      const options: ConversationOptions = {
        metadata: { api_key: "test-key" },
        temperature: 0.8,
        scrub_pii: true,
        tools: [
          {
            function: {
              name: "get_weather",
              description: "Get weather information",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
                required: ["location"],
              },
            },
          },
        ],
        tool_choice: "auto",
      };

      await httpClientConversation.converseAsync("anthropic", inputs, options);

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.params.body).toEqual({
        name: "anthropic",
        inputs,
        ...options,
      });
    });

    it("should handle assistant messages with tool calls", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Get the weather for San Francisco" }],
              },
            },
            {
              of_assistant: {
                content: [{ text: "I'll get the weather for you." }],
                tool_calls: [
                  {
                    id: "call_123",
                    function: {
                      name: "get_weather",
                      arguments: '{"location": "San Francisco"}',
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      await httpClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.params.body.inputs).toEqual(inputs);
    });

    it("should handle system messages", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_system: {
                content: [{ text: "You are a helpful assistant." }],
              },
            },
            {
              of_user: {
                content: [{ text: "Hello" }],
              },
            },
          ],
        },
      ];

      await httpClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.params.body.inputs).toEqual(inputs);
    });

    it("should handle tool messages", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Get the weather" }],
              },
            },
            {
              of_tool: {
                tool_id: "call_123",
                name: "get_weather",
                content: [{ text: '{"temperature": 72, "condition": "sunny"}' }],
              },
            },
          ],
        },
      ];

      await httpClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.params.body.inputs).toEqual(inputs);
    });

    it("should handle multiple conversation inputs", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "First message" }],
              },
            },
          ],
        },
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Second message" }],
              },
            },
          ],
          scrub_pii: true,
        },
      ];

      await httpClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.params.body.inputs).toEqual(inputs);
    });

    it("should handle empty options", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Simple message" }],
              },
            },
          ],
        },
      ];

      await httpClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.params.body).toEqual({
        name: "anthropic",
        inputs,
      });
    });

    it("should handle different conversation component names", async () => {
      const requests: any[] = [];
      const httpClientConversation = new HTTPClientConversation(getMockClient(requests));

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Test message" }],
              },
            },
          ],
        },
      ];

      await httpClientConversation.converseAsync("openai", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.url).toBe("/conversation/openai/converse");
      expect(request.params.body.name).toBe("openai");
    });
  });

  describe("error handling", () => {
    it("should propagate errors from executeWithApiVersion", async () => {
      const mockClient = {
        executeWithApiVersion: async () => {
          throw new Error("Network error");
        },
        options: { logger: undefined },
      } as any;

      const httpClientConversation = new HTTPClientConversation(mockClient);

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Test message" }],
              },
            },
          ],
        },
      ];

      await expect(httpClientConversation.converseAsync("anthropic", inputs)).rejects.toThrow("Network error");
    });
  });
});

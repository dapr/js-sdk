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

import GRPCClientConversation from "../../../../src/implementation/Client/GRPCClient/conversation";
import { ConversationInput } from "../../../../src/types/conversation/ConversationInput.type";
import { ConversationOptions } from "../../../../src/types/conversation/ConversationOptions.type";
import { InvokeServiceRequest } from "../../../../src/proto/dapr/proto/runtime/v1/dapr_pb";
import { InvokeResponse } from "../../../../src/proto/dapr/proto/common/v1/common_pb";
import { Any } from "google-protobuf/google/protobuf/any_pb";

describe("grpc/conversation", () => {
  describe("converseAsync should call invokeService with correct arguments", () => {
    const getMockClient = (requests: InvokeServiceRequest[]) => {
      const mockInvokeService = (req: InvokeServiceRequest, callback: any) => {
        requests.push(req);
        const mockResponse = new InvokeResponse();
        const mockData = new Any();
        mockData.setValue(
          Buffer.from(
            JSON.stringify({
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
            }),
          ),
        );
        mockResponse.setData(mockData);
        callback(null, mockResponse);
      };
      const mockClient = {
        getClient: () => {
          return { invokeService: mockInvokeService };
        },
        options: { logger: undefined },
      } as any;
      return mockClient;
    };

    it("should create the correct conversation request with basic inputs", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      const response = await grpcClientConversation.converseAsync("anthropic", inputs);

      // Check the request
      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.getId()).toBe("dapr");

      const message = request.getMessage();
      expect(message?.getMethod()).toBe("/conversation/anthropic/converse");

      const httpExtension = message?.getHttpExtension();
      expect(httpExtension?.getVerb()).toBe(3); // POST

      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());
      expect(requestBody.name).toBe("anthropic");
      expect(requestBody.inputs).toEqual(inputs);

      // Check the response
      expect(response.outputs).toHaveLength(1);
      expect(response.outputs[0].choices).toHaveLength(1);
      expect(response.outputs[0].choices[0].message.content).toBe("This is a test response");
      expect(response.outputs[0].choices[0].finish_reason).toBe("stop");
    });

    it("should include conversation options in the request", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      await grpcClientConversation.converseAsync("anthropic", inputs, options);

      expect(requests.length).toBe(1);
      const request = requests[0];
      const message = request.getMessage();
      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());

      expect(requestBody).toEqual({
        name: "anthropic",
        inputs,
        ...options,
      });
    });

    it("should handle assistant messages with tool calls", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      await grpcClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      const message = request.getMessage();
      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());
      expect(requestBody.inputs).toEqual(inputs);
    });

    it("should handle system messages", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      await grpcClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      const message = request.getMessage();
      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());
      expect(requestBody.inputs).toEqual(inputs);
    });

    it("should handle tool messages", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      await grpcClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      const message = request.getMessage();
      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());
      expect(requestBody.inputs).toEqual(inputs);
    });

    it("should handle multiple conversation inputs", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      await grpcClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      const message = request.getMessage();
      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());
      expect(requestBody.inputs).toEqual(inputs);
    });

    it("should handle empty options", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      await grpcClientConversation.converseAsync("anthropic", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      const message = request.getMessage();
      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());
      expect(requestBody).toEqual({
        name: "anthropic",
        inputs,
      });
    });

    it("should handle different conversation component names", async () => {
      const requests: InvokeServiceRequest[] = [];
      const grpcClientConversation = new GRPCClientConversation(getMockClient(requests));

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

      await grpcClientConversation.converseAsync("openai", inputs);

      expect(requests.length).toBe(1);
      const request = requests[0];
      const message = request.getMessage();
      expect(message?.getMethod()).toBe("/conversation/openai/converse");

      const data = message?.getData() as Any;
      const requestBody = JSON.parse(Buffer.from(data.getValue()).toString());
      expect(requestBody.name).toBe("openai");
    });

    it("should handle responses with tool calls", async () => {
      const requests: InvokeServiceRequest[] = [];
      const mockClient = {
        getClient: () => {
          return {
            invokeService: (req: InvokeServiceRequest, callback: any) => {
              requests.push(req);
              const mockResponse = new InvokeResponse();
              const mockData = new Any();
              mockData.setValue(
                Buffer.from(
                  JSON.stringify({
                    outputs: [
                      {
                        choices: [
                          {
                            finish_reason: "tool_calls",
                            index: 0,
                            message: {
                              content: "I'll get the weather for you.",
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
                    ],
                  }),
                ),
              );
              mockResponse.setData(mockData);
              callback(null, mockResponse);
            },
          };
        },
        options: { logger: undefined },
      } as any;

      const grpcClientConversation = new GRPCClientConversation(mockClient);

      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              of_user: {
                content: [{ text: "Get weather for San Francisco" }],
              },
            },
          ],
        },
      ];

      const response = await grpcClientConversation.converseAsync("anthropic", inputs);

      expect(response.outputs[0].choices[0].finish_reason).toBe("tool_calls");
      expect(response.outputs[0].choices[0].message.tool_calls).toHaveLength(1);
      expect(response.outputs[0].choices[0].message?.tool_calls?.[0]?.function?.name).toBe("get_weather");
    });
  });

  describe("error handling", () => {
    it("should propagate errors from invokeService", async () => {
      const mockClient = {
        getClient: () => {
          return {
            invokeService: (req: InvokeServiceRequest, callback: any) => {
              callback(new Error("gRPC error"), null);
            },
          };
        },
        options: { logger: undefined },
      } as any;

      const grpcClientConversation = new GRPCClientConversation(mockClient);

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

      await expect(grpcClientConversation.converseAsync("anthropic", inputs)).rejects.toThrow("gRPC error");
    });

    it("should handle parsing errors in response", async () => {
      const mockClient = {
        getClient: () => {
          return {
            invokeService: (req: InvokeServiceRequest, callback: any) => {
              const mockResponse = new InvokeResponse();
              const mockData = new Any();
              mockData.setValue(Buffer.from("invalid json"));
              mockResponse.setData(mockData);
              callback(null, mockResponse);
            },
          };
        },
        options: { logger: undefined },
      } as any;

      const grpcClientConversation = new GRPCClientConversation(mockClient);

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

      await expect(grpcClientConversation.converseAsync("anthropic", inputs)).rejects.toThrow("COULD_NOT_PARSE_RESULT");
    });

    it("should handle empty response data", async () => {
      const mockClient = {
        getClient: () => {
          return {
            invokeService: (req: InvokeServiceRequest, callback: any) => {
              const mockResponse = new InvokeResponse();
              // No data set
              callback(null, mockResponse);
            },
          };
        },
        options: { logger: undefined },
      } as any;

      const grpcClientConversation = new GRPCClientConversation(mockClient);

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

      await expect(grpcClientConversation.converseAsync("anthropic", inputs)).rejects.toThrow("COULD_NOT_PARSE_RESULT");
    });
  });
});

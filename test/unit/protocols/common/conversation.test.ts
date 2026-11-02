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

import { create, fromBinary, toBinary, toJson } from "@bufbuild/protobuf";
import { anyUnpack, ValueSchema } from "@bufbuild/protobuf/wkt";
import {
  CommunicationProtocolEnum,
  ConversationJsonObject,
  ConversationMessage,
  ConversationRequestAlpha2,
  ConversationResponseAlpha2,
  DaprClient,
  IClientConversation,
  Temporal,
} from "../../../../src";
import GRPCClient from "../../../../src/implementation/Client/GRPCClient/GRPCClient";
import GRPCClientConversation from "../../../../src/implementation/Client/GRPCClient/conversation";
import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import HTTPClientConversation from "../../../../src/implementation/Client/HTTPClient/conversation";
import * as Proto from "../../../../src/proto/dapr/proto/runtime/v1/ai_pb";
import {
  fromConversationHttpResponse,
  fromConversationResponse,
  toConversationHttpBody,
  toConversationRequest,
} from "../../../../src/utils/Conversation.util";

const basicRequest: ConversationRequestAlpha2 = {
  name: "llm",
  inputs: [{ messages: [{ ofUser: { content: [{ text: "hello" }] } }] }],
};

function completeRequest(): ConversationRequestAlpha2 {
  return {
    name: "llm",
    contextId: "context",
    inputs: [
      {
        scrubPii: false,
        messages: [
          { ofDeveloper: { name: "developer", content: [{ text: "instructions" }] } },
          { ofSystem: { name: "system", content: [{ text: "be concise" }] } },
          { ofUser: { name: "user", content: [{ text: "first" }, { text: "second" }] } },
          {
            ofAssistant: {
              name: "assistant",
              content: [{ text: "calling tools" }],
              toolCalls: [{ id: "call-1", function: { name: "search", arguments: '{"query":"Dapr"}' } }],
            },
          },
          { ofTool: { toolId: "call-1", name: "search", content: [{ text: "found it" }] } },
        ],
      },
      { messages: [{ ofUser: { content: [{ text: "another input" }] } }], scrubPii: true },
    ],
    parameters: { custom: { nested: [null, true, 42, "value"] }, flag: false, empty: null },
    metadata: { tenant: "example" },
    temperature: 0,
    scrubPii: false,
    tools: [
      {
        function: {
          name: "search",
          description: "Search docs",
          parameters: {
            type: "object",
            properties: { query: { type: "string", enum: ["Dapr", "SDK"] } },
            required: ["query"],
            additionalProperties: false,
          },
        },
      },
      { function: { name: "ping" } },
    ],
    toolChoice: "search",
    responseFormat: { type: "object", properties: { answer: { type: "string" } } },
    promptCacheRetention: Temporal.Duration.from({ hours: 24, milliseconds: 1, microseconds: 2, nanoseconds: 3 }),
    maxTokens: 100,
  };
}

function completeResponse(): Proto.ConversationResponseAlpha2 {
  return create(Proto.ConversationResponseAlpha2Schema, {
    contextId: "context",
    outputs: [
      {
        model: "test-model",
        choices: [
          {
            finishReason: "tool_calls",
            index: 0n,
            message: {
              toolCalls: [
                { id: "call-1", toolTypes: { case: "function", value: { name: "search", arguments: "not-json" } } },
                { toolTypes: { case: "function", value: { name: "ping", arguments: "{}" } } },
              ],
            },
          },
          { finishReason: "stop", index: 1n, message: { content: "answer" } },
        ],
        usage: {
          completionTokens: 11n,
          promptTokens: 22n,
          totalTokens: 33n,
          completionTokensDetails: {
            acceptedPredictionTokens: 1n,
            audioTokens: 2n,
            reasoningTokens: 3n,
            rejectedPredictionTokens: 4n,
          },
          promptTokensDetails: { audioTokens: 5n, cachedTokens: 6n },
        },
      },
      { choices: [{ finishReason: "content_filter" }] },
    ],
  });
}

describe("Conversation Alpha2 mapping", () => {
  it("maps every request field and role through protobuf binary and JSON without mutating the request", () => {
    const request = completeRequest();
    const before = JSON.stringify(request);
    const proto = fromBinary(
      Proto.ConversationRequestAlpha2Schema,
      toBinary(Proto.ConversationRequestAlpha2Schema, toConversationRequest(request)),
    );
    expect(proto.name).toBe("llm");
    expect(proto.contextId).toBe("context");
    expect(proto.inputs[0].messages.map((message) => message.messageTypes.case)).toEqual([
      "ofDeveloper",
      "ofSystem",
      "ofUser",
      "ofAssistant",
      "ofTool",
    ]);
    expect(proto.promptCacheRetention).toMatchObject({ seconds: 86400n, nanos: 1002003 });
    expect(proto.maxTokens).toBe(100n);
    expect(toJson(ValueSchema, anyUnpack(proto.parameters.custom, ValueSchema)!)).toEqual(request.parameters!.custom);

    expect(toConversationHttpBody(proto)).toEqual({
      contextId: "context",
      inputs: request.inputs,
      parameters: {
        custom: { "@type": "type.googleapis.com/google.protobuf.Value", value: { nested: [null, true, 42, "value"] } },
        flag: { "@type": "type.googleapis.com/google.protobuf.Value", value: false },
        empty: { "@type": "type.googleapis.com/google.protobuf.Value", value: null },
      },
      metadata: request.metadata,
      temperature: 0,
      scrubPii: false,
      tools: request.tools,
      toolChoice: "search",
      responseFormat: request.responseFormat,
      promptCacheRetention: "86400.001002003s",
      maxTokens: "100",
    });
    expect(JSON.stringify(request)).toBe(before);
  });

  it("does not invent absent options or tool parameters", () => {
    const proto = toConversationRequest(basicRequest);
    expect(proto.temperature).toBeUndefined();
    expect(proto.scrubPii).toBeUndefined();
    expect(proto.inputs[0].scrubPii).toBeUndefined();
    expect(proto.toolChoice).toBeUndefined();
    expect(proto.promptCacheRetention).toBeUndefined();
    expect(proto.maxTokens).toBeUndefined();
    expect(toConversationHttpBody(proto)).toEqual({ inputs: basicRequest.inputs });
  });

  it("normalizes every response field identically across transports", () => {
    const proto = completeResponse();
    const expected: ConversationResponseAlpha2 = {
      contextId: "context",
      outputs: [
        {
          model: "test-model",
          choices: [
            {
              finishReason: "tool_calls",
              index: 0,
              message: {
                content: "",
                toolCalls: [
                  { id: "call-1", function: { name: "search", arguments: "not-json" } },
                  { id: undefined, function: { name: "ping", arguments: "{}" } },
                ],
              },
            },
            { finishReason: "stop", index: 1, message: { content: "answer", toolCalls: [] } },
          ],
          usage: {
            completionTokens: 11,
            promptTokens: 22,
            totalTokens: 33,
            completionTokensDetails: {
              acceptedPredictionTokens: 1,
              audioTokens: 2,
              reasoningTokens: 3,
              rejectedPredictionTokens: 4,
            },
            promptTokensDetails: { audioTokens: 5, cachedTokens: 6 },
          },
        },
        {
          choices: [{ finishReason: "content_filter", index: 0, message: undefined }],
          model: undefined,
          usage: undefined,
        },
      ],
    };
    expect(fromConversationResponse(proto)).toStrictEqual(expected);
    const json = JSON.stringify(toJson(Proto.ConversationResponseAlpha2Schema, proto));
    expect(fromConversationHttpResponse(json)).toStrictEqual(expected);
    expect(fromConversationHttpResponse(JSON.parse(json))).toStrictEqual(expected);
  });

  it("normalizes absent protobuf defaults without fabricating usage", () => {
    expect(fromConversationHttpResponse({})).toStrictEqual({ contextId: undefined, outputs: [] });
    expect(fromConversationHttpResponse({ outputs: [{ choices: [{ message: {} }] }] })).toStrictEqual({
      contextId: undefined,
      outputs: [
        {
          choices: [{ index: 0, finishReason: "", message: { content: "", toolCalls: [] } }],
          model: undefined,
          usage: undefined,
        },
      ],
    });
    expect(fromConversationHttpResponse({ outputs: [{ usage: {} }] }).outputs[0].usage).toStrictEqual({
      completionTokens: 0,
      promptTokens: 0,
      totalTokens: 0,
      completionTokensDetails: undefined,
      promptTokensDetails: undefined,
    });
  });

  it.each(["none", "auto", "required", "search"])("preserves toolChoice %s", (toolChoice) => {
    expect(toConversationRequest({ ...completeRequest(), toolChoice }).toolChoice).toBe(toolChoice);
  });

  it("round-trips tool-only assistant messages, optional IDs, and unparsed argument strings", () => {
    const toolCalls = fromConversationResponse(completeResponse()).outputs[0].choices[0].message!.toolCalls;
    const request = toConversationRequest({
      ...basicRequest,
      inputs: [
        {
          messages: [
            { ofAssistant: { toolCalls } },
            { ofTool: { toolId: toolCalls[0].id, name: "search", content: [{ text: "result" }] } },
            { ofTool: { name: "ping", content: [{ text: "pong" }] } },
          ],
        },
      ],
    });
    expect(toConversationHttpBody(request).inputs).toEqual([
      {
        messages: [
          { ofAssistant: { toolCalls } },
          { ofTool: { toolId: "call-1", name: "search", content: [{ text: "result" }] } },
          { ofTool: { name: "ping", content: [{ text: "pong" }] } },
        ],
      },
    ]);
  });

  it.each([
    [{}, "exactly one role"],
    [{ ofUser: { content: [] }, ofSystem: { content: [] } }, "exactly one role"],
    [null, "must be an object"],
    [{ ofUser: null }, "message object"],
    [{ ofUser: {} }, "array of text"],
    [{ ofUser: { content: "text" } }, "array of text"],
    [{ ofUser: { content: [{ text: 42 }] } }, "array of text"],
    [{ ofTool: { name: "", content: [] } }, "tool names must not be empty"],
    [{ ofAssistant: { toolCalls: [{ function: { name: "search", arguments: {} } }] } }, "string arguments"],
  ])("rejects malformed messages from JavaScript callers", (message, error) => {
    const request = JSON.parse(JSON.stringify({ ...basicRequest, inputs: [{ messages: [message] }] }));
    expect(() => toConversationRequest(request)).toThrow(error);
  });

  it.each([
    [{ name: "" }, "component name"],
    [{ name: "  " }, "component name"],
    [{ inputs: [] }, "at least one input"],
    [{ inputs: [{ messages: [] }] }, "at least one message"],
    [{ temperature: NaN }, "finite"],
    [{ temperature: Infinity }, "finite"],
    [{ tools: [{ function: { name: "" } }] }, "function name"],
  ])("rejects invalid requests before transmission", (change, error) => {
    expect(() => toConversationRequest({ ...basicRequest, ...change })).toThrow(error);
  });

  it.each([0, -1, 1.5, NaN, Infinity, 2147483648])("rejects invalid maxTokens %s", (maxTokens) => {
    expect(() => toConversationRequest({ ...basicRequest, maxTokens })).toThrow("maxTokens");
  });

  it.each([1, 2147483647])("supports maxTokens boundary %s", (maxTokens) => {
    expect(toConversationRequest({ ...basicRequest, maxTokens }).maxTokens).toBe(BigInt(maxTokens));
  });

  it.each([
    ["PT0S", 0n, 0, "0s"],
    ["PT0.000000001S", 0n, 1, "0.000000001s"],
    ["PT0.999999999S", 0n, 999999999, "0.999999999s"],
    ["P1DT2H3M4.005006007S", 93784n, 5006007, "93784.005006007s"],
    ["PT315576000000S", 315576000000n, 0, "315576000000s"],
  ] as const)("encodes fixed duration %s exactly", (duration, seconds, nanos, json) => {
    const value = toConversationRequest({ ...basicRequest, promptCacheRetention: Temporal.Duration.from(duration) });
    expect(value.promptCacheRetention).toMatchObject({ seconds, nanos });
    expect(toConversationHttpBody(value).promptCacheRetention).toBe(json);
  });

  it("normalizes subsecond overflow and rejects unsafe duration fields", () => {
    const value = toConversationRequest({
      ...basicRequest,
      promptCacheRetention: Temporal.Duration.from({ nanoseconds: 1_000_000_001 }),
    });
    expect(value.promptCacheRetention).toMatchObject({ seconds: 1n, nanos: 1 });
    expect(toConversationHttpBody(value).promptCacheRetention).toBe("1.000000001s");
    expect(() =>
      toConversationRequest({
        ...basicRequest,
        promptCacheRetention: Temporal.Duration.from({ nanoseconds: Number.MAX_SAFE_INTEGER + 1 }),
      }),
    ).toThrow();
  });

  it.each(["-PT1S", "P1Y", "P1M", "P1W", "PT315576000001S"])("rejects unsupported duration %s", (duration) => {
    expect(() =>
      toConversationRequest({ ...basicRequest, promptCacheRetention: Temporal.Duration.from(duration) }),
    ).toThrow("promptCacheRetention");
  });

  it("rejects non-JSON schema values and cycles rather than silently dropping them", () => {
    const cyclic: ConversationJsonObject = {};
    cyclic.self = cyclic;
    for (const parameters of [{ invalid: NaN }, { invalid: Infinity }, cyclic]) {
      expect(() => toConversationRequest({ ...basicRequest, parameters })).toThrow();
      expect(() => toConversationRequest({ ...basicRequest, responseFormat: parameters })).toThrow();
      expect(() =>
        toConversationRequest({ ...basicRequest, tools: [{ function: { name: "search", parameters } }] }),
      ).toThrow();
    }
    const shared = { type: "string" };
    expect(() => toConversationRequest({ ...basicRequest, responseFormat: { a: shared, b: shared } })).not.toThrow();
  });

  it.each([null, [], "schema", 1])("rejects non-object schemas and parameter maps: %j", (value) => {
    for (const field of ["parameters", "responseFormat"]) {
      const request = JSON.parse(JSON.stringify({ ...basicRequest, [field]: value }));
      expect(() => toConversationRequest(request)).toThrow("JSON objects");
    }
    const request = JSON.parse(
      JSON.stringify({ ...basicRequest, tools: [{ function: { name: "lookup", parameters: value } }] }),
    );
    expect(() => toConversationRequest(request)).toThrow("JSON objects");
  });

  it.each([
    ["undefined", undefined],
    ["bigint", 1n],
    ["function", () => true],
    ["symbol", Symbol("invalid")],
    ["date", new Date(0)],
    ["map", new Map()],
    ["set", new Set()],
  ])("rejects %s inside JSON values without silently erasing it", (_name, value) => {
    const parameters: ConversationJsonObject = {};
    Object.defineProperty(parameters, "invalid", { value, enumerable: true });
    expect(() => toConversationRequest({ ...basicRequest, parameters })).toThrow("finite JSON values");
    expect(() => toConversationRequest({ ...basicRequest, responseFormat: parameters })).toThrow("finite JSON values");
  });

  it("preserves the largest safe integer and rejects precision loss in counts and indexes", () => {
    const max = BigInt(Number.MAX_SAFE_INTEGER);
    expect(
      fromConversationResponse(
        create(Proto.ConversationResponseAlpha2Schema, { outputs: [{ usage: { totalTokens: max } }] }),
      ).outputs[0].usage!.totalTokens,
    ).toBe(Number.MAX_SAFE_INTEGER);
    for (const output of [
      { choices: [{ index: max + 1n }] },
      { usage: { totalTokens: max + 1n } },
      { usage: { completionTokensDetails: { reasoningTokens: max + 1n } } },
      { usage: { promptTokensDetails: { cachedTokens: max + 1n } } },
    ]) {
      const proto = create(Proto.ConversationResponseAlpha2Schema, { outputs: [output] });
      expect(() => fromConversationResponse(proto)).toThrow("safe integer precision");
      expect(() =>
        fromConversationHttpResponse(JSON.stringify(toJson(Proto.ConversationResponseAlpha2Schema, proto))),
      ).toThrow("safe integer precision");
    }
  });

  it.each([
    "not-json",
    "null",
    "[]",
    '{"outputs":"invalid"}',
    '{"outputs":[{"choices":[{"message":{"toolCalls":[{}]}}]}]}',
    '{"outputs":[{"choices":[{"index":"1.5"}]}]}',
    '{"outputs":[{"usage":{"totalTokens":"-1"}}]}',
    '{"outputs":[{"usage":{"totalTokens":"18446744073709551616"}}]}',
    '{"outputs":[{"choices":[{"message":{"toolCalls":[{"function":{"name":"lookup","arguments":{}}}]}}]}]}',
  ])("rejects malformed responses %s", (response) => {
    expect(() => fromConversationHttpResponse(response)).toThrow();
  });

  it("allows future response fields without dropping existing fields", () => {
    expect(
      fromConversationHttpResponse({ future: true, outputs: [{ model: "model", future: {} }] }).outputs[0].model,
    ).toBe("model");
  });

  it("exports an exclusive role union and does not require generated message types", () => {
    const valid: ConversationMessage = { ofUser: { content: [{ text: "plain TypeScript" }] } };
    // @ts-expect-error Multiple roles must not be accepted, including non-literal objects.
    const multiple: ConversationMessage = { ...valid, ofSystem: { content: [] } };
    // @ts-expect-error A message must specify a role.
    const missing: ConversationMessage = {};
    expect(valid.ofUser.content[0].text).toBe("plain TypeScript");
    expect(multiple).toBeDefined();
    expect(missing).toBeDefined();
  });
});

describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])(
  "Conversation protocol %s",
  (protocol) => {
    afterEach(() => jest.restoreAllMocks());

    async function setup(
      response = create(Proto.ConversationResponseAlpha2Schema, {
        contextId: "context",
        outputs: [
          {
            choices: [{ finishReason: "stop", message: { content: "reply" } }],
            model: "model",
            usage: { completionTokens: 1n, promptTokens: 2n, totalTokens: 3n },
          },
        ],
      }),
    ) {
      const client = new DaprClient({ communicationProtocol: protocol });
      const grpc = new GRPCClient({});
      grpc.setIsInitialized(true);
      const transport = await grpc.getClient();
      const rpc = jest.spyOn(transport, "converseAlpha2").mockResolvedValue(response);
      const execute = jest
        .spyOn(HTTPClient.prototype, "executeWithApiVersion")
        .mockResolvedValue(JSON.parse(JSON.stringify(toJson(Proto.ConversationResponseAlpha2Schema, response))));
      jest.spyOn(GRPCClient.prototype, "getClient").mockResolvedValue(transport);
      const conversation: IClientConversation = client.conversation;
      return { conversation, execute, rpc };
    }

    it("wires the public client to the selected transport and returns the shared response shape", async () => {
      const { conversation, execute, rpc } = await setup();
      expect(conversation).toBeInstanceOf(
        protocol === CommunicationProtocolEnum.HTTP ? HTTPClientConversation : GRPCClientConversation,
      );
      const request = {
        ...basicRequest,
        name: "component /%?#\u00e9",
        temperature: 0,
        scrubPii: false,
        maxTokens: 100,
        promptCacheRetention: Temporal.Duration.from({ hours: 24 }),
      };
      expect(await conversation.converse(request)).toStrictEqual({
        contextId: "context",
        outputs: [
          {
            choices: [{ index: 0, finishReason: "stop", message: { content: "reply", toolCalls: [] } }],
            model: "model",
            usage: {
              completionTokens: 1,
              promptTokens: 2,
              totalTokens: 3,
              completionTokensDetails: undefined,
              promptTokensDetails: undefined,
            },
          },
        ],
      });
      if (protocol === CommunicationProtocolEnum.HTTP) {
        expect(execute).toHaveBeenCalledWith("v1.0-alpha2", "/conversation/component%20%2F%25%3F%23%C3%A9/converse", {
          method: "POST",
          body: {
            inputs: [{ messages: [{ ofUser: { content: [{ text: "hello" }] } }] }],
            temperature: 0,
            scrubPii: false,
            maxTokens: "100",
            promptCacheRetention: "86400s",
          },
        });
        expect(rpc).not.toHaveBeenCalled();
      } else {
        expect(rpc).toHaveBeenCalledWith(
          create(Proto.ConversationRequestAlpha2Schema, {
            name: "component /%?#\u00e9",
            inputs: [{ messages: [{ messageTypes: { case: "ofUser", value: { content: [{ text: "hello" }] } } }] }],
            temperature: 0,
            scrubPii: false,
            maxTokens: 100n,
            promptCacheRetention: { seconds: 86400n, nanos: 0 },
          }),
        );
        expect(execute).not.toHaveBeenCalled();
      }
    });

    it("propagates transport errors without retrying or falling back to Alpha1", async () => {
      const { conversation, execute, rpc } = await setup();
      const error = new Error("conversation provider failed");
      execute.mockRejectedValue(error);
      rpc.mockRejectedValue(error);
      await expect(conversation.converse(basicRequest)).rejects.toBe(error);
      expect(protocol === CommunicationProtocolEnum.HTTP ? execute : rpc).toHaveBeenCalledTimes(1);
    });

    it.each([
      { name: "" },
      { inputs: [] },
      { inputs: [{ messages: [{ ofUser: { content: [] }, ofSystem: { content: [] } }] }] },
      { responseFormat: [] },
      { maxTokens: -1 },
    ])("rejects invalid input without a transport call and remains usable", async (change) => {
      const { conversation, execute, rpc } = await setup();
      await expect(conversation.converse(JSON.parse(JSON.stringify({ ...basicRequest, ...change })))).rejects.toThrow();
      expect(execute).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
      expect((await conversation.converse(basicRequest)).outputs[0].choices[0].message?.content).toBe("reply");
      expect(protocol === CommunicationProtocolEnum.HTTP ? execute : rpc).toHaveBeenCalledTimes(1);
    });

    it.each(["unsafe count", "missing tool kind"])(
      "rejects a response with %s, returns no partial result, and recovers",
      async (fault) => {
        const { conversation, execute, rpc } = await setup();
        const invalid = create(Proto.ConversationResponseAlpha2Schema, {
          outputs: [
            { choices: [{ message: { content: "must not return this partial response" } }] },
            fault === "unsafe count"
              ? { usage: { totalTokens: 9007199254740992n } }
              : { choices: [{ message: { toolCalls: [{}] } }] },
          ],
        });
        rpc.mockResolvedValueOnce(invalid);
        execute.mockResolvedValueOnce(
          fault === "unsafe count"
            ? {
                outputs: [
                  { choices: [{ message: { content: "must not return this partial response" } }] },
                  { usage: { totalTokens: "9007199254740992" } },
                ],
              }
            : {
                outputs: [
                  { choices: [{ message: { content: "must not return this partial response" } }] },
                  { choices: [{ message: { toolCalls: [{}] } }] },
                ],
              },
        );
        await expect(conversation.converse(basicRequest)).rejects.toThrow(
          fault === "unsafe count" ? "safe integer precision" : "expected a function",
        );
        expect((await conversation.converse(basicRequest)).outputs[0].choices[0].message?.content).toBe("reply");
        expect(protocol === CommunicationProtocolEnum.HTTP ? execute : rpc).toHaveBeenCalledTimes(2);
      },
    );
  },
);

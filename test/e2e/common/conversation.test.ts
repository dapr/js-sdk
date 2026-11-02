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

import express from "express";
import { Server } from "node:http";
import { Network, StartedNetwork, TestContainers } from "testcontainers";
import { Component, DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import {
  CommunicationProtocolEnum,
  ConversationJsonObject,
  ConversationMessage,
  ConversationRequestAlpha2,
  ConversationToolCalls,
  DaprClient,
  Temporal,
} from "../../../src";
import {
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { DAPR_TEST_VERSION, evaluateMinimumDaprRuntime, minimumDaprRuntime } from "../helpers/runtimeVersion";

const gate = evaluateMinimumDaprRuntime("1.16.0", DAPR_TEST_VERSION);
const describeConversation = gate.supported ? describe : describe.skip;

interface ProviderToolCall {
  id: string;
  type: string;
  function: { name: string; arguments: string };
}

interface ProviderMessage {
  role: string;
  content?: string | null;
  tool_calls?: ProviderToolCall[];
  tool_call_id?: string;
}

interface ProviderRequest {
  messages: ProviderMessage[];
  tools?: { type: string; function: { name: string; parameters?: ConversationJsonObject } }[];
  tool_choice?: string | object;
  response_format?: ConversationJsonObject;
  metadata?: Record<string, string>;
  prompt_cache_retention?: string;
  max_completion_tokens?: number;
}

const providerToolCalls: ProviderToolCall[] = [
  { id: "call-1", type: "function", function: { name: "lookup", arguments: '{"key":"answer"}' } },
  { id: "call-2", type: "function", function: { name: "label", arguments: "{}" } },
];

function invalidToolHistory(messages: ProviderMessage[]): string | undefined {
  const assistant = messages.findIndex((message) => message.tool_calls?.length);
  if (assistant !== 1 || messages[0].role !== "user" || messages[assistant].role !== "assistant") {
    return "assistant calls must follow the user message and precede tool results";
  }
  const calls = messages[assistant].tool_calls!;
  if (
    calls.length !== providerToolCalls.length ||
    calls.some(
      (call, index) =>
        call.id !== providerToolCalls[index].id ||
        call.type !== "function" ||
        call.function.name !== providerToolCalls[index].function.name ||
        call.function.arguments !== providerToolCalls[index].function.arguments,
    )
  ) {
    return "assistant calls do not match the calls returned by the provider";
  }
  const pending = new Map([
    ["call-1", "42"],
    ["call-2", "confirmed"],
  ]);
  for (const message of messages.slice(assistant + 1)) {
    if (message.role !== "tool" || !message.tool_call_id || !pending.has(message.tool_call_id)) {
      return "unexpected, duplicate, or uncorrelated tool result";
    }
    if (message.content !== pending.get(message.tool_call_id)) {
      return "incorrect tool result";
    }
    pending.delete(message.tool_call_id);
  }
  return pending.size === 0 ? undefined : "missing tool results";
}

describeConversation(`Conversation Alpha2 (${gate.reason ?? DAPR_TEST_VERSION})`, () => {
  let server: Server | undefined;
  let network: StartedNetwork | undefined;
  let dapr: StartedDaprContainer | undefined;
  const clients: DaprClient[] = [];
  const requests: ProviderRequest[] = [];
  let slowRequestClosed: (() => void) | undefined;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.post("/v1/chat/completions", (req: express.Request<Record<string, string>, unknown, ProviderRequest>, res) => {
      const body = req.body;
      requests.push(body);
      const prompt = body.messages.find((message) => message.role === "user")?.content ?? "";
      const status = /^__status_(400|429|503)__$/.exec(prompt);
      if (status) {
        res.status(Number(status[1])).json({
          error: { message: `intentional provider ${status[1]} failure`, type: "invalid_request_error" },
        });
        return;
      }
      if (prompt === "__malformed_json__") {
        res.type("application/json").send("{");
        return;
      }
      if (prompt === "__invalid_choices__") {
        res.json({ choices: "invalid" });
        return;
      }
      if (prompt === "__disconnect__") {
        req.socket.destroy();
        return;
      }
      if (prompt === "__slow__") {
        res.on("close", () => slowRequestClosed?.());
        return;
      }
      const hasHistory = body.messages.some((message) => message.role === "tool" || message.tool_calls?.length);
      if (hasHistory) {
        const error = invalidToolHistory(body.messages);
        if (error) {
          res.status(400).json({ error: { message: `invalid tool history: ${error}`, type: "invalid_request_error" } });
          return;
        }
      }
      const callTool = (body.tools?.length ?? 0) > 0 && !hasHistory && body.tool_choice !== "none";
      const choices =
        prompt === "__multiple_choices__"
          ? [
              { index: 0, finish_reason: "stop", message: { role: "assistant", content: "first" } },
              { index: 1, finish_reason: "length", message: { role: "assistant", content: "truncated" } },
              { index: 2, finish_reason: "content_filter", message: { role: "assistant", content: "" } },
            ]
          : [
              {
                index: 0,
                finish_reason: callTool ? "tool_calls" : "stop",
                message: callTool
                  ? { role: "assistant", content: null, tool_calls: providerToolCalls }
                  : {
                      role: "assistant",
                      content: hasHistory
                        ? "The answer is 42, confirmed."
                        : prompt.startsWith("__pii__")
                        ? "Contact result@example.com."
                        : body.response_format
                        ? '{"answer":"pong"}'
                        : "pong",
                    },
              },
            ];
      res.json({
        id: "completion-1",
        object: "chat.completion",
        created: 1700000000,
        model: "test-model",
        choices,
        usage:
          prompt === "__without_usage__"
            ? undefined
            : {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
                prompt_tokens_details: { audio_tokens: 0, cached_tokens: 2 },
                completion_tokens_details: {
                  accepted_prediction_tokens: 0,
                  rejected_prediction_tokens: 0,
                  audio_tokens: 0,
                  reasoning_tokens: 1,
                },
              },
      });
    });
    server = await new Promise<Server>((resolve) => {
      const listener = app.listen(0, "0.0.0.0", () => resolve(listener));
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Conversation test provider did not bind to a TCP port");
    }
    await TestContainers.exposeHostPorts(address.port);
    network = await new Network().start();
    dapr = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withAppName("conversation-alpha2-tests")
      .withEnvironment({ DAPR_API_TOKEN: "conversation-test-token" })
      .withCopyContentToContainer([
        {
          target: "/dapr-resources/conversation-resiliency.yaml",
          content: JSON.stringify({
            apiVersion: "dapr.io/v1alpha1",
            kind: "Resiliency",
            metadata: { name: "conversation-resiliency" },
            spec: {
              policies: {
                timeouts: { conversationTimeout: "2s" },
                retries: { noRetries: { policy: "constant", duration: "10ms", maxRetries: 0 } },
              },
              targets: { components: { llm: { outbound: { timeout: "conversationTimeout", retry: "noRetries" } } } },
            },
          }),
        },
      ])
      .withComponent(
        new Component("llm", "conversation.openai", "v1", [
          { name: "key", value: "local-test-key" },
          { name: "model", value: "test-model" },
          { name: "endpoint", value: `http://host.testcontainers.internal:${address.port}/v1` },
        ]),
      )
      .start();
    for (const protocol of [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC]) {
      const client = new DaprClient({
        daprHost: dapr.getHost(),
        daprPort: String(protocol === CommunicationProtocolEnum.HTTP ? dapr.getHttpPort() : dapr.getGrpcPort()),
        communicationProtocol: protocol,
        daprApiToken: "conversation-test-token",
      });
      clients.push(client);
      await client.start();
    }
  }, 180_000);

  afterAll(
    () =>
      runWithCleanupErrorSuppression(async () => {
        await Promise.all(clients.map((client) => client.stop()));
        await dapr?.stop();
        await network?.stop();
        if (server) {
          await new Promise<void>((resolve, reject) => server!.close((error) => (error ? reject(error) : resolve())));
        }
      }),
    60_000,
  );

  beforeEach(() => {
    requests.length = 0;
    slowRequestClosed = undefined;
  });

  describe.each([
    ["HTTP", 0],
    ["gRPC", 1],
  ] as const)("%s", (_name, index) => {
    function basicRequest(text = "Reply pong"): ConversationRequestAlpha2 {
      return {
        name: "llm",
        contextId: "conversation-context",
        inputs: [{ messages: [{ ofUser: { content: [{ text }] } }] }],
        temperature: 0,
        scrubPii: false,
        parameters: { reserved: { nested: [true, 1, null] } },
      };
    }

    function toolRequest(): ConversationRequestAlpha2 {
      return {
        ...basicRequest(),
        tools: [
          {
            function: {
              name: "lookup",
              description: "Look up an answer",
              parameters: { type: "object", properties: { key: { type: "string" } }, required: ["key"] },
            },
          },
          { function: { name: "label", parameters: { type: "object", properties: {} } } },
        ],
        toolChoice: "required",
      };
    }

    function followupMessages(toolCalls: ConversationToolCalls[]): ConversationMessage[] {
      return [
        ...basicRequest().inputs[0].messages,
        { ofAssistant: { toolCalls } },
        { ofTool: { toolId: "call-1", name: "lookup", content: [{ text: "42" }] } },
        { ofTool: { toolId: "call-2", name: "label", content: [{ text: "confirmed" }] } },
      ];
    }

    async function expectRecovery() {
      const response = await clients[index].conversation.converse(basicRequest());
      expect(response.outputs[0].choices[0].message?.content).toBe("pong");
    }

    it("converses through an authenticated sidecar and normalizes the result", async () => {
      const result = await clients[index].conversation.converse(basicRequest());
      expect(result.contextId).toBe("conversation-context");
      expect(result.outputs[0].choices[0]).toEqual({
        index: 0,
        finishReason: "stop",
        message: { content: "pong", toolCalls: [] },
      });
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        model: "test-model",
        messages: [{ role: "user", content: "Reply pong" }],
      });
    });

    it("preserves tool definitions, assistant calls, and matching tool results across a full round trip", async () => {
      const request = toolRequest();
      const first = await clients[index].conversation.converse(request);
      const choice = first.outputs[0].choices[0];
      expect(choice.finishReason).toBe("tool_calls");
      expect(choice.message?.toolCalls).toEqual([
        { id: "call-1", function: { name: "lookup", arguments: '{"key":"answer"}' } },
        { id: "call-2", function: { name: "label", arguments: "{}" } },
      ]);
      expect(requests[0]).toMatchObject({
        tools: request.tools!.map((tool) => ({ type: "function", function: tool.function })),
        tool_choice: "required",
      });
      const messages = followupMessages(choice.message!.toolCalls);
      const second = await clients[index].conversation.converse({
        ...request,
        inputs: [{ messages }],
        toolChoice: "none",
      });
      expect(second.outputs[0].choices[0].message?.content).toBe("The answer is 42, confirmed.");
      expect(requests).toHaveLength(2);
      expect(requests[1].messages).toEqual([
        expect.objectContaining({ role: "user", content: "Reply pong" }),
        expect.objectContaining({
          role: "assistant",
          tool_calls: [
            { id: "call-1", type: "function", function: { name: "lookup", arguments: '{"key":"answer"}' } },
            { id: "call-2", type: "function", function: { name: "label", arguments: "{}" } },
          ],
        }),
        expect.objectContaining({ role: "tool", tool_call_id: "call-1", content: "42" }),
        expect.objectContaining({ role: "tool", tool_call_id: "call-2", content: "confirmed" }),
      ]);
    });

    minimumDaprRuntime("1.19.0", "forwards the token cap without dropping the request limit", async () => {
      await clients[index].conversation.converse({ ...basicRequest(), maxTokens: 100 });
      expect(requests[0].max_completion_tokens).toBe(100);
    });

    minimumDaprRuntime("1.17.0", "forwards structured output without parsing returned text", async () => {
      const request = {
        ...basicRequest(),
        responseFormat: {
          type: "object",
          properties: { answer: { type: "string" } },
          required: ["answer"],
          additionalProperties: false,
        },
      };
      const response = await clients[index].conversation.converse(request);
      expect(response.outputs[0]).toMatchObject({
        choices: [{ message: { content: '{"answer":"pong"}' } }],
      });
      expect(requests[0]).toMatchObject({
        response_format: {
          type: "json_schema",
          json_schema: { schema: request.responseFormat },
        },
      });
    });

    minimumDaprRuntime("1.17.0", "forwards cache retention without losing application metadata", async () => {
      await clients[index].conversation.converse({
        ...basicRequest(),
        promptCacheRetention: Temporal.Duration.from({ hours: 24 }),
        metadata: { tenant: "example" },
      });
      expect(requests[0].metadata).toMatchObject({ tenant: "example" });
      // Dapr 1.19.0-rc.4 puts retention in metadata rather than the provider's top-level option.
      if (requests[0].prompt_cache_retention === undefined) {
        expect(requests[0].metadata).toMatchObject({ prompt_cache_retention: "24h0m0s" });
      } else {
        expect(requests[0].prompt_cache_retention).toBe("24h");
      }
    });

    minimumDaprRuntime("1.18.0", "preserves the model name reported by the component", async () => {
      const response = await clients[index].conversation.converse(basicRequest());
      expect(response.outputs[0].model).toBe("test-model");
    });

    minimumDaprRuntime("1.17.0", "preserves all usage details", async () => {
      const response = await clients[index].conversation.converse(basicRequest());
      expect(response.outputs[0]).toMatchObject({
        usage: {
          completionTokens: 5,
          promptTokens: 10,
          totalTokens: 15,
          promptTokensDetails: { audioTokens: 0, cachedTokens: 2 },
          completionTokensDetails: {
            acceptedPredictionTokens: 0,
            rejectedPredictionTokens: 0,
            audioTokens: 0,
            reasoningTokens: 1,
          },
        },
      });
    });

    it("preserves every choice and finish reason", async () => {
      const response = await clients[index].conversation.converse(basicRequest("__multiple_choices__"));
      expect(response.outputs.flatMap((output) => output.choices)).toEqual([
        { index: 0, finishReason: "stop", message: { content: "first", toolCalls: [] } },
        { index: 1, finishReason: "length", message: { content: "truncated", toolCalls: [] } },
        { index: 2, finishReason: "content_filter", message: { content: "", toolCalls: [] } },
      ]);
    });

    it("handles omitted provider usage without reporting nonzero counts", async () => {
      const response = await clients[index].conversation.converse(basicRequest("__without_usage__"));
      expect(response.outputs[0].choices[0].message?.content).toBe("pong");
      // Some components materialize an all-zero usage object when the provider omits usage.
      if (response.outputs[0].usage !== undefined) {
        expect(response.outputs[0].usage).toMatchObject({ completionTokens: 0, promptTokens: 0, totalTokens: 0 });
      }
    });

    it.each([
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ])("scrubs PII in the configured direction (input %s, output %s)", async (input, output) => {
      const response = await clients[index].conversation.converse({
        ...basicRequest(),
        inputs: [
          { scrubPii: input, messages: [{ ofUser: { content: [{ text: "__pii__ Contact input@example.com." }] } }] },
        ],
        scrubPii: output,
      });
      const sent = requests[0].messages[0].content;
      const received = response.outputs[0].choices[0].message?.content;
      expect(sent).toContain("Contact");
      expect(received).toContain("Contact");
      if (input) expect(sent).not.toContain("input@example.com");
      else expect(sent).toBe("__pii__ Contact input@example.com.");
      if (output) expect(received).not.toContain("result@example.com");
      else expect(received).toBe("Contact result@example.com.");
    });

    it.each([
      "wrong ID",
      "duplicate",
      "missing result",
      "missing assistant",
      "wrong order",
      "wrong result",
      "wrong arguments",
    ])("rejects %s in a tool history and recovers", async (fault) => {
      const request = toolRequest();
      const first = await clients[index].conversation.converse(request);
      const messages = followupMessages(first.outputs[0].choices[0].message!.toolCalls);
      switch (fault) {
        case "wrong ID":
          messages[2].ofTool!.toolId = "unrelated";
          break;
        case "duplicate":
          messages.push(messages[2]);
          break;
        case "missing result":
          messages.pop();
          break;
        case "missing assistant":
          messages.splice(1, 1);
          break;
        case "wrong order":
          [messages[1], messages[2]] = [messages[2], messages[1]];
          break;
        case "wrong result":
          messages[2].ofTool!.content[0].text = "incorrect";
          break;
        case "wrong arguments":
          messages[1].ofAssistant!.toolCalls![0].function.arguments = "not-json";
          break;
      }
      await expect(
        clients[index].conversation.converse({
          ...request,
          inputs: [{ messages }],
          toolChoice: "none",
        }),
      ).rejects.toThrow("invalid tool history");
      expect(requests).toHaveLength(2);
      await expectRecovery();
      expect(requests).toHaveLength(3);
    });

    it("rejects invalid tool choices at the sidecar without invoking the provider", async () => {
      await expect(clients[index].conversation.converse({ ...toolRequest(), toolChoice: "missing" })).rejects.toThrow();
      await expect(
        clients[index].conversation.converse({ ...basicRequest(), toolChoice: "required" }),
      ).rejects.toThrow();
      expect(requests).toHaveLength(0);
      await expectRecovery();
    });

    it.each(["wrong-token", ""])("rejects invalid authentication '%s' before reaching the provider", async (token) => {
      const invalidClient = new DaprClient({ ...clients[index].options, daprApiToken: token });
      // Bypass readiness polling so this tests authentication of Converse itself.
      invalidClient.daprClient.setIsInitialized(true);
      try {
        await expect(invalidClient.conversation.converse(basicRequest())).rejects.toThrow(/401|unauthenticated|token/i);
        expect(requests).toHaveLength(0);
      } finally {
        await invalidClient.stop();
      }
      await expectRecovery();
    });

    it.each([400, 429, 503])("propagates provider %s without duplicating the request and recovers", async (status) => {
      await expect(clients[index].conversation.converse(basicRequest(`__status_${status}__`))).rejects.toThrow(
        `intentional provider ${status} failure`,
      );
      expect(requests).toHaveLength(1);
      await expectRecovery();
      expect(requests).toHaveLength(2);
    });

    it.each(["__malformed_json__", "__invalid_choices__", "__disconnect__"])(
      "rejects provider failure %s instead of returning a successful empty response",
      async (scenario) => {
        await expect(clients[index].conversation.converse(basicRequest(scenario))).rejects.toThrow();
        expect(requests).toHaveLength(1);
        await expectRecovery();
        expect(requests).toHaveLength(2);
      },
    );

    it("isolates concurrent successful and failed conversations on the same client", async () => {
      const results = await Promise.allSettled([
        clients[index].conversation.converse({ ...basicRequest(), contextId: "first" }),
        clients[index].conversation.converse({ ...basicRequest("__status_503__"), contextId: "failed" }),
        clients[index].conversation.converse({ ...basicRequest(), contextId: "last" }),
      ]);
      expect(results).toEqual([
        { status: "fulfilled", value: expect.objectContaining({ contextId: "first" }) },
        { status: "rejected", reason: expect.any(Error) },
        { status: "fulfilled", value: expect.objectContaining({ contextId: "last" }) },
      ]);
      expect(requests).toHaveLength(3);
      await expectRecovery();
      expect(requests).toHaveLength(4);
    });

    it("honors the sidecar timeout, cancels the provider request, and recovers", async () => {
      const closed = new Promise<void>((resolve) => {
        slowRequestClosed = resolve;
      });
      const start = performance.now();
      await expect(clients[index].conversation.converse(basicRequest("__slow__"))).rejects.toThrow(
        /deadline|timeout|context canceled/i,
      );
      const elapsed = performance.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(1000);
      expect(elapsed).toBeLessThan(10000);
      await closed;
      expect(requests).toHaveLength(1);
      await expectRecovery();
      expect(requests).toHaveLength(2);
    }, 15000);

    it("propagates missing components without invoking the provider and recovers", async () => {
      await expect(clients[index].conversation.converse({ ...basicRequest(), name: "missing" })).rejects.toThrow();
      expect(requests).toHaveLength(0);
      await expectRecovery();
    });
  });
});

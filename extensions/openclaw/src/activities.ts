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

import { WorkflowActivityContext } from "@dapr/dapr";
import { getContextWithRetry } from "./registry";
import {
  LlmCallInput,
  LlmCallOutput,
  ToolCallInput,
  ToolCallOutput,
  EmitEventInput,
  AgentRuntimeContext,
} from "./types";

/**
 * Dapr activity: make a single LLM call via the Agent's streamFn.
 *
 * Mirrors the behavior of streamAssistantResponse() in pi-agent-core's
 * agent-loop.js: transforms context, converts messages for the LLM, streams
 * the response, and emits message events for real-time UX.
 *
 * Returns the complete assistant message and any tool calls it contains.
 */
export async function llmCall(_ctx: WorkflowActivityContext, input: LlmCallInput): Promise<LlmCallOutput> {
  const rt = await getContextWithRetry(input.workflowId);

  const messages = [...input.messages];
  const steeringMessages: any[] = [];

  // Drain the Agent's steering queue (messages injected while the loop runs).
  // We track these separately so we can return them in LlmCallOutput; the
  // workflow appends them to its conversation history. Without that, they
  // would influence only the current turn and disappear on the next iteration
  // or on replay after a crash.
  if (rt.config.getSteeringMessages) {
    const steering: any[] = await rt.config.getSteeringMessages();
    if (steering?.length) {
      for (const msg of steering) {
        await rt.emit({ type: "message_start", message: msg });
        await rt.emit({ type: "message_end", message: msg });
        messages.push(msg);
        steeringMessages.push(msg);
      }
    }
  }

  // Transform and convert messages to the LLM wire format
  let contextMessages = messages;
  if (rt.config.transformContext) {
    contextMessages = await rt.config.transformContext(messages, rt.signal);
  }
  const llmMessages = await rt.config.convertToLlm(contextMessages);

  // Resolve API key dynamically (provider plugins may rotate keys)
  const apiKey = rt.config.getApiKey ? await rt.config.getApiKey(rt.config.model.provider) : undefined;

  // Build the context object that streamFn expects
  const tools = input.toolNames.map((n) => rt.tools.get(n)).filter(Boolean);
  const llmContext = {
    systemPrompt: input.systemPrompt,
    messages: llmMessages,
    tools: tools.length > 0 ? tools : undefined,
  };
  const options = { ...rt.config, apiKey, signal: rt.signal };

  // Stream the LLM response, emitting events for OpenClaw's subscription handler
  const stream = await rt.streamFn(rt.config.model, llmContext, options);
  let assistantMessage: any = null;

  for await (const event of stream) {
    switch (event.type) {
      case "start":
        assistantMessage = event.partial;
        await rt.emit({ type: "message_start", message: assistantMessage });
        break;

      case "done":
      case "error": {
        const final = stream.result ? await stream.result() : event.message || assistantMessage;
        assistantMessage = final;
        await rt.emit({ type: "message_end", message: final });
        break;
      }

      default:
        // text_delta, thinking_delta, toolcall_delta, etc.
        if (event.partial) assistantMessage = event.partial;
        await rt.emit({
          type: "message_update",
          message: assistantMessage,
          assistantMessageEvent: event,
        });
    }
  }

  if (!assistantMessage) {
    return {
      assistantMessage: {},
      toolCalls: [],
      stopReason: "error",
      error: "No response from LLM",
      steeringMessages,
    };
  }

  const toolCalls = (assistantMessage.content || [])
    .filter((c: any) => c.type === "toolCall")
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      arguments: c.arguments,
    }));

  return {
    assistantMessage,
    toolCalls,
    stopReason: assistantMessage.stopReason || "end_turn",
    error: assistantMessage.errorMessage,
    steeringMessages,
  };
}

/**
 * Dapr activity: execute a single tool call.
 *
 * Mirrors the prepare → execute → finalize pipeline in pi-agent-core's
 * agent-loop.js, including beforeToolCall and afterToolCall hooks.
 */
export async function toolCall(_ctx: WorkflowActivityContext, input: ToolCallInput): Promise<ToolCallOutput> {
  const rt = await getContextWithRetry(input.workflowId);
  const tool = rt.tools.get(input.toolName);

  await rt.emit({
    type: "tool_execution_start",
    toolCallId: input.toolCallId,
    toolName: input.toolName,
    args: input.args,
  });

  let content: any[];
  let details: any;
  let isError = false;

  // Real prompt context for beforeToolCall / afterToolCall hooks.
  // Without this, hooks that inspect conversation state to authorize/block or
  // to rewrite results would see empty stubs and silently misbehave.
  // input.toolNames is the set of tools available to the agent for this call;
  // resolve to the live tool instances from the runtime registry.
  const hookContext = {
    systemPrompt: input.systemPrompt,
    messages: input.messages,
    tools: input.toolNames.map((n) => rt.tools.get(n)).filter(Boolean),
  };

  if (!tool) {
    content = [{ type: "text", text: `Tool '${input.toolName}' not found` }];
    isError = true;
  } else {
    // beforeToolCall hook — can block execution
    if (rt.config.beforeToolCall) {
      const beforeResult = await rt.config.beforeToolCall(
        {
          assistantMessage: input.assistantMessage,
          toolCall: {
            type: "toolCall",
            id: input.toolCallId,
            name: input.toolName,
            arguments: input.args,
          },
          args: input.args,
          context: hookContext,
        },
        rt.signal,
      );
      if (beforeResult?.block) {
        content = [{ type: "text", text: beforeResult.reason || "Blocked by hook" }];
        isError = true;
        return finalize(rt, input, content, details, isError);
      }
    }

    // Execute the tool
    try {
      const onUpdate = async (partialResult: any) => {
        await rt.emit({
          type: "tool_execution_update",
          toolCallId: input.toolCallId,
          toolName: input.toolName,
          args: input.args,
          partialResult,
        });
      };
      const result = await tool.execute(input.toolCallId, input.args, rt.signal, onUpdate);
      content = result.content;
      details = result.details;
    } catch (err: any) {
      content = [{ type: "text", text: err.message || String(err) }];
      isError = true;
    }

    // afterToolCall hook — can override result fields
    if (rt.config.afterToolCall && content) {
      const afterResult = await rt.config.afterToolCall(
        {
          assistantMessage: input.assistantMessage,
          toolCall: {
            type: "toolCall",
            id: input.toolCallId,
            name: input.toolName,
            arguments: input.args,
          },
          args: input.args,
          result: { content, details },
          isError,
          context: hookContext,
        },
        rt.signal,
      );
      if (afterResult) {
        if (afterResult.content !== undefined) content = afterResult.content;
        if (afterResult.details !== undefined) details = afterResult.details;
        if (afterResult.isError !== undefined) isError = afterResult.isError;
      }
    }
  }

  return finalize(rt, input, content!, details, isError);
}

/**
 * Dapr activity: emit a lifecycle event (turn_start, turn_end) to the Agent.
 */
export async function emitEvent(_ctx: WorkflowActivityContext, input: EmitEventInput): Promise<void> {
  const rt = await getContextWithRetry(input.workflowId);
  await rt.emit(input.event);
}

// --- helpers ---

async function finalize(
  rt: AgentRuntimeContext,
  input: ToolCallInput,
  content: any[],
  details: any,
  isError: boolean,
): Promise<ToolCallOutput> {
  const toolResultMessage = {
    role: "toolResult",
    toolCallId: input.toolCallId,
    toolName: input.toolName,
    content,
    details,
    isError,
    timestamp: Date.now(),
  };

  // Emit tool_execution_end
  await rt.emit({
    type: "tool_execution_end",
    toolCallId: input.toolCallId,
    toolName: input.toolName,
    result: content,
    isError,
  });

  // The original loop also emits message_start/end for each tool result
  await rt.emit({ type: "message_start", message: toolResultMessage });
  await rt.emit({ type: "message_end", message: toolResultMessage });

  return { toolResultMessage, isError };
}

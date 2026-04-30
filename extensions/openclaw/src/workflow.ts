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

import { TWorkflow, WorkflowContext } from "@dapr/dapr";
import { llmCall, toolCall, emitEvent } from "./activities";
import {
  AgentLoopWorkflowInput,
  AgentLoopWorkflowOutput,
  LlmCallInput,
  ToolCallInput,
  EmitEventInput,
  LlmCallOutput,
  ToolCallOutput,
} from "./types";

/**
 * Dapr Workflow that replaces pi-agent-core's internal agent loop.
 *
 * One workflow instance per Agent.prompt() call. Each LLM call and each tool
 * call is a separate Dapr activity, giving per-operation durability: if the
 * process crashes, Dapr replays completed activities from its state store and
 * resumes from the last checkpoint.
 *
 * The loop structure mirrors agent-loop.js's runLoop():
 *   while (iterations < max) {
 *     turn_start
 *     LLM call  →  if no tool calls → turn_end, break
 *     tool calls (sequential or parallel)
 *     turn_end
 *   }
 */
export const durableAgentLoop: TWorkflow = async function* (ctx: WorkflowContext, input: AgentLoopWorkflowInput): any {
  const workflowId = ctx.getWorkflowInstanceId();
  let messages = [...input.messages];
  let iteration = 0;

  while (iteration < input.maxIterations) {
    // --- turn_start ---
    yield ctx.callActivity(emitEvent, {
      workflowId,
      event: { type: "turn_start" },
    } as EmitEventInput);

    // --- LLM call ---
    const llmResult: LlmCallOutput = yield ctx.callActivity(llmCall, {
      workflowId,
      messages,
      systemPrompt: input.systemPrompt,
      toolNames: input.toolNames,
    } as LlmCallInput);

    messages = [...messages, llmResult.assistantMessage];

    // No tool calls → done
    if (!llmResult.toolCalls.length || llmResult.error) {
      yield ctx.callActivity(emitEvent, {
        workflowId,
        event: {
          type: "turn_end",
          message: llmResult.assistantMessage,
          toolResults: [],
        },
      } as EmitEventInput);
      break;
    }

    // --- Tool calls ---
    let toolResults: ToolCallOutput[];

    if (input.toolExecution === "parallel") {
      // Fan-out: schedule all tool calls, wait for all to complete
      const tasks = llmResult.toolCalls.map((tc) =>
        ctx.callActivity(toolCall, {
          workflowId,
          toolCallId: tc.id,
          toolName: tc.name,
          args: tc.arguments,
          assistantMessage: llmResult.assistantMessage,
        } as ToolCallInput),
      );
      toolResults = yield ctx.whenAll(tasks);
    } else {
      // Sequential: one tool at a time
      toolResults = [];
      for (const tc of llmResult.toolCalls) {
        const result: ToolCallOutput = yield ctx.callActivity(toolCall, {
          workflowId,
          toolCallId: tc.id,
          toolName: tc.name,
          args: tc.arguments,
          assistantMessage: llmResult.assistantMessage,
        } as ToolCallInput);
        toolResults.push(result);
      }
    }

    // Append tool result messages to conversation
    const toolResultMessages = toolResults.map((r) => r.toolResultMessage);
    messages = [...messages, ...toolResultMessages];

    // --- turn_end ---
    yield ctx.callActivity(emitEvent, {
      workflowId,
      event: {
        type: "turn_end",
        message: llmResult.assistantMessage,
        toolResults: toolResultMessages,
      },
    } as EmitEventInput);

    iteration++;
  }

  return { messages, iterations: iteration } as AgentLoopWorkflowOutput;
};

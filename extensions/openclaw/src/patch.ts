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

import { DaprWorkflowClient, WorkflowRuntimeStatus } from "@dapr/dapr";
import { createHash } from "node:crypto";
import { registerContext, unregisterContext } from "./registry";
import { AgentLoopWorkflowInput } from "./types";
import { durableAgentLoop } from "./workflow";

/**
 * Build a deterministic per-prompt workflow ID.
 *
 * The ID must be:
 *   - Stable across retries of the *same* prompt, so a process that crashed
 *     mid-flight can re-attach to the running workflow on restart (resume).
 *   - Distinct between different prompts in the same session, so two
 *     overlapping prompts (or a retry whose message changed) don't collide on
 *     a single workflow instance and return the wrong conversation.
 *
 * Hashing the new prompt messages plus the static prompt context (system
 * prompt, available tool names) gives both properties: identical inputs hash
 * to the same fingerprint regardless of when they're issued, and any change
 * in the prompt produces a different fingerprint.
 */
function buildWorkflowId(sessionId: string, messages: any[], systemPrompt: string, toolNames: string[]): string {
  // Strip volatile fields before hashing. Agent.normalizePromptInput in
  // pi-agent-core stamps `timestamp: Date.now()` on every wrapped user
  // message — including this in the hash would make every retry produce a
  // different workflow ID, breaking crash recovery. The content + role
  // identify the prompt; the timestamp does not.
  const stable = JSON.stringify({ messages, systemPrompt, toolNames }, (key, value) =>
    key === "timestamp" ? undefined : value,
  );
  const fingerprint = createHash("sha256").update(stable).digest("hex").slice(0, 16);
  return `openclaw-${sessionId}-${fingerprint}`;
}

/** Symbol used to store the original method on the Agent prototype. */
const ORIGINAL_RUN_PROMPT = Symbol("dapr:originalRunPromptMessages");

/**
 * Replace Agent.prototype.runPromptMessages with a version that delegates to a
 * Dapr Workflow. Everything else in the Agent — prompt(), continue(), event
 * emission, state management — stays untouched.
 *
 * The patched runPromptMessages:
 *   1. Registers the runtime context (streamFn, tools, emit) in the global
 *      registry so activities can access them in-process.
 *   2. Schedules a Dapr Workflow that orchestrates the LLM↔tool loop.
 *   3. Waits for the workflow to complete.
 *   4. Syncs the Agent's message state from the workflow output.
 */
export function patchAgent(agentClass: any, workflowClient: DaprWorkflowClient, maxIterations: number): void {
  const proto = agentClass.prototype;

  // Stash the original so we can restore it
  if (!proto[ORIGINAL_RUN_PROMPT]) {
    proto[ORIGINAL_RUN_PROMPT] = proto.runPromptMessages;
  }

  proto.runPromptMessages = async function runPromptMessagesDapr(messages: any[], options: any = {}): Promise<void> {
    console.log("[dapr] runPromptMessages intercepted — routing through Dapr Workflow");

    // Use the Agent's own lifecycle wrapper (handles abort controller,
    // activeRun tracking, isStreaming flag, error handling, and finishRun).
    await this.runWithLifecycle(async (signal: AbortSignal) => {
      const context = this.createContextSnapshot();
      const config = this.createLoopConfig(options);

      const emit = async (event: any) => {
        await this.processEvents(event);
      };

      // Merge prompt messages into the existing conversation
      const allMessages = [...context.messages, ...messages];

      // Build tool name list for the workflow (tools live in registry, not serialized)
      const toolNames = context.tools.map((t: any) => t.name);
      const toolMap = new Map<string, any>();
      for (const tool of context.tools) {
        toolMap.set(tool.name, tool);
      }

      // Deterministic per-prompt workflow ID — stable for retries of this
      // exact prompt, distinct from other prompts in the same session.
      const sessionId = this.sessionId || "default";
      const workflowId = buildWorkflowId(sessionId, messages, context.systemPrompt, toolNames);

      // Register the runtime context so activities can look up in-memory resources.
      registerContext(workflowId, {
        emit,
        streamFn: this.streamFn,
        tools: toolMap,
        config,
        signal,
      });

      try {
        // Check if a previous run left a workflow in RUNNING state (crash recovery).
        let instanceId = workflowId;
        let isResume = false;
        try {
          const existing = await workflowClient.getWorkflowState(workflowId, true);
          if (existing && existing.runtimeStatus === WorkflowRuntimeStatus.RUNNING) {
            console.log(`[dapr] Resuming existing workflow ${workflowId} (crash recovery)`);
            isResume = true;
          }
        } catch (_) {
          // getWorkflowState throws if the workflow doesn't exist — that's fine.
        }

        if (!isResume) {
          // Purge any stale completed/failed workflow with the same ID
          try {
            await workflowClient.purgeWorkflow(workflowId);
          } catch (_) {
            /* ignore */
          }

          console.log(`[dapr] Scheduling new workflow ${workflowId}`);
          instanceId = await workflowClient.scheduleNewWorkflow(
            durableAgentLoop,
            {
              messages: allMessages,
              systemPrompt: context.systemPrompt,
              toolNames,
              maxIterations,
              toolExecution: this.toolExecution || "sequential",
            } as AgentLoopWorkflowInput,
            workflowId,
          );
        }

        // Wait for the workflow to complete
        console.log(`[dapr] Waiting for workflow ${instanceId} to complete...`);
        const state = await workflowClient.waitForWorkflowCompletion(instanceId, true);
        console.log(`[dapr] Workflow ${instanceId} finished (status=${state?.runtimeStatus})`);

        // waitForWorkflowCompletion returns on any terminal state — COMPLETED,
        // FAILED, TERMINATED, CANCELED. Only COMPLETED is success; for the
        // others we must surface the failure rather than silently emit
        // agent_end with stale state. runWithLifecycle catches this throw and
        // routes it through the Agent's standard error path.
        if (state?.runtimeStatus !== WorkflowRuntimeStatus.COMPLETED) {
          const status = state?.runtimeStatus ?? "UNKNOWN";
          const failureMsg = (state as any)?.failureDetails?.errorMessage;
          const detail = failureMsg ? `: ${failureMsg}` : "";
          throw new Error(`[dapr] Workflow ${instanceId} ended in non-COMPLETED state (${status})${detail}`);
        }

        // Parse the workflow output and sync the Agent's message state
        if (state?.serializedOutput) {
          const output = JSON.parse(state.serializedOutput);
          if (output?.messages) {
            this._state.messages = output.messages;
          }
        }

        // Emit agent_end so OpenClaw's event handlers pick up the result
        await emit({ type: "agent_end", messages: this._state.messages });
      } finally {
        unregisterContext(workflowId);
      }
    });
  };
}

/**
 * Restore the original runPromptMessages on the Agent prototype.
 */
export function unpatchAgent(agentClass: any): void {
  const proto = agentClass.prototype;
  if (proto[ORIGINAL_RUN_PROMPT]) {
    proto.runPromptMessages = proto[ORIGINAL_RUN_PROMPT];
    delete proto[ORIGINAL_RUN_PROMPT];
  }
}

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

import { AgentRuntimeContext } from "./types";

/**
 * In-memory registry mapping workflow instance IDs to Agent runtime contexts.
 *
 * Activities run in the same Node.js process as the workflow runtime, so they
 * can look up the Agent's streamFn, tools, and emit function here rather than
 * serializing them into Dapr state. On process restart, the registry is empty;
 * the patched runPromptMessages re-registers before the workflow resumes.
 */
const registry = new Map<string, AgentRuntimeContext>();

export function registerContext(workflowId: string, ctx: AgentRuntimeContext): void {
  registry.set(workflowId, ctx);
}

export function getContext(workflowId: string): AgentRuntimeContext {
  const ctx = registry.get(workflowId);
  if (!ctx) {
    throw new Error(
      `No agent runtime context registered for workflow "${workflowId}". ` +
        `This usually means the process restarted and the Agent has not re-registered yet.`,
    );
  }
  return ctx;
}

export function unregisterContext(workflowId: string): void {
  registry.delete(workflowId);
}

/**
 * Wait for a runtime context to be registered, polling at 100ms intervals.
 *
 * After a crash, the Dapr workflow runtime may dispatch a pending activity
 * before the application has called Agent.prompt() (which registers the
 * context). This function lets the activity wait for the context to appear.
 */
export async function getContextWithRetry(workflowId: string, timeoutMs = 30_000): Promise<AgentRuntimeContext> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ctx = registry.get(workflowId);
    if (ctx) return ctx;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Timed out waiting for agent runtime context for workflow "${workflowId}" ` +
      `(${timeoutMs}ms). Ensure Agent.prompt() is called after enable().`,
  );
}

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

import { DaprWorkflowClient, WorkflowRuntime } from "@dapr/dapr";
import { durableAgentLoop } from "./workflow";
import { llmCall, toolCall, emitEvent } from "./activities";
import { patchAgent, unpatchAgent } from "./patch";
import { EnableOptions } from "./types";

let workflowRuntime: WorkflowRuntime | null = null;
let workflowClient: DaprWorkflowClient | null = null;
let patchedClass: any = null;

/**
 * Enable durable agent execution for OpenClaw.
 *
 * This patches the Agent class from @mariozechner/pi-agent-core so that every
 * call to Agent.prompt() is orchestrated by a Dapr Workflow. Each LLM call and
 * each tool call becomes a separate Dapr activity with per-operation durability.
 *
 * Usage:
 *
 *   import { Agent } from "@mariozechner/pi-agent-core";
 *   import { enable } from "@dapr/openclaw";
 *
 *   await enable({ agentClass: Agent });
 *
 * Prerequisites:
 *   - A Dapr sidecar running alongside the OpenClaw process (dapr run ...)
 *   - A configured Dapr state store for workflow persistence
 */
export async function enable(options: EnableOptions): Promise<void> {
  if (workflowRuntime) {
    throw new Error("Durable agent execution is already enabled. Call disable() first.");
  }

  const daprHost = options.daprHost || "127.0.0.1";
  const daprPort = options.daprPort || "50001";
  const maxIterations = options.maxIterations || 100;

  // Create and start the workflow runtime (registers workflow + activities
  // with the Dapr sidecar's workflow engine)
  workflowRuntime = new WorkflowRuntime({ daprHost, daprPort });
  workflowRuntime
    .registerWorkflow(durableAgentLoop)
    .registerActivity(llmCall)
    .registerActivity(toolCall)
    .registerActivity(emitEvent);
  await workflowRuntime.start();

  // Create the workflow client for scheduling and monitoring workflows
  workflowClient = new DaprWorkflowClient({ daprHost, daprPort });

  // Patch the Agent class
  patchAgent(options.agentClass, workflowClient, maxIterations);
  patchedClass = options.agentClass;
}

/**
 * Disable durable agent execution and restore the original Agent behavior.
 */
export async function disable(): Promise<void> {
  if (patchedClass) {
    unpatchAgent(patchedClass);
    patchedClass = null;
  }

  if (workflowRuntime) {
    await workflowRuntime.stop();
    workflowRuntime = null;
  }

  if (workflowClient) {
    await workflowClient.stop();
    workflowClient = null;
  }
}

// Re-export types for consumers
export type {
  EnableOptions,
  AgentLoopWorkflowInput,
  AgentLoopWorkflowOutput,
  LlmCallInput,
  LlmCallOutput,
  ToolCallInput,
  ToolCallOutput,
} from "./types";

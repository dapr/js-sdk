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

// --- Workflow input/output ---

export interface AgentLoopWorkflowInput {
  /** Current conversation messages (serialized AgentMessage[]) */
  messages: any[];
  /** System prompt for the agent */
  systemPrompt: string;
  /** Names of available tools (actual implementations live in the registry) */
  toolNames: string[];
  /** Maximum LLM↔tool iterations before the workflow exits */
  maxIterations: number;
  /** Whether to run tool calls in parallel or sequentially */
  toolExecution: "sequential" | "parallel";
}

export interface AgentLoopWorkflowOutput {
  /** Final conversation messages after the workflow completes */
  messages: any[];
  /** Number of LLM↔tool iterations executed */
  iterations: number;
}

// --- Activity input/output ---

export interface LlmCallInput {
  /** Workflow instance ID, used to look up runtime context */
  workflowId: string;
  /** Current conversation messages */
  messages: any[];
  /** System prompt */
  systemPrompt: string;
  /** Available tool names */
  toolNames: string[];
}

export interface LlmCallOutput {
  /** The assistant's response message */
  assistantMessage: any;
  /** Tool calls requested by the assistant */
  toolCalls: ToolCallDescriptor[];
  /** Why the assistant stopped (e.g. "end_turn", "tool_use") */
  stopReason: string;
  /** Error message if the LLM call failed */
  error?: string;
}

export interface ToolCallDescriptor {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallInput {
  /** Workflow instance ID, used to look up runtime context */
  workflowId: string;
  /** Unique ID for this tool invocation */
  toolCallId: string;
  /** Tool to execute */
  toolName: string;
  /** Arguments to pass to the tool */
  args: Record<string, unknown>;
  /** The assistant message that requested this tool call (for hook context) */
  assistantMessage: any;
}

export interface ToolCallOutput {
  /** The tool result formatted as a ToolResultMessage */
  toolResultMessage: any;
  /** Whether the tool execution errored */
  isError: boolean;
}

export interface EmitEventInput {
  /** Workflow instance ID */
  workflowId: string;
  /** The AgentEvent to emit */
  event: any;
}

// --- Public API options ---

export interface EnableOptions {
  /** The Agent class from @mariozechner/pi-agent-core to patch */
  agentClass: any;
  /** Dapr sidecar host (default: "127.0.0.1") */
  daprHost?: string;
  /** Dapr sidecar gRPC port (default: "50001") */
  daprPort?: string;
  /** Max LLM↔tool iterations per prompt() call (default: 100) */
  maxIterations?: number;
}

// --- Runtime context (in-memory, not serialized) ---

export interface AgentRuntimeContext {
  /** Emit an AgentEvent to the Agent's subscribers */
  emit: (event: any) => Promise<void> | void;
  /** The Agent's LLM streaming function */
  streamFn: (...args: any[]) => any;
  /** Tool name → tool instance (with execute method) */
  tools: Map<string, any>;
  /** AgentLoopConfig equivalent built by the Agent */
  config: any;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

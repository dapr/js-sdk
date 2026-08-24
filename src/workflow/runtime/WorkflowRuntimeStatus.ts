/*
Copyright 2024 The Dapr Authors
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

import { OrchestrationStatus } from "../internal/durabletask/orchestration/enum/orchestration-status.enum";

/**
 * Enumerates the possible runtime states of a workflow instance throughout its lifecycle.
 *
 * Workflow instances transition through these states based on orchestration logic execution,
 * activity completion, external events, and explicit control operations. Each state represents
 * a distinct phase in the workflow's execution model.
 *
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/}
 */
export enum WorkflowRuntimeStatus {
  /**
   * The workflow instance is actively executing orchestration code or waiting for scheduled tasks.
   *
   * Normal operational state where the workflow is processing activities, timers, child workflows,
   * or waiting for external events. Activities may be running concurrently.
   */
  RUNNING = OrchestrationStatus.RUNNING,

  /**
   * The workflow instance completed successfully and produced output.
   *
   * Terminal state indicating the orchestration function returned normally. The workflow output
   * is persisted and available for retrieval. No further execution occurs.
   */
  COMPLETED = OrchestrationStatus.COMPLETED,

  /**
   * The workflow instance encountered an unhandled exception during execution.
   *
   * Terminal state indicating an activity, sub-workflow, or orchestrator code threw an exception
   * that was not caught. Failure details (error type, message, stack trace) are persisted.
   * The workflow cannot be resumed; use `purgeWorkflow()` to clean up its state.
   */
  FAILED = OrchestrationStatus.FAILED,

  /**
   * The workflow instance was explicitly stopped via client operation.
   *
   * Terminal state indicating the workflow was terminated by calling `client.terminateWorkflow()`.
   * An optional termination output value may have been provided. The workflow is no longer executing.
   */
  TERMINATED = OrchestrationStatus.TERMINATED,

  /**
   * The workflow instance restarted with new input via the "continue-as-new" pattern.
   *
   * Terminal state for the current execution context indicating the orchestrator called
   * `context.continueAsNew()` to truncate history and restart with fresh input. This enables
   * the "eternal workflow" pattern, useful for long-lived processes that need to reset history.
   * A new instance ID is generated for continuation.
   */
  CONTINUED_AS_NEW = OrchestrationStatus.CONTINUED_AS_NEW,

  /**
   * The workflow instance is scheduled but has not started executing yet.
   *
   * Initial state for newly scheduled workflows before the TaskHub begins processing them.
   * Transitions to RUNNING when the TaskHub picks up the workflow for execution. This state
   * is typically very brief and rarely observed in practice.
   */
  PENDING = OrchestrationStatus.PENDING,

  /**
   * The workflow instance is paused and not executing.
   *
   * Non-terminal state indicating the workflow was suspended via `client.suspendWorkflow()`.
   * Suspended workflows do not process scheduled activities or timers. Execution can be resumed
   * by calling `client.resumeWorkflow()`, transitioning back to RUNNING. Useful for administrative
   * throttling or maintenance windows.
   */
  SUSPENDED = OrchestrationStatus.SUSPENDED,
}

/**
 * Converts an OrchestrationStatus value to the corresponding WorkflowRuntimeStatus enum value.
 *
 * @param {OrchestrationStatus} val - The OrchestrationStatus value to be converted.
 * @returns {WorkflowRuntimeStatus} - The equivalent WorkflowRuntimeStatus enum value.
 */
export function fromOrchestrationStatus(val: OrchestrationStatus): WorkflowRuntimeStatus {
  const values = Object.values(WorkflowRuntimeStatus);
  const valIdx = values.findIndex((v) => v === (val as number));

  // Return the entry of the WorkflowRuntimeStatus enum at index
  const entries = Object.entries(WorkflowRuntimeStatus);
  return entries[valIdx][1] as WorkflowRuntimeStatus;
}

/**
 * Converts an WorkflowRuntimeStatus value to the corresponding OrchestrationStatus enum value.
 *
 * @param {WorkflowRuntimeStatus} val - The WorkflowRuntimeStatus value to be converted.
 * @returns {OrchestrationStatus} - The equivalent OrchestrationStatus enum value.
 */
export function toOrchestrationStatus(val: WorkflowRuntimeStatus): OrchestrationStatus {
  const values = Object.values(OrchestrationStatus);
  const valIdx = values.findIndex((v) => v === (val as number));

  // Return the entry of the WorkflowRuntimeStatus enum at index
  const entries = Object.entries(OrchestrationStatus);
  return entries[valIdx][1] as OrchestrationStatus;
}

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

/**
 * Execution status of a workflow instance.
 *
 * Indicates the current lifecycle state of a workflow orchestration.
 * Status transitions reflect the orchestration progress from creation to completion or failure.
 *
 * **Status Lifecycle:**
 * - `Pending` → `Running` → (`Completed` | `Failed` | `Terminated` | `ContinuedAsNew`)
 * - `Running` → `Suspended` → `Running` (suspension/resumption)
 *
 * @see {@link DaprWorkflowClient.getWorkflowState}
 * @see {@link WorkflowState.runtimeStatus}
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/#understanding-workflow-state}
 */
export enum WorkflowRuntimeStatus {
  /**
   * Initial status before the workflow begins execution.
   *
   * The workflow instance has been created but the orchestrator function has not started yet.
   * Transitions to Running when the sidecar begins processing the workflow.
   */
  Unknown = "Unknown",

  /**
   * Workflow orchestrator function is currently executing or awaiting durable tasks.
   *
   * The workflow is active and either:
   * - Executing orchestrator code
   * - Waiting for activities, timers, or external events to complete
   * - Replaying from history
   */
  Running = "Running",

  /**
   * Workflow has completed successfully.
   *
   * The orchestrator function returned a value without exceptions.
   * {@link WorkflowState.serializedOutput} contains the return value.
   * This is a terminal state.
   */
  Completed = "Completed",

  /**
   * Workflow terminated due to an unhandled exception or activity failure.
   *
   * An activity, sub-workflow, or orchestrator code threw an exception that was not caught.
   * {@link WorkflowState.workflowFailureDetails} contains error information.
   * This is a terminal state.
   */
  Failed = "Failed",

  /**
   * Workflow was explicitly terminated by a client.
   *
   * {@link DaprWorkflowClient.terminateWorkflow} was called to stop this workflow.
   * Optional output can be provided via the terminate operation.
   * This is a terminal state.
   */
  Terminated = "Terminated",

  /**
   * Workflow created a continuation as a new instance.
   *
   * {@link WorkflowContext.continueAsNew} was called to create a new instance
   * with fresh history. The original instance transitions to this state.
   * This is a terminal state.
   */
  Pending = "Pending",

  /**
   * Workflow is temporarily suspended and not executing.
   *
   * {@link DaprWorkflowClient.suspendWorkflow} was called to pause the workflow.
   * Can transition back to Running via {@link DaprWorkflowClient.resumeWorkflow}.
   * Non-terminal; execution can resume.
   */
  Suspended = "Suspended",
};

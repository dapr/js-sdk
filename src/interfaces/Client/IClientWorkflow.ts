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

import { WorkflowGetResponseType } from "../../types/workflow/WorkflowGetResponse.type";

/**
 * Dapr client interface for Workflow management.
 * Provides methods to start, monitor, and control Dapr Workflow instances.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/workflow/
 */
export default interface IClientWorkflow {
  /**
   * Retrieves detailed information about a workflow instance.
   * Returns the current state, metadata, and results of the workflow.
   *
   * @param instanceId - The unique identifier for the workflow instance.
   * @returns A promise that resolves to a WorkflowGetResponse containing instance status and data.
   *
   * @example
   * ```ts
   * const status = await client.workflow.getWorkflowState("workflow-instance-123");
   * console.log(status.runtime_status); // e.g., "RUNNING", "COMPLETED"
   * ```
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  getWorkflowState(instanceId: string): Promise<WorkflowGetResponseType>;

  /**
   * Starts a new workflow instance with the given name.
   * Optionally provides input data to the workflow and an explicit instance ID.
   *
   * @param workflowName - The name of the workflow definition to instantiate.
   * @param input - Optional input data for the workflow. Should be JSON serializable.
   * @param instanceId - Optional unique identifier for the instance.
   * If not provided, the Dapr runtime generates one automatically.
   * @returns A promise that resolves to the instance ID of the started workflow.
   *
   * @example
   * ```ts
   * const instanceId = await client.workflow.scheduleNewWorkflow(
   *   "approvalWorkflow",
   *   { orderId: "123", amount: 999.99 },
   *   "approval-order-123"
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  scheduleNewWorkflow(workflowName: string, input?: any, instanceId?: string): Promise<string>;

  /**
   * Terminates a running workflow instance.
   * The workflow cannot be resumed after termination.
   *
   * @param instanceId - The unique identifier for the workflow instance to terminate.
   * @returns A promise that resolves when the termination request is acknowledged.
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  terminate(instanceId: string): Promise<void>;

  /**
   * Pauses a running workflow instance.
   * The workflow can be resumed later from its current position.
   *
   * @param instanceId - The unique identifier for the workflow instance to pause.
   * @returns A promise that resolves when the pause request is acknowledged.
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  pause(instanceId: string): Promise<void>;

  /**
   * Resumes a paused workflow instance.
   * Execution continues from where it was paused.
   *
   * @param instanceId - The unique identifier for the workflow instance to resume.
   * @returns A promise that resolves when the resume request is acknowledged.
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  resume(instanceId: string): Promise<void>;

  /**
   * Purges a completed workflow instance and its history from the state store.
   * Useful for cleanup and freeing storage after long-running workflows.
   *
   * @param instanceId - The unique identifier for the workflow instance to purge.
   * @returns A promise that resolves when the purge request is acknowledged.
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  purge(instanceId: string): Promise<void>;

  /**
   * Raises an event to a running workflow instance.
   * The workflow can listen for this event and react accordingly.
   *
   * @param instanceId - The unique identifier for the workflow instance.
   * @param eventName - The name of the event to raise.
   * @param eventData - Optional data associated with the event. Should be JSON serializable.
   * @returns A promise that resolves when the event is delivered to the workflow.
   *
   * @example
   * ```ts
   * await client.workflow.raiseEvent(
   *   "workflow-instance-123",
   *   "approvalDecision",
   *   { approved: true, approver: "admin" }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  raiseEvent(instanceId: string, eventName: string, eventData?: any): Promise<void>;

  /**
   * @deprecated Use {@link getWorkflowState} instead. Will be removed with the release of Dapr 1.20.
   *
   * Retrieves detailed information about a workflow instance.
   * Returns the current state, metadata, and results of the workflow.
   *
   * @param instanceId - The unique identifier for the workflow instance.
   * @returns A promise that resolves to a WorkflowGetResponse containing instance status and data.
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  get(instanceId: string): Promise<WorkflowGetResponseType>;

  /**
   * @deprecated Use {@link scheduleNewWorkflow} instead. Will be removed with the release of Dapr 1.20.
   *
   * Starts a new workflow instance with the given name.
   * Optionally provides input data to the workflow and an explicit instance ID.
   *
   * @param workflowName - The name of the workflow definition to instantiate.
   * @param input - Optional input data for the workflow. Should be JSON serializable.
   * @param instanceId - Optional unique identifier for the instance.
   * If not provided, the Dapr runtime generates one automatically.
   * @returns A promise that resolves to the instance ID of the started workflow.
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  start(workflowName: string, input?: any, instanceId?: string): Promise<string>;

  /**
   * @deprecated Use {@link raiseEvent} instead. Will be removed with the release of Dapr 1.20.
   *
   * Raises an event to a running workflow instance.
   * The workflow can listen for this event and react accordingly.
   *
   * @param instanceId - The unique identifier for the workflow instance.
   * @param eventName - The name of the event to raise.
   * @param eventData - Optional data associated with the event. Should be JSON serializable.
   * @returns A promise that resolves when the event is delivered to the workflow.
   *
   * @see https://docs.dapr.io/reference/api/workflow_api/
   */
  raise(instanceId: string, eventName: string, eventData?: any): Promise<void>;
}

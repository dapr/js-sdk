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

import { OrchestrationStatus } from "@microsoft/durabletask-js/orchestration/enum/orchestration-status.enum";

/**
 * Enum describing the runtime status of a workflow.
 */
export enum WorkflowRuntimeStatus {
  RUNNING = OrchestrationStatus.RUNNING,
  COMPLETED = OrchestrationStatus.COMPLETED,
  FAILED = OrchestrationStatus.FAILED,
  TERMINATED = OrchestrationStatus.TERMINATED,
  CONTINUED_AS_NEW = OrchestrationStatus.CONTINUED_AS_NEW,
  PENDING = OrchestrationStatus.PENDING,
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
  const valIdx = values.findIndex((v) => v == (val as number));

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
  const valIdx = values.findIndex((v) => v == (val as number));

  // Return the entry of the WorkflowRuntimeStatus enum at index
  const entries = Object.entries(OrchestrationStatus);
  return entries[valIdx][1] as OrchestrationStatus;
}

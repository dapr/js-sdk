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

export interface WorkflowInstanceIdPage {
  instanceIds: string[];
  continuationToken?: string;
}

export interface RerunWorkflowFromEventOptions {
  /** Omit to let the runtime generate the new workflow instance ID. */
  newInstanceId?: string;
  /** JSON-serializable replacement input for the activity targeted by the event. */
  input?: unknown;
  /** Defaults to true when input is provided. Set false to preserve the original activity input. */
  overwriteInput?: boolean;
}

/** Result of a workflow operation that the sidecar may stage. */
export interface WorkflowOperationResult {
  /**
   * True when the sidecar accepted the operation but no workflow worker was connected to run it.
   * The sidecar saved the operation and runs it once a worker connects.
   * False when the operation ran at once, and on sidecars that do not stage operations.
   */
  staged: boolean;
}

/** Result of scheduling a new workflow instance. */
export interface ScheduleWorkflowResult extends WorkflowOperationResult {
  /** The ID of the scheduled workflow instance. */
  instanceId: string;
}

/** Result of rerunning a workflow from a history event. */
export interface RerunWorkflowFromEventResult extends WorkflowOperationResult {
  /** The ID of the new workflow instance. */
  newInstanceId: string;
}

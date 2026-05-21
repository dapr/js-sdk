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

import { KeyValueType } from "../KeyValue.type";
import { WorkflowRuntimeStatus } from "./WorkflowRuntimeStatus.type";

/**
 * Response data from workflow instance metadata queries.
 *
 * Contains summary information about a workflow instance including its identity,
 * lifecycle status, timestamps, and custom metadata. This type is returned by
 * query operations like {@link DaprWorkflowClient.getWorkflowState}.
 *
 * @example
 * ```typescript
 * const client = new DaprWorkflowClient();
 * const response = await client.getWorkflowState("order-123", true);
 * if (response && response.runtimeStatus === WorkflowRuntimeStatus.Completed) {
 *   console.log("Order processed at:", response.lastUpdatedAt);
 *   console.log("Properties:", response.properties);
 * }
 * ```
 *
 * @see {@link DaprWorkflowClient.getWorkflowState}
 * @see {@link WorkflowRuntimeStatus}
 */
export type WorkflowGetResponseType = {
  /**
   * Unique identifier for the workflow instance.
   *
   * This ID is generated or provided when the workflow was started and uniquely
   * identifies this execution within the workflow store.
   */
  instanceID: string;

  /**
   * Name of the workflow definition.
   *
   * The name specified during workflow registration with {@link WorkflowRuntime.registerWorkflow}.
   * Used to determine which orchestrator function to execute for this instance.
   */
  workflowName: string;

  /**
   * Creation timestamp of the workflow instance (UTC).
   *
   * Indicates when the workflow was first scheduled or started.
   * Useful for tracking workflow age and lifecycle analysis.
   */
  createdAt: Date;

  /**
   * Last modification timestamp of the workflow instance (UTC).
   *
   * Updated whenever the workflow transitions states or completes tasks.
   * Indicates the most recent activity on this workflow instance.
   */
  lastUpdatedAt: Date;

  /**
   * Current execution status of the workflow instance.
   *
   * Indicates whether the workflow is Running, Completed, Failed, Terminated,
   * Pending, Suspended, or continued as a new instance.
   *
   * @see {@link WorkflowRuntimeStatus}
   */
  runtimeStatus: WorkflowRuntimeStatus;

  /**
   * Custom key-value metadata associated with the workflow instance.
   *
   * Application-defined properties passed via start options or set during execution.
   * Useful for storing workflow context and custom state that persists in the store.
   */
  properties: KeyValueType;
};


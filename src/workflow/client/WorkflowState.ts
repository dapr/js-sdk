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

import { OrchestrationState } from "@microsoft/durabletask-js/orchestration/orchestration-state";
import { WorkflowFailureDetails } from "./WorkflowFailureDetails";
import { WorkflowRuntimeStatus, fromOrchestrationStatus } from "../runtime/WorkflowRuntimeStatus";

/**
 * Represents the state of a workflow instance.
 */
export class WorkflowState {
  private readonly _orchestrationState: OrchestrationState;
  private readonly _workflowFailureDetails?: WorkflowFailureDetails;

  /**
   * Creates an instance of WorkflowState.
   * @param {OrchestrationState} orchestrationState - The state of the orchestration.
   * @throws {Error} Throws an error if orchestrationState is null.
   */
  constructor(orchestrationState: OrchestrationState) {
    if (!orchestrationState) {
      throw new Error("OrchestrationMetadata cannot be null");
    }

    this._orchestrationState = orchestrationState;

    const failureDetails = orchestrationState.failureDetails;
    if (failureDetails) {
      this._workflowFailureDetails = new WorkflowFailureDetails(failureDetails);
    }
  }

  /**
   * Gets the name of the workflow.
   * @returns {string} The name of the workflow.
   */
  public get name(): string {
    return this._orchestrationState.name;
  }

  /**
   * Gets the unique ID of the workflow instance.
   * @returns {string} The unique ID of the workflow instance.
   */
  public get instanceId(): string {
    return this._orchestrationState.instanceId;
  }

  /**
   * Gets the current runtime status of the workflow instance.
   * @returns {WorkflowRuntimeStatus} The current runtime status.
   */
  public get runtimeStatus(): WorkflowRuntimeStatus {
    return fromOrchestrationStatus(this._orchestrationState.runtimeStatus);
  }

  /**
   * Gets the workflow instance's creation time in UTC.
   * @returns {Date} The workflow instance's creation time in UTC.
   */
  public get createdAt(): Date {
    return this._orchestrationState.createdAt;
  }

  /**
   * Gets the workflow instance's last updated time in UTC.
   * @returns {Date} The workflow instance's last updated time in UTC.
   */
  public get lastUpdatedAt(): Date {
    return this._orchestrationState.lastUpdatedAt;
  }

  /**
   * Gets the workflow instance's serialized input, if any, as a string value.
   * @returns {string | undefined} The workflow instance's serialized input or undefined.
   */
  public get serializedInput(): string | undefined {
    return this._orchestrationState.serializedInput;
  }

  /**
   * Gets the workflow instance's serialized output, if any, as a string value.
   * @returns {string | undefined} The workflow instance's serialized output or undefined.
   */
  public get serializedOutput(): string | undefined {
    return this._orchestrationState.serializedOutput;
  }

  /**
   * Gets the failure details, if any, for the failed workflow instance.
   * This method returns data only if the workflow is in the FAILED state and
   * only if this instance metadata was fetched with the option to include output data.
   * @returns {WorkflowFailureDetails | undefined} The failure details of the failed workflow instance or undefined.
   */
  public get workflowFailureDetails(): WorkflowFailureDetails | undefined {
    return this._workflowFailureDetails;
  }
}

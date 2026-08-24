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

import { OrchestrationState } from "../internal/durabletask/orchestration/orchestration-state";
import { WorkflowFailureDetails } from "./WorkflowFailureDetails";
import { WorkflowRuntimeStatus, fromOrchestrationStatus } from "../runtime/WorkflowRuntimeStatus";

/**
 * Represents the complete state and metadata of a workflow instance.
 *
 * Instances of this class are returned by workflow client query operations such as
 * `getWorkflowState()`, `waitForWorkflowStart()`, and `waitForWorkflowCompletion()`.
 * Contains both operational metadata (name, ID, timestamps) and optionally the workflow's
 * input, output, and custom status payloads.
 *
 * The optional payloads (input, output, customStatus) are only included when fetched with
 * `getInputsAndOutputs=true` or when returned by operations that include payloads by default.
 *
 * @example
 * ```typescript
 * const client = new DaprWorkflowClient();
 *
 * // Query with all payloads
 * const state = await client.getWorkflowState("order-123", true);
 * if (state) {
 *   console.log("Name:", state.name);
 *   console.log("Status:", state.runtimeStatus);
 *   console.log("Created:", state.createdAt);
 *   console.log("Input:", state.serializedInput);
 *   console.log("Output:", state.serializedOutput);
 * }
 * ```
 *
 * @see {@link DaprWorkflowClient}
 * @see {@link WorkflowRuntimeStatus}
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/}
 */
export class WorkflowState {
  private readonly _orchestrationState: OrchestrationState;
  private readonly _workflowFailureDetails?: WorkflowFailureDetails;

  /**
   * Creates an instance of WorkflowState.
   *
   * @param orchestrationState - The internal orchestration state from TaskHub. Must not be null or undefined.
   * @throws Error if orchestrationState is null or undefined
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
   * Gets the name of the workflow definition.
   *
   * This is the name used when registering the workflow with the runtime or when
   * scheduling it with the client. Multiple workflow instances can have the same name.
   *
   * @returns The workflow definition name
   */
  public get name(): string {
    return this._orchestrationState.name;
  }

  /**
   * Gets the unique identifier assigned to this workflow instance.
   *
   * Set when the workflow was scheduled via `scheduleNewWorkflow()`. If no instance ID was
   * provided, a GUID was generated automatically. This ID uniquely identifies this particular
   * execution of the workflow.
   *
   * @returns The unique instance identifier
   */
  public get instanceId(): string {
    return this._orchestrationState.instanceId;
  }

  /**
   * Gets the current runtime status of this workflow instance.
   *
   * Indicates where the workflow is in its lifecycle: PENDING (not started), RUNNING (executing),
   * COMPLETED (successful), FAILED (unhandled exception), TERMINATED (manually stopped),
   * SUSPENDED (paused), or CONTINUED_AS_NEW (restarted with new input).
   *
   * @returns The current WorkflowRuntimeStatus
   *
   * @see {@link WorkflowRuntimeStatus}
   */
  public get runtimeStatus(): WorkflowRuntimeStatus {
    return fromOrchestrationStatus(this._orchestrationState.runtimeStatus);
  }

  /**
   * Gets the UTC timestamp when this workflow instance was created.
   *
   * Records when the workflow was scheduled, before execution began. Useful for
   * age tracking and lifecycle analysis.
   *
   * @returns The creation timestamp in UTC
   */
  public get createdAt(): Date {
    return this._orchestrationState.createdAt;
  }

  /**
   * Gets the UTC timestamp of the last state update for this workflow instance.
   *
   * Updated whenever the workflow's state changes (e.g., activity completion, timer fire,
   * external event received, or status transition). Reflects when the most recent change
   * to workflow state was recorded in the persistence store.
   *
   * @returns The last updated timestamp in UTC
   */
  public get lastUpdatedAt(): Date {
    return this._orchestrationState.lastUpdatedAt;
  }

  /**
   * Gets the workflow instance's input as a JSON-serialized string.
   *
   * Contains the input value passed when the workflow was scheduled. Only populated when
   * the WorkflowState was fetched with payload inclusion enabled (e.g., `getInputsAndOutputs=true`
   * or from `waitForWorkflowCompletion()` with `fetchPayloads=true`).
   *
   * @returns The serialized input string, or undefined if payloads were not fetched
   *
   * @example
   * ```typescript
   * const input = state.serializedInput;
   * if (input) {
   *   const parsed = JSON.parse(input);
   *   console.log("Original input:", parsed);
   * }
   * ```
   */
  public get serializedInput(): string | undefined {
    return this._orchestrationState.serializedInput;
  }

  /**
   * Gets the workflow instance's output as a JSON-serialized string.
   *
   * Contains the value returned by the workflow's orchestrator function. Only populated for
   * completed or terminated workflows, and only when payloads were fetched (e.g., `getInputsAndOutputs=true`).
   * Undefined if the workflow is still running or if payloads were not requested.
   *
   * @returns The serialized output string, or undefined if not available or payloads were not fetched
   *
   * @example
   * ```typescript
   * if (state.runtimeStatus === "COMPLETED") {
   *   const output = state.serializedOutput;
   *   if (output) {
   *     const result = JSON.parse(output);
   *     console.log("Workflow result:", result);
   *   }
   * }
   * ```
   */
  public get serializedOutput(): string | undefined {
    return this._orchestrationState.serializedOutput;
  }

  /**
   * Gets the failure details if the workflow instance failed.
   *
   * Only populated when the workflow's runtime status is FAILED. Contains the exception type,
   * message, and stack trace that caused the failure. Undefined for successful workflows or
   * when payloads were not fetched.
   *
   * @returns WorkflowFailureDetails describing the failure, or undefined if not failed or payloads not fetched
   *
   * @example
   * ```typescript
   * if (state.runtimeStatus === "FAILED") {
   *   const failure = state.workflowFailureDetails;
   *   if (failure) {
   *     console.error(`Failed: ${failure.getErrorMessage()}`);
   *     console.error(`Type: ${failure.getErrorType()}`);
   *   }
   * }
   * ```
   *
   * @see {@link WorkflowFailureDetails}
   * @see {@link WorkflowRuntimeStatus.FAILED}
   */
  public get workflowFailureDetails(): WorkflowFailureDetails | undefined {
    return this._workflowFailureDetails;
  }

  /**
   * Gets the workflow instance's custom status as a JSON-serialized string.
   *
   * Optional user-defined status set by the orchestrator via `context.setCustomStatus()`.
   * Allows workflows to report progress or internal state without modifying the workflow output.
   * Only populated when payloads were fetched (e.g., `getInputsAndOutputs=true`).
   *
   * @returns The serialized custom status string, or undefined if not set or payloads not fetched
   *
   * @example
   * ```typescript
   * const customStatus = state.customStatus;
   * if (customStatus) {
   *   const statusObj = JSON.parse(customStatus);
   *   console.log("Workflow progress:", statusObj.progress);
   *   console.log("Current step:", statusObj.step);
   * }
   * ```
   */
  public get customStatus(): string | undefined {
    return this._orchestrationState.serializedCustomStatus;
  }
}

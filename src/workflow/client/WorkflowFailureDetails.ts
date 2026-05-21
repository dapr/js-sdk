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

import { FailureDetails } from "../internal/durabletask/task/failure-details";

/**
 * Captures detailed information about a workflow failure.
 *
 * Available when a workflow instance reaches the FAILED status. Provides the exception type,
 * message, and stack trace that caused the failure. Failures typically result from unhandled
 * exceptions in orchestrator or activity code. May also represent other types of system errors
 * such as gRPC communication failures or internal runtime errors.
 *
 * Failure details are persisted in the workflow's state and can be retrieved via
 * `client.getWorkflowState()` or `client.waitForWorkflowCompletion()`.
 *
 * @example
 * ```typescript
 * const client = new DaprWorkflowClient();
 * const state = await client.waitForWorkflowCompletion("workflow-123");
 *
 * if (state?.runtimeStatus === "FAILED") {
 *   const failure = state.workflowFailureDetails;
 *   console.error(`Workflow failed: ${failure?.getErrorMessage()}`);
 *   console.error(`Error type: ${failure?.getErrorType()}`);
 *   console.error(`Stack trace:\n${failure?.getStackTrace()}`);
 * }
 * ```
 *
 * @see {@link WorkflowState.workflowFailureDetails}
 * @see {@link WorkflowRuntimeStatus.FAILED}
 */
export class WorkflowFailureDetails {
  private readonly failureDetails: FailureDetails;

  constructor(failureDetails: FailureDetails) {
    this.failureDetails = failureDetails;
  }

  /**
   * Gets the fully-qualified exception type name that caused the failure.
   *
   * For TypeScript/JavaScript orchestrators and activities, this is typically the class name
   * of the thrown exception (e.g., "Error", "TypeError", or custom error class names).
   * For failures in external components or gRPC services, this may reflect the remote error type.
   *
   * @returns The namespace-qualified exception type name
   *
   * @example
   * ```typescript
   * const errorType = failure.getErrorType();
   * // e.g., "ValidationError", "TimeoutError", or generic "Error"
   * ```
   */
  public getErrorType(): string {
    return this.failureDetails.errorType;
  }

  /**
   * Gets the descriptive error message associated with the failure.
   *
   * Contains the exception message or human-readable description of what went wrong.
   * For activity or orchestrator exceptions, this is the message passed to the exception constructor.
   *
   * @returns The error message describing the failure
   *
   * @example
   * ```typescript
   * const message = failure.getErrorMessage();
   * // e.g., "Payment processing failed: insufficient funds"
   * ```
   */
  public getErrorMessage(): string {
    return this.failureDetails.message;
  }

  /**
   * Gets the stack trace captured at the time of failure.
   *
   * Provides the call stack from the point where the exception was thrown. Useful for
   * debugging to understand which function or line of code caused the failure. May be
   * undefined if the stack trace was not captured or is not available.
   *
   * @returns The stack trace string, or undefined if not available
   *
   * @example
   * ```typescript
   * const trace = failure.getStackTrace();
   * if (trace) {
   *   console.error("Stack trace:");
   *   console.error(trace);
   * }
   * ```
   */
  public getStackTrace(): string | undefined {
    return this.failureDetails.stackTrace;
  }
}

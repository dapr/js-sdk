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

import { FailureDetails } from "@microsoft/durabletask-js/task/failure-details";

/**
 * Class that represents the details of a task failure.
 *
 * In most cases, failures are caused by unhandled exceptions in activity or workflow code, in which case instances
 * of this class will expose the details of the exception. However, it's also possible that other types of errors could
 * result in task failures, in which case there may not be any exception-specific information.
 */
export class WorkflowFailureDetails {
  private readonly failureDetails: FailureDetails;

  constructor(failureDetails: FailureDetails) {
    this.failureDetails = failureDetails;
  }

  /**
   * Gets the error type, which is the namespace-qualified exception type name.
   * @return {string} The error type.
   */
  public getErrorType(): string {
    return this.failureDetails.errorType;
  }

  /**
   * Gets the error message.
   * @return {string} The error message.
   */
  public getErrorMessage(): string {
    return this.failureDetails.message;
  }

  /**
   * Gets the stack trace.
   * @return {string | undefined} The stack trace, or undefined if not available.
   */
  public getStackTrace(): string | undefined {
    return this.failureDetails.stackTrace;
  }
}

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

import type { TaskFailureDetails } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";

export class TaskFailedError extends Error {
  readonly errorType: string;
  readonly errorMessage: string;
  readonly stackTrace: string | undefined;

  constructor(message: string, errorType: string, stackTrace?: string) {
    super(message);
    this.name = "TaskFailedError";
    this.errorType = errorType;
    this.errorMessage = message;
    this.stackTrace = stackTrace;
  }

  static fromFailureDetails(message: string, details: TaskFailureDetails): TaskFailedError {
    return new TaskFailedError(
      message,
      details.errorType,
      details.stackTrace,
    );
  }

  /**
   * Backward-compatible getter that returns failure details in the shape
   * of the legacy FailureDetails class.
   * @deprecated Use `errorType`, `errorMessage`, and `stackTrace` properties directly.
   */
  get details(): {
    message: string;
    errorType: string;
    stackTrace: string | undefined;
  } {
    return {
      message: this.errorMessage,
      errorType: this.errorType,
      stackTrace: this.stackTrace,
    };
  }
}

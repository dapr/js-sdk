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

import type { TaskFailureDetails } from "../../proto/dapr/proto/durabletask/v1/orchestration_pb";

export class WorkflowFailureDetails {
  constructor(private readonly _details: TaskFailureDetails) {}

  getErrorType(): string {
    return this._details.errorType;
  }

  getErrorMessage(): string {
    return this._details.errorMessage;
  }

  getStackTrace(): string | undefined {
    return this._details.stackTrace;
  }

  get innerFailure(): TaskFailureDetails | undefined {
    return this._details.innerFailure;
  }

  get isNonRetriable(): boolean {
    return this._details.isNonRetriable;
  }
}

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

import { Task } from "./Task";
import type { TaskFailureDetails } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { TaskFailedError } from "./TaskFailedError";

export class CompletableTask<T> extends Task<T> {
  complete(result: T): void {
    if (this._isComplete) {
      throw new Error("Task is already completed");
    }

    this._result = result;
    this._isComplete = true;

    if (this._parent) {
      this._parent.onChildCompleted(this as unknown as Task<unknown>);
    }
  }

  fail(message: string, details?: TaskFailureDetails): void {
    if (this._isComplete) {
      throw new Error("Task is already completed");
    }

    if (details) {
      this._exception = TaskFailedError.fromFailureDetails(message, details);
    } else {
      this._exception = new TaskFailedError(message, "Error", undefined);
    }
    this._isComplete = true;

    if (this._parent) {
      this._parent.onChildCompleted(this as unknown as Task<unknown>);
    }
  }
}

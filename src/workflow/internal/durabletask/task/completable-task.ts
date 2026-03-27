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

import * as pb from "../proto/orchestrator_service_pb";
import { TaskFailedError } from "./exception/task-failed-error";
import { Task } from "./task";

export class CompletableTask<T> extends Task<T> {
  constructor() {
    super();
  }

  complete(result: T): void {
    if (this._isComplete) {
      throw new Error("Task is already completed");
    }

    this._result = result;
    this._isComplete = true;

    if (this._parent) {
      this._parent.onChildCompleted(this);
    }
  }

  fail(message: string, details?: pb.TaskFailureDetails): void {
    if (this._isComplete) {
      throw new Error("Task is already completed");
    }

    details = details ?? new pb.TaskFailureDetails();

    this._exception = new TaskFailedError(message, details);
    this._isComplete = true;

    if (this._parent) {
      this._parent.onChildCompleted(this);
    }
  }
}

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

import { CompletableTask } from "./CompletableTask";
import type { CancellableTask } from "../../../types/workflow/CancellableTask.type";
import { TaskFailedError } from "./TaskFailedError";
import type { TaskFailureDetails } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";

export class TaskCanceledError extends TaskFailedError {
  constructor() {
    super("Task was canceled", "TaskCanceledError");
    this.name = "TaskCanceledError";
  }
}

export class TaskTimeoutError extends TaskFailedError {
  constructor() {
    super("External event wait timed out", "TaskTimeoutError");
    this.name = "TaskTimeoutError";
  }
}

export class CancellableCompletableTask<T> extends CompletableTask<T> implements CancellableTask<T> {
  constructor(private readonly _onSettled?: () => void) {
    super();
  }

  get isCanceled(): boolean {
    return this._exception instanceof TaskCanceledError;
  }

  /** Stops waiting locally; does not cancel work in the Dapr runtime. */
  cancel(): void {
    if (!this.isComplete) {
      this.reject(new TaskCanceledError());
    }
  }

  override complete(result: T): void {
    super.complete(result);
    this._onSettled?.();
  }

  override fail(message: string, details?: TaskFailureDetails): void {
    super.fail(message, details);
    this._onSettled?.();
  }

  reject(error: TaskFailedError): void {
    if (this.isComplete) {
      throw new Error("Task is already completed");
    }
    this._exception = error;
    this._isComplete = true;
    this._onSettled?.();
    this._parent?.onChildCompleted(this);
  }
}

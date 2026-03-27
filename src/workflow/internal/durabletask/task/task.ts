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

import { TaskFailedError } from "./exception/task-failed-error";
import { CompositeTask } from "./composite-task";

/**
 * Abstract base class for asynchronous tasks in a durable orchestration.
 */
export class Task<T> {
  _result: T | undefined;
  _exception: TaskFailedError | undefined;
  _parent: CompositeTask<T> | undefined;
  _isComplete: boolean = false;

  constructor() {
    this._isComplete = false;
    this._exception = undefined;
    this._parent = undefined;
  }

  /**
   * Returns true if the task has completed, false otherwise
   */
  get isComplete(): boolean {
    return this._isComplete;
  }

  /**
   * Returns true if the task has failed, false otherwise
   */
  get isFailed(): boolean {
    return this._exception != undefined;
  }

  /**
   * Get the result of the task
   */
  getResult(): T {
    if (!this._isComplete) {
      throw new Error("Task is not complete");
    }

    if (this._exception) {
      throw this._exception;
    }

    return this._result as T;
  }

  /**
   * Get the exception that caused the task to fail
   */
  getException(): TaskFailedError {
    if (!this._exception) {
      throw new Error("Task did not fail");
    }

    return this._exception;
  }
}

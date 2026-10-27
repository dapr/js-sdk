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

import { CompositeTask } from "./CompositeTask";
import type { Task } from "./Task";
import { notifyTaskParents } from "./taskCompletion";

export class WhenAllTask<T> extends CompositeTask<T[]> {
  constructor(tasks: Task<T>[]) {
    super(tasks as Task<unknown>[]);
    if (tasks.length === 0) {
      this._result = [];
      this._isComplete = true;
    }
  }

  onChildCompleted(task: Task<unknown>): void {
    if (this._isComplete) {
      return;
    }

    this._completedTasks++;

    if (task.isFailed && !this._exception) {
      this._exception = task.getException();
      this._isComplete = true;
      notifyTaskParents(this);
      return;
    }

    if (this._completedTasks === this._tasks.length) {
      this._result = this._tasks.map((t) => t.getResult()) as unknown as T[];
      this._isComplete = true;
      notifyTaskParents(this);
    }
  }

  get completedTasks(): number {
    return this._completedTasks;
  }

  pendingTasks(): number {
    return this._tasks.length - this._completedTasks;
  }
}

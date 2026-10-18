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

export abstract class CompositeTask<T> extends Task<T> {
  _tasks: Task<unknown>[];
  _completedTasks: number;
  _failedTasks: number;

  constructor(tasks: Task<unknown>[]) {
    super();
    this._tasks = tasks;
    this._completedTasks = 0;
    this._failedTasks = 0;

    for (const task of tasks) {
      (task as Task<unknown>)._parent = this as unknown as CompositeTask<unknown>;

      if (task.isComplete) {
        this.onChildCompleted(task);
      }
    }
  }

  abstract onChildCompleted(task: Task<unknown>): void;
}

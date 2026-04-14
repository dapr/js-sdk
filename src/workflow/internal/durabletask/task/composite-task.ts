// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

import { Task } from "./task";

/**
 * A task that is composed of other tasks
 */
export class CompositeTask<T> extends Task<T> {
  _tasks: Task<any>[] = [];
  _completedTasks: number;
  _failedTasks: number;

  constructor(tasks: Task<any>[]) {
    super();

    this._tasks = tasks;
    this._completedTasks = 0;
    this._failedTasks = 0;

    for (const task of tasks) {
      task._parent = this;

      if (task._isComplete) {
        this.onChildCompleted(task);
      }
    }
  }

  // @todo: should be abstract method
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChildCompleted(_: Task<any>): void {}
}

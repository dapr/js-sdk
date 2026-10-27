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

import type { Task } from "./Task";
import type { CompositeTask } from "./CompositeTask";

const parents = new WeakMap<Task<unknown>, CompositeTask<unknown>[]>();

export function registerTaskParent(task: Task<unknown>, parent: CompositeTask<unknown>): void {
  const subscribers = parents.get(task) ?? [];
  subscribers.push(parent);
  parents.set(task, subscribers);
}

export function notifyTaskParents(task: Task<unknown>): void {
  const subscribers = parents.get(task) ?? [];
  parents.delete(task);
  // Retain support for the existing parent field without notifying it twice.
  if (task._parent && !subscribers.includes(task._parent)) {
    subscribers.push(task._parent);
  }
  for (const parent of subscribers) {
    parent.onChildCompleted(task);
  }
}

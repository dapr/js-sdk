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

import { WhenAllTask } from "./when-all-task";
import { Task } from "./task";
import { WhenAnyTask } from "./when-any-task";

/**
 * Returns a task that completes when all of the provided tasks complete or when one of the tasks fail
 *
 * @param tasks the tasks to wait for
 * @returns {WhenAllTask} a task that completes when all of the provided tasks complete or when one of the tasks fail
 */
export function whenAll<T>(tasks: Task<T>[]): WhenAllTask<T> {
  return new WhenAllTask(tasks);
}

/**
 * Returns a task that completes when any of the provided tasks complete or fail
 *
 * @param tasks
 * @returns
 */
export function whenAny(tasks: Task<any>[]): WhenAnyTask {
  return new WhenAnyTask(tasks);
}

/**
 * Returns the name of the provided function
 *
 * @param fn
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function getName(fn: Function): string {
  if (!fn) {
    throw new Error("Cannot infer a name from a null or undefined function. Please provide a name explicitly.");
  }

  const name = fn.name;

  if (!name) {
    throw new Error("Cannot infer a name from a lambda function. Please provide a name explicitly.");
  }

  return name;
}

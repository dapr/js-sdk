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

import { CompletableTask, TaskFailedError, whenAll, whenAny } from "../../../src/workflow/engine/task";
import {
  CancellableCompletableTask,
  TaskCanceledError,
} from "../../../src/workflow/engine/task/CancellableCompletableTask";

describe("task composition", () => {
  it("completes an empty join immediately without changing empty race semantics", () => {
    const all = whenAll([]);
    expect(all.isComplete).toBe(true);
    expect(all.getResult()).toEqual([]);
    expect(all.completedTasks).toBe(0);
    expect(all.pendingTasks()).toBe(0);
    expect(whenAny([]).isComplete).toBe(false);
  });

  it.each([false, true])("propagates nested joins and races (already complete: %s)", (alreadyComplete) => {
    const first = new CompletableTask<number>();
    const second = new CompletableTask<number>();
    const timer = new CompletableTask<number[]>();
    if (alreadyComplete) {
      first.complete(1);
      second.complete(2);
    }
    const all = whenAll([first, second]);
    const race = whenAny([all, timer]);
    const outer = whenAll([race]);
    if (!alreadyComplete) {
      second.complete(2);
      expect(outer.isComplete).toBe(false);
      first.complete(1);
    }
    expect(outer.getResult()).toEqual([all]);
    expect(all.getResult()).toEqual([1, 2]);
    timer.complete([]);
    expect(race.getResult()).toBe(all);
  });

  it.each(["failure", "cancellation"])("propagates nested %s without failing a race", (mode) => {
    const child = new CancellableCompletableTask<number>();
    const inner = whenAll([child]);
    const outer = whenAll([inner]);
    const race = whenAny([outer]);
    if (mode === "failure") child.fail("failed");
    else child.cancel();
    expect(outer.isComplete).toBe(true);
    expect(() => outer.getResult()).toThrow(mode === "failure" ? TaskFailedError : TaskCanceledError);
    expect(race.isFailed).toBe(false);
    expect(race.getResult()).toBe(outer);
  });

  it.each(["all-first", "any-first"])("notifies every overlapping composition (%s)", (order) => {
    const first = new CompletableTask<number>();
    const second = new CompletableTask<number>();
    const all = order === "all-first" ? whenAll([first, second]) : undefined;
    const race = whenAny([first, second]);
    const joined = all ?? whenAll([first, second]);
    second.complete(2);
    expect(race.getResult()).toBe(second);
    expect(joined.isComplete).toBe(false);
    first.complete(1);
    expect(joined.getResult()).toEqual([1, 2]);
    expect(joined.completedTasks).toBe(2);
  });

  it("notifies overlapping parents on cancellation and ignores late cancellation", () => {
    const child = new CancellableCompletableTask<number>();
    const first = whenAll([child]);
    const second = whenAll([child]);
    const race = whenAny([child]);
    child.cancel();
    child.cancel();
    expect(() => first.getResult()).toThrow(TaskCanceledError);
    expect(() => second.getResult()).toThrow(TaskCanceledError);
    expect(race.getResult()).toBe(child);
  });

  it.each([false, true])("counts repeated task entries exactly once per entry (already complete: %s)", (done) => {
    const child = new CompletableTask<number>();
    if (done) child.complete(1);
    const all = whenAll([child, child]);
    const race = whenAny([child]);
    if (!done) child.complete(1);
    expect(all.getResult()).toEqual([1, 1]);
    expect(all.completedTasks).toBe(2);
    expect(all.pendingTasks()).toBe(0);
    expect(race.getResult()).toBe(child);
  });

  it("preserves the legacy parent notification path", () => {
    const child = new CompletableTask<unknown>();
    const parent = whenAny<number>([]);
    child._parent = parent;
    child.complete(1);
    expect(parent.getResult()).toBe(child);
  });
});

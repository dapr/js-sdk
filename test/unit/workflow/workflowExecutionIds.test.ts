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

import { Logger } from "../../../src/logger/Logger";
import { OrchestrationRuntimeContext } from "../../../src/workflow/engine";
import { OrchestrationExecutor, Registry, Task, whenAll, whenAny } from "../../../src/workflow/engine";
import type { HistoryEvent } from "../../../src";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newFailureDetails,
  newTaskCompletedEvent,
  newTaskFailedEvent,
  newTaskScheduledEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";

describe("workflow task execution IDs", () => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const failure = newFailureDetails(new Error("activity failure"));

  function resolution(taskId: number, key: string, failed: boolean): HistoryEvent {
    return failed ? newTaskFailedEvent(taskId, failure, key) : newTaskCompletedEvent(taskId, '"done"', key);
  }

  function singleActivity() {
    const registry = new Registry();
    const observed: { before: string | undefined; after?: string; failed?: boolean }[] = [];
    registry.addNamedOrchestrator("workflow", function* (inner) {
      const task = new WorkflowContext(inner).callActivity("activity");
      const observation: {
        before: string | undefined;
        after?: string;
        failed?: boolean;
      } = { before: task.executionId };
      observed.push(observation);
      try {
        yield task;
      } catch {
        observation.failed = true;
      }
      observation.after = task.executionId;
      return { key: task.executionId, failed: task.isFailed };
    });
    return { executor: new OrchestrationExecutor(registry), observed };
  }

  it("exposes read-only UUIDs immediately and includes them in activity scheduling messages", () => {
    const inner = new OrchestrationRuntimeContext("instance");
    const ctx = new WorkflowContext(inner);
    const tasks = [ctx.callActivity("activity"), ctx.callActivity("activity")];
    for (const task of tasks) {
      expect(task.executionId).toMatch(uuidPattern);
    }
    expect(new Set(tasks.map((task) => task.executionId)).size).toBe(2);
    expect(inner.getActions().map((action) => action.workflowActionType.value)).toEqual(
      tasks.map((task) => expect.objectContaining({ name: "activity", taskExecutionId: task.executionId })),
    );
    expect(Object.getOwnPropertyDescriptor(Task.prototype, "executionId")?.set).toBeUndefined();
  });

  it("does not reuse keys when a workflow instance starts a new generation or is recreated", async () => {
    const { executor } = singleActivity();
    const start = newExecutionStartedEvent("workflow", "instance");
    const first = await executor.execute("instance", [], [start]);
    const second = await executor.execute("instance", [], [start]);
    const getKey = (result: typeof first) => {
      const action = result.actions[0].workflowActionType;
      if (action.case !== "scheduleTask") throw new Error("Expected an activity");
      return action.value.taskExecutionId;
    };
    expect(getKey(first)).toMatch(uuidPattern);
    expect(getKey(second)).toMatch(uuidPattern);
    expect(getKey(second)).not.toBe(getKey(first));
  });

  it("does not consume workflow sequence numbers or deterministic GUID counters", () => {
    const context = new OrchestrationRuntimeContext("instance");
    const reference = new OrchestrationRuntimeContext("instance");
    expect(context.newGuid()).toBe(reference.newGuid());
    context.callActivity("activity");
    expect(context.newGuid()).toBe(reference.newGuid());
    context.createTimer(1);
    expect(context.getActions().map((action) => action.id)).toEqual([1, 2]);
  });

  it("does not synthesize unsupported execution keys or change other task types", () => {
    const ctx = new WorkflowContext(new OrchestrationRuntimeContext("instance"));
    const timer = ctx.createTimer(1);
    const event = ctx.waitForExternalEvent("event");
    const child = ctx.callSubWorkflow("child");
    const alias = ctx.callChildWorkflow("child");
    const retryingChild = ctx.callChildWorkflow("child", undefined, undefined, {
      retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
    });
    for (const task of [timer, event, child, alias, retryingChild, whenAll([]), whenAny([new Task()])]) {
      expect(task.executionId).toBeUndefined();
    }
    timer.cancel();
    event.cancel();
    expect(timer.isCanceled).toBe(true);
    expect(event.isCanceled).toBe(true);
  });

  it.each(["old", "new"])("restores opaque historical keys before yielding from %s events", async (batch) => {
    const { executor, observed } = singleActivity();
    const start = newExecutionStartedEvent("workflow", "instance");
    const scheduled = newTaskScheduledEvent(1, "activity", undefined, "opaque/runtime:key");
    const result = await executor.execute(
      "instance",
      batch === "old" ? [start, scheduled] : [],
      batch === "old" ? [newTaskCompletedEvent(1, '"done"', "opaque/runtime:key")] : [start, scheduled],
    );
    expect(observed[0].before).toBe("opaque/runtime:key");
    if (batch === "old") {
      expect(observed[0].after).toBe("opaque/runtime:key");
      expect(result.actions[0].workflowActionType.value).toMatchObject({
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: JSON.stringify({ key: "opaque/runtime:key", failed: false }),
      });
    } else {
      expect(result.actions).toEqual([]);
    }
  });

  it("replays a generated ID unchanged, including reads before the first yield", async () => {
    const { executor, observed } = singleActivity();
    const start = newExecutionStartedEvent("workflow", "instance");
    const first = await executor.execute("instance", [], [start]);
    const scheduledAction = first.actions[0].workflowActionType;
    if (scheduledAction.case !== "scheduleTask") throw new Error("Expected an activity");
    const key = scheduledAction.value.taskExecutionId;
    const history = [start, newTaskScheduledEvent(1, "activity", undefined, key)];
    const completion = newTaskCompletedEvent(1, '"done"', key);
    await executor.execute("instance", history, [completion]);
    await executor.execute("instance", [...history, completion], [newEventRaisedEvent("late")]);
    expect(observed.map((value) => value.before)).toEqual([key, key, key]);
    expect(observed.slice(1).map((value) => value.after)).toEqual([key, key]);
  });

  describe.each([false, true])("completion correlation (failed: %s)", (failed) => {
    it.each([
      ["key", "key"],
      ["", ""],
      ["key", ""],
      ["", "runtime-key"],
    ])("accepts scheduling key %j and completion key %j", async (scheduledKey, completionKey) => {
      const { executor, observed } = singleActivity();
      const result = await executor.execute(
        "instance",
        [
          newExecutionStartedEvent("workflow", "instance"),
          newTaskScheduledEvent(1, "activity", undefined, scheduledKey),
        ],
        [resolution(1, completionKey, failed)],
      );
      expect(observed[0]).toMatchObject({ before: scheduledKey || undefined, after: scheduledKey || undefined });
      expect(result.actions[0].workflowActionType.value).toMatchObject({
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: JSON.stringify({ key: scheduledKey || undefined, failed }),
      });
    });

    it.each([false, true])(
      "logs and ignores stale keys without consuming the pending task (replay: %s)",
      async (replay) => {
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
        try {
          const { executor, observed } = singleActivity();
          const history = [
            newExecutionStartedEvent("workflow", "instance"),
            newTaskScheduledEvent(1, "activity", undefined, "current-key"),
          ];
          const stale = resolution(1, "previous-generation-key", failed);
          const result = await executor.execute(
            "instance",
            replay ? [...history, stale] : history,
            replay ? [newEventRaisedEvent("unrelated")] : [stale],
          );
          expect(result.actions).toEqual([]);
          expect(observed[0].after).toBeUndefined();
          expect(observed[0].failed).toBeUndefined();
          expect(warn).toHaveBeenCalledWith(expect.stringContaining("task execution ID does not match"));

          const completed = await executor.execute(
            "instance",
            [...history, stale],
            [newTaskCompletedEvent(1, '"done"', "current-key")],
          );
          expect(completed.actions[0].workflowActionType.value).toMatchObject({
            workflowStatus: OrchestrationStatus.COMPLETED,
            result: JSON.stringify({ key: "current-key", failed: false }),
          });
        } finally {
          warn.mockRestore();
        }
      },
    );
  });

  it("requires both task ID and execution key for parallel activities", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("parallel", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      return yield whenAll([ctx.callActivity("activity"), ctx.callActivity("activity")]);
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "instance",
      [
        newExecutionStartedEvent("parallel", "instance"),
        newTaskScheduledEvent(1, "activity", undefined, "first"),
        newTaskScheduledEvent(2, "activity", undefined, "second"),
      ],
      [
        newTaskCompletedEvent(1, '"wrong"', "second"),
        newTaskCompletedEvent(99, '"wrong"', "first"),
        newTaskCompletedEvent(2, '"b"', "second"),
        newTaskCompletedEvent(1, '"a"', "first"),
        newTaskCompletedEvent(1, '"duplicate"', "first"),
      ],
    );
    expect(result.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.COMPLETED,
      result: '["a","b"]',
    });
  });

  it("shares one key across retry attempts without changing backoff or numeric task IDs", () => {
    const inner = new OrchestrationRuntimeContext("instance");
    const task = inner.callActivity("activity", undefined, {
      retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
    });
    const key = task.executionId;
    expect(key).toMatch(uuidPattern);
    expect(inner._pendingTasks[1].executionId).toBe(key);
    inner._pendingTasks[1].fail("transient", failure);
    expect(task.isComplete).toBe(false);
    expect(inner._pendingTasks[2].executionId).toBeUndefined();
    inner._pendingTasks[2].complete(undefined);
    expect(inner._pendingTasks[3].executionId).toBe(key);
    expect(task.executionId).toBe(key);
    expect(inner._pendingActions[3].workflowActionType.value).toMatchObject({ taskExecutionId: key });
    inner._pendingTasks[3].complete("success");
    expect(task.getResult()).toBe("success");
    expect(task.executionId).toBe(key);
  });

  it.each(["retry-key", ""])(
    "restores retry keys %j and ignores late completions from earlier attempts",
    async (key) => {
      const registry = new Registry();
      const keys: (string | undefined)[] = [];
      registry.addNamedOrchestrator("retry", function* (ctx) {
        const task = ctx.callActivity("activity", undefined, {
          retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
        });
        keys.push(task.executionId);
        yield task;
        return { key: task.executionId, result: task.getResult() };
      });
      const fireAt = new Date("2026-01-01T00:00:01Z");
      const result = await new OrchestrationExecutor(registry).execute(
        "instance",
        [
          newExecutionStartedEvent("retry", "instance"),
          newTaskScheduledEvent(1, "activity", undefined, key),
          newTaskFailedEvent(1, failure, key),
          newTimerCreatedEvent(2, fireAt),
          newTimerFiredEvent(2, fireAt),
          newTaskScheduledEvent(3, "activity", undefined, key),
        ],
        [newTaskCompletedEvent(1, '"stale"', key), newTaskCompletedEvent(3, '"success"', key)],
      );
      expect(keys).toEqual([key || undefined]);
      expect(result.actions[0].workflowActionType.value).toMatchObject({
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: JSON.stringify({ key: key || undefined, result: "success" }),
      });
    },
  );

  it("assigns a new persisted key when a legacy activity begins a new retry attempt", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("retry", function* (ctx) {
      yield ctx.callActivity("activity", undefined, {
        retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
      });
    });
    const fireAt = new Date("2026-01-01T00:00:01Z");
    const result = await new OrchestrationExecutor(registry).execute(
      "instance",
      [
        newExecutionStartedEvent("retry", "instance"),
        newTaskScheduledEvent(1, "activity"),
        newTaskFailedEvent(1, failure),
        newTimerCreatedEvent(2, fireAt),
      ],
      [newTimerFiredEvent(2, fireAt)],
    );
    expect(result.actions).toHaveLength(1);
    const action = result.actions[0];
    expect(action.id).toBe(3);
    if (action.workflowActionType.case !== "scheduleTask") throw new Error("Expected a retry");
    expect(action.workflowActionType.value.taskExecutionId).toMatch(uuidPattern);
  });
});

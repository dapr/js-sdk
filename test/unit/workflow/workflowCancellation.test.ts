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

import {
  OrchestrationRuntimeContext,
  OrchestrationExecutor,
  Registry,
  whenAll,
  whenAny,
} from "../../../src/workflow/engine";
import { Task, TaskCanceledError, TaskTimeoutError } from "../../../src";
import type { CancellableTask, WorkflowContext } from "../../../src";
import * as sdk from "../../../src";
import { CancellableCompletableTask } from "../../../src/workflow/engine/task/CancellableCompletableTask";
import {
  newExecutionStartedEvent,
  newEventRaisedEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
  timestampToDate,
} from "../../../src/workflow/engine/worker/protoHelpers";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";

describe("workflow task cancellation", () => {
  it("exposes only a cancellable task type, not its constructor or settlement methods", () => {
    type SettlementMethods = "complete" | "fail" | "reject";
    type PublicKeys =
      | keyof CancellableTask<void>
      | keyof ReturnType<WorkflowContext["createTimer"]>
      | keyof ReturnType<WorkflowContext["waitForExternalEvent"]>;
    const settlementMethodsAreHidden: Extract<PublicKeys, SettlementMethods> extends never ? true : false = true;
    expect(settlementMethodsAreHidden).toBe(true);
    expect(sdk).not.toHaveProperty("CancellableTask");
    expect(sdk).not.toHaveProperty("CancellableCompletableTask");
    const task: CancellableTask<void> = new CancellableCompletableTask<void>();
    const ordinaryTask: Task<void> = task;
    task.cancel();
    expect(task.isCanceled).toBe(true);
    expect(() => ordinaryTask.getResult()).toThrow(TaskCanceledError);
  });

  it("cancels timers idempotently without claiming to cancel the runtime timer", () => {
    const context = new OrchestrationRuntimeContext("id");
    const timer = context.createTimer(30);
    timer.cancel();
    timer.cancel();
    expect(timer.isComplete).toBe(true);
    expect(timer.isCanceled).toBe(true);
    expect(() => timer.getResult()).toThrow(TaskCanceledError);
    expect(context.getActions()[0].workflowActionType.case).toBe("createTimer");
  });

  it("does not cancel completed tasks or notify a parent twice", () => {
    const timer = new CancellableCompletableTask<void>();
    const race = whenAny([timer]);
    timer.complete(undefined);
    timer.cancel();
    expect(timer.isCanceled).toBe(false);
    expect(race.getResult()).toBe(timer);
  });

  it("removes only the canceled event waiter and preserves same-name FIFO order", () => {
    const context = new OrchestrationRuntimeContext("id");
    const first = context.waitForExternalEvent("Event");
    const canceled = context.waitForExternalEvent("EVENT");
    const last = context.waitForExternalEvent("event");
    canceled.cancel();
    expect(context._pendingEvents.event).toEqual([first, last]);
    first.cancel();
    last.cancel();
    expect(context._pendingEvents).toEqual({});
  });

  it("handles cancellation and late completions in task compositions", () => {
    const first = new CancellableCompletableTask<void>();
    const second = new CancellableCompletableTask<void>();
    const all = whenAll([first, second]);
    first.cancel();
    expect(() => second.cancel()).not.toThrow();
    expect(() => all.getResult()).toThrow(TaskCanceledError);
    expect(() => whenAll([first, second]).getResult()).toThrow(TaskCanceledError);
    expect(whenAny([first, second]).getResult()).toBe(first);
  });

  it("uses workflow time for external-event timeouts and cleans up the waiter", () => {
    const context = new OrchestrationRuntimeContext("id");
    context.currentUtcDateTime = new Date("2026-01-01T00:00:00Z");
    const event = context.waitForExternalEvent("event", { timeoutInSeconds: 2 });
    const action = context.getActions()[0];
    if (action.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a durable timer");
    }
    expect(timestampToDate(action.workflowActionType.value.fireAt)).toEqual(new Date("2026-01-01T00:00:02Z"));
    context._pendingTasks[action.id].complete(undefined);
    expect(() => event.getResult()).toThrow(TaskTimeoutError);
    expect(context._pendingEvents).toEqual({});
  });

  it("cancels the timeout task when an event arrives or its wait is canceled", () => {
    for (const cancel of [false, true]) {
      const context = new OrchestrationRuntimeContext("id");
      const event = context.waitForExternalEvent("event", { timeoutInSeconds: 2 });
      const timeout = context._pendingTasks[1];
      if (cancel) {
        event.cancel();
      } else {
        context._pendingEvents.event.shift()?.complete("payload");
      }
      expect(timeout.isComplete).toBe(true);
      expect(timeout.getException()).toBeInstanceOf(TaskCanceledError);
      expect(context._pendingEvents).toEqual({});
    }
  });

  it("consumes a buffered event without scheduling a timeout", () => {
    const context = new OrchestrationRuntimeContext("id");
    context._receivedEvents.event = ["payload"];
    const event = context.waitForExternalEvent("EVENT", { timeoutInSeconds: 0 });
    expect(event.getResult()).toBe("payload");
    event.cancel();
    expect(event.isCanceled).toBe(false);
    expect(context.getActions()).toEqual([]);
  });

  it.each([-1, NaN, Infinity, Number.MAX_VALUE])(
    "rejects invalid timeout %s without registering work",
    (timeoutInSeconds) => {
      const context = new OrchestrationRuntimeContext("id");
      expect(() => context.waitForExternalEvent("event", { timeoutInSeconds })).toThrow(RangeError);
      expect(context.getActions()).toEqual([]);
      expect(context._pendingEvents).toEqual({});
    },
  );

  it.each([NaN, Infinity, new Date(NaN)])("rejects invalid timer deadline %s", (deadline) => {
    const context = new OrchestrationRuntimeContext("id");
    expect(() => context.createTimer(deadline)).toThrow(RangeError);
    expect(context.getActions()).toEqual([]);
  });

  it("replays cancellation and ignores late timer firings while preserving subsequent events", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (context): Generator<Task<unknown>, unknown, unknown> {
      const timer = context.createTimer(30);
      const abandoned = context.waitForExternalEvent("event", { timeoutInSeconds: 10 });
      yield context.waitForExternalEvent("cancel");
      timer.cancel();
      abandoned.cancel();
      return yield context.waitForExternalEvent("event");
    });
    const executor = new OrchestrationExecutor(registry);
    const start = newExecutionStartedEvent("workflow", "id");
    const created = [newTimerCreatedEvent(1, new Date()), newTimerCreatedEvent(2, new Date())];
    const cancel = newEventRaisedEvent("cancel");
    const oldEvents = [start, ...created, cancel];
    const late = [newTimerFiredEvent(1, new Date()), newTimerFiredEvent(2, new Date())];
    const event = newEventRaisedEvent("event", JSON.stringify("result"));
    const first = await executor.execute("id", oldEvents, [...late, event]);
    const replay = await executor.execute("id", [...oldEvents, ...late], [event]);
    expect(first.actions).toEqual(replay.actions);
    expect(first.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.COMPLETED, result: JSON.stringify("result") },
    });
  });

  it("throws immediately canceled tasks into the generator, including consecutive failures", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (context): Generator<Task<unknown>, unknown, unknown> {
      for (let i = 0; i < 2; i++) {
        const task = context.waitForExternalEvent("event");
        task.cancel();
        let canceled = false;
        try {
          yield task;
        } catch (error) {
          if (!(error instanceof TaskCanceledError)) {
            throw error;
          }
          canceled = true;
        }
        if (!canceled) {
          throw new Error("Cancellation was swallowed");
        }
      }
      return "canceled";
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "id",
      [],
      [newExecutionStartedEvent("workflow", "id")],
    );
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.COMPLETED, result: JSON.stringify("canceled") },
    });
  });

  it("delivers a durable timeout to the generator on live execution and replay", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (context): Generator<Task<unknown>, unknown, unknown> {
      try {
        yield context.waitForExternalEvent("event", { timeoutInSeconds: 0 });
      } catch (error) {
        if (!(error instanceof TaskTimeoutError)) {
          throw error;
        }
      }
      return yield context.waitForExternalEvent("after");
    });
    const executor = new OrchestrationExecutor(registry);
    const start = newExecutionStartedEvent("workflow", "id");
    const timerCreated = newTimerCreatedEvent(1, new Date());
    const timerFired = newTimerFiredEvent(1, new Date());
    const live = await executor.execute("id", [start, timerCreated], [timerFired]);
    expect(live.actions).toEqual([]);
    const result = await executor.execute(
      "id",
      [start, timerCreated, timerFired],
      [newEventRaisedEvent("after", '"done"')],
    );
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.COMPLETED, result: '"done"' },
    });
  });

  it.each([true, false])("resolves event/timeout races in history order (event first: %s)", async (eventFirst) => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (context): Generator<Task<unknown>, unknown, unknown> {
      let outcome: unknown;
      try {
        outcome = yield context.waitForExternalEvent("event", { timeoutInSeconds: 30 });
      } catch (error) {
        if (!(error instanceof TaskTimeoutError)) {
          throw error;
        }
        outcome = "timeout";
      }
      yield context.waitForExternalEvent("finish");
      return outcome;
    });
    const executor = new OrchestrationExecutor(registry);
    const oldEvents = [newExecutionStartedEvent("workflow", "id"), newTimerCreatedEvent(1, new Date())];
    const event = newEventRaisedEvent("event", '"payload"');
    const fired = newTimerFiredEvent(1, new Date());
    const ordered = eventFirst ? [event, fired] : [fired, event];
    const live = await executor.execute("id", oldEvents, ordered);
    expect(live.actions).toEqual([]);
    const replay = await executor.execute("id", [...oldEvents, ...ordered], [newEventRaisedEvent("finish")]);
    expect(replay.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: JSON.stringify(eventFirst ? "payload" : "timeout"),
      },
    });
  });

  it("cancels a losing timer after whenAny and continues through a late firing", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (context): Generator<Task<unknown>, unknown, unknown> {
      const timer = context.createTimer(30);
      const event = context.waitForExternalEvent("event");
      const winner = yield whenAny([timer, event]);
      if (winner !== event) {
        throw new Error("Expected event to win");
      }
      timer.cancel();
      return yield context.waitForExternalEvent("finish");
    });
    const executor = new OrchestrationExecutor(registry);
    const oldEvents = [
      newExecutionStartedEvent("workflow", "id"),
      newTimerCreatedEvent(1, new Date()),
      newEventRaisedEvent("event"),
    ];
    const result = await executor.execute("id", oldEvents, [
      newTimerFiredEvent(1, new Date()),
      newEventRaisedEvent("finish", '"result"'),
    ]);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.COMPLETED, result: '"result"' },
    });
  });

  it("preserves late external events after timeout for the next same-name waiter", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (context): Generator<Task<unknown>, unknown, unknown> {
      try {
        yield context.waitForExternalEvent("event", { timeoutInSeconds: 30 });
      } catch (error) {
        if (!(error instanceof TaskTimeoutError)) {
          throw error;
        }
      }
      yield context.waitForExternalEvent("continue");
      return yield context.waitForExternalEvent("event");
    });
    const executor = new OrchestrationExecutor(registry);
    const oldEvents = [
      newExecutionStartedEvent("workflow", "id"),
      newTimerCreatedEvent(1, new Date()),
      newTimerFiredEvent(1, new Date()),
      newEventRaisedEvent("event", '"late payload"'),
    ];
    const result = await executor.execute("id", oldEvents, [newEventRaisedEvent("continue")]);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.COMPLETED, result: '"late payload"' },
    });
  });
});

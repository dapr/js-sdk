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

import { LogLevel, type LoggerService, type Task } from "../../../src";
import type { OrchestrationContext } from "../../../src/workflow/engine";
import { OrchestrationExecutor, Registry } from "../../../src/workflow/engine";
import { OrchestrationRuntimeContext } from "../../../src/workflow/engine";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newTaskCompletedEvent,
  newTaskScheduledEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";
import { ReplaySafeLogger } from "../../../src/workflow/runtime/ReplaySafeLogger";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";

const methods = ["error", "warn", "info", "verbose", "debug"] as const;

function createService(): jest.Mocked<LoggerService> {
  return { error: jest.fn(), warn: jest.fn(), info: jest.fn(), verbose: jest.fn(), debug: jest.fn() };
}

describe("ReplaySafeLogger", () => {
  it.each(methods)("checks the current replay state for every %s call and preserves arguments", (method) => {
    const service = createService();
    let replaying = true;
    const logger = new ReplaySafeLogger(service, () => replaying);
    const message = { message: "structured" };
    const data = { count: 1 };
    const error = new Error("details");

    logger[method](message, data, error, undefined);
    expect(service[method]).not.toHaveBeenCalled();
    replaying = false;
    logger[method](message, data, error, undefined);
    expect(service[method]).toHaveBeenCalledTimes(1);
    expect(service[method]).toHaveBeenLastCalledWith(message, data, error, undefined);
    expect(service[method].mock.calls[0][0]).toBe(message);
    expect(service[method].mock.calls[0][1]).toBe(data);
    replaying = true;
    logger[method]("replayed");
    expect(service[method]).toHaveBeenCalledTimes(1);
    replaying = false;
    logger[method]("resumed");
    expect(service[method]).toHaveBeenCalledTimes(2);
    expect(service[method]).toHaveBeenLastCalledWith("resumed");
  });

  it.each(methods)("does not swallow errors from the %s logging service", (method) => {
    const service = createService();
    const error = new Error("logging failed");
    service[method].mockImplementation(() => {
      throw error;
    });
    const logger = new ReplaySafeLogger(service, () => false);
    expect(() => logger[method]("message")).toThrow(error);
  });

  it("does not share replay state or mutate the underlying logger", () => {
    const service = createService();
    new ReplaySafeLogger(service, () => true).info("replay");
    new ReplaySafeLogger(service, () => false).info("live");
    service.info("direct");
    expect(service.info.mock.calls).toEqual([["live"], ["direct"]]);
  });
});

describe("WorkflowContext.logger", () => {
  it("does not require workflow identity until the logger is used and caches the logger", () => {
    const inner = new OrchestrationRuntimeContext("id", undefined, undefined, "workflow");
    const name = jest.spyOn(inner, "name", "get");
    const ctx = new WorkflowContext(inner);
    expect(name).not.toHaveBeenCalled();
    const logger = ctx.logger;
    expect(ctx.logger).toBe(logger);
    expect(name).toHaveBeenCalledTimes(1);
  });

  it.each([LogLevel.Error, LogLevel.Warn, LogLevel.Info, LogLevel.Verbose, LogLevel.Debug])(
    "honors configured log level %s and includes workflow identity",
    (level) => {
      const inner = new OrchestrationRuntimeContext("instance-id", undefined, undefined, "registered-name");
      const service = createService();
      const ctx = new WorkflowContext(inner, { level, service });
      const logger = ctx.logger;
      const details = { value: 42 };
      const error = new Error("details");
      inner._isReplaying = false;
      for (const method of methods) {
        logger[method]("message", details, error);
      }
      for (const [index, method] of methods.entries()) {
        expect(service[method]).toHaveBeenCalledTimes(index <= level ? 1 : 0);
        if (index <= level) {
          expect(service[method]).toHaveBeenCalledWith(
            `[Workflow, registered-name, instance-id]${method === "debug" ? ":" : ""} message`,
            details,
            error,
          );
        }
      }
      inner._isReplaying = true;
      for (const method of methods) {
        logger[method]("replayed");
      }
      for (const [index, method] of methods.entries()) {
        expect(service[method]).toHaveBeenCalledTimes(index <= level ? 1 : 0);
      }
      expect(ctx.logger).toBe(logger);
    },
  );

  it("defaults to console logging at Info level and does not format replayed messages", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const debug = jest.spyOn(console, "debug").mockImplementation(() => undefined);
    try {
      const inner = new OrchestrationRuntimeContext("id", undefined, undefined, "workflow");
      const ctx = new WorkflowContext(inner);
      const toString = jest.fn(() => "message");
      ctx.logger.info({ toString });
      expect(toString).not.toHaveBeenCalled();
      expect(info).not.toHaveBeenCalled();
      inner._isReplaying = false;
      ctx.logger.info({ toString }, 42);
      ctx.logger.debug("hidden");
      expect(info).toHaveBeenCalledWith(expect.stringContaining("[Workflow, workflow, id] message"), 42);
      expect(debug).not.toHaveBeenCalled();
    } finally {
      info.mockRestore();
      debug.mockRestore();
    }
  });
});

describe.each([false, true])("replay-safe logging through the executor (async generator: %s)", (asyncGenerator) => {
  it("logs each live step once across activity, external event and timer replay without changing actions or output", async () => {
    const service = createService();
    const observedReplay: boolean[] = [];
    const fireAt = new Date("2026-01-01T00:00:30Z");
    function createExecutor(logging: boolean) {
      const registry = new Registry();
      function* workflow(inner: OrchestrationContext): Generator<Task<unknown>, unknown, unknown> {
        const ctx = new WorkflowContext(inner, { level: LogLevel.Debug, service });
        const logger = logging ? ctx.logger : undefined;
        if (logging) observedReplay.push(ctx.isReplaying());
        logger?.info("started");
        const activity = yield ctx.callActivity("echo", 1);
        logger?.debug("activity", activity);
        const event = yield ctx.waitForExternalEvent("resume");
        logger?.warn("event", event);
        yield ctx.createTimer(fireAt);
        logger?.error("finished");
        ctx.setCustomStatus({ done: true });
        return { activity, event };
      }
      registry.addNamedOrchestrator(
        "workflow",
        asyncGenerator
          ? async function* (inner) {
              return yield* workflow(inner);
            }
          : workflow,
      );
      return new OrchestrationExecutor(registry);
    }
    const start = newExecutionStartedEvent("workflow", "id");
    const scheduled = newTaskScheduledEvent(1, "echo");
    const completed = newTaskCompletedEvent(1, '"activity-result"');
    const event = newEventRaisedEvent("resume", '"event-result"');
    const timer = newTimerCreatedEvent(2, fireAt);
    const fired = newTimerFiredEvent(2, fireAt);
    const batches = [
      { old: [], new: [start] },
      { old: [start, scheduled], new: [completed] },
      { old: [start, scheduled, completed], new: [event] },
      { old: [start, scheduled, completed, event, timer], new: [fired] },
      { old: [start, scheduled, completed, event, timer, fired], new: [newEventRaisedEvent("late")] },
    ];
    for (const batch of batches) {
      const baseline = await createExecutor(false).execute("id", batch.old, batch.new);
      const logged = await createExecutor(true).execute("id", batch.old, batch.new);
      const baselineAction = baseline.actions[0]?.workflowActionType;
      const loggedAction = logged.actions[0]?.workflowActionType;
      if (baselineAction?.case === "scheduleTask" && loggedAction?.case === "scheduleTask") {
        // Independent scheduling passes generate fresh execution IDs.
        const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
        expect(baselineAction.value.taskExecutionId).toMatch(uuid);
        expect(loggedAction.value.taskExecutionId).toMatch(uuid);
        baselineAction.value.taskExecutionId = loggedAction.value.taskExecutionId;
      }
      expect(logged).toEqual(baseline);
    }
    expect(observedReplay).toEqual([false, true, true, true, true]);
    expect(service.info.mock.calls).toEqual([["[Workflow, workflow, id] started"]]);
    expect(service.debug.mock.calls).toEqual([["[Workflow, workflow, id]: activity", "activity-result"]]);
    expect(service.warn.mock.calls).toEqual([["[Workflow, workflow, id] event", "event-result"]]);
    expect(service.error.mock.calls).toEqual([["[Workflow, workflow, id] finished"]]);
    expect(service.verbose).not.toHaveBeenCalled();
    const final = await createExecutor(false).execute("id", batches[3].old, batches[3].new);
    expect(final.customStatus).toEqual({ done: true });
    expect(final.actions).toHaveLength(1);
    expect(final.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: JSON.stringify({ activity: "activity-result", event: "event-result" }),
      },
    });
  });
});

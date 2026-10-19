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

import { create } from "@bufbuild/protobuf";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import {
  OrchestrationStatus,
  WorkflowVersionSchema,
  type WorkflowVersion,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { OrchestrationExecutor, OrchestrationRuntimeContext, Registry, Task } from "../../../src/workflow/engine";
import { newDeterministicGuid, RFC4122_NAMESPACE_DNS } from "../../../src/workflow/engine/guid/deterministicGuid";
import {
  dateToTimestamp,
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newExecutionSuspendedEvent,
  newExecutionResumedEvent,
  newFailureDetails,
  newTaskCompletedEvent,
  newTaskFailedEvent,
  newTaskScheduledEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";

const turn = (milliseconds: number, version?: WorkflowVersion) =>
  create(HistoryEventSchema, {
    timestamp: dateToTimestamp(new Date(milliseconds)),
    eventType: { case: "workflowStarted", value: { version } },
  });
const start = (milliseconds = 1000, instanceId = "order-A", executionId?: string) => {
  const event = newExecutionStartedEvent("workflow", instanceId);
  event.timestamp = dateToTimestamp(new Date(milliseconds));
  if (event.eventType.case === "executionStarted") {
    event.eventType.value.workflowInstance!.executionId = executionId;
  }
  return event;
};

describe("workflow clocks and durable GUID identities", () => {
  it("measures an external-event timeout from the current turn", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx) {
      yield ctx.waitForExternalEvent("event", { timeoutInSeconds: 5 });
    });
    const result = await new OrchestrationExecutor(registry).execute("order-A", [], [turn(10000), start()]);
    expect(result.actions[0].workflowActionType.value).toMatchObject({ fireAt: { seconds: 15n } });
  });

  it.each([11, 15])("uses turn time for retry delays and the retry timeout (%s seconds)", async (retryTimeout) => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx) {
      yield ctx.callActivity("activity", undefined, {
        retryPolicy: { firstRetryInterval: 2, maxNumberOfAttempts: 2, retryTimeout },
      });
    });
    const first = await new OrchestrationExecutor(registry).execute("order-A", [], [turn(10000), start()]);
    const failure = newTaskFailedEvent(1, newFailureDetails(new Error("retry")));
    failure.timestamp = dateToTimestamp(new Date(11000));
    const replay = await new OrchestrationExecutor(registry).execute(
      "order-A",
      [turn(10000, first.version), start(), newTaskScheduledEvent(1, "activity")],
      [turn(20000), failure],
    );
    expect(replay.actions[0].workflowActionType.value).toMatchObject(
      retryTimeout === 11 ? { workflowStatus: OrchestrationStatus.FAILED } : { fireAt: { seconds: 22n } },
    );
  });

  it("uses the resume turn for events buffered while suspended", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx) {
      yield ctx.waitForExternalEvent("wake");
      yield ctx.createTimer(5);
    });
    const first = await new OrchestrationExecutor(registry).execute("order-A", [], [turn(10000), start()]);
    const resumed = await new OrchestrationExecutor(registry).execute(
      "order-A",
      [turn(10000, first.version), start(), newExecutionSuspendedEvent(), turn(20000), newEventRaisedEvent("wake")],
      [turn(30000), newExecutionResumedEvent()],
    );
    expect(resumed.actions[0].workflowActionType.value).toMatchObject({ fireAt: { seconds: 35n } });
  });

  it("uses turn timestamps for initial and resumed timers and ignores individual event timestamps", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx) {
      const times = [ctx.currentUtcDateTime.getTime()];
      yield ctx.createTimer(2);
      times.push(ctx.currentUtcDateTime.getTime());
      ctx.setCustomStatus(times);
      yield ctx.createTimer(3);
    });
    const first = await new OrchestrationExecutor(registry).execute("order-A", [], [turn(10000), start()]);
    expect(first.actions[0].workflowActionType.value).toMatchObject({ fireAt: { seconds: 12n } });
    expect(first.version?.patches).toContain("dapr-js:workflow-semantics-v2");
    const created = newTimerCreatedEvent(1, new Date(12000));
    created.timestamp = dateToTimestamp(new Date(1000));
    const fired = newTimerFiredEvent(1, new Date(12000));
    fired.timestamp = dateToTimestamp(new Date(12000));
    const unrelated = newEventRaisedEvent("unrelated");
    unrelated.timestamp = dateToTimestamp(new Date(99000));
    const resumed = await new OrchestrationExecutor(registry).execute(
      "order-A",
      [turn(10000, first.version), start(), created],
      [turn(20000), unrelated, fired],
    );
    expect(resumed.customStatus).toEqual([10000, 20000]);
    expect(resumed.actions[0].workflowActionType.value).toMatchObject({ fireAt: { seconds: 23n } });
    expect(resumed.version).toEqual(first.version);
  });

  it("preserves legacy timestamps and GUIDs throughout an unmarked in-flight history", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx) {
      const initialTime = ctx.currentUtcDateTime.getTime();
      const guid = ctx.newGuid();
      yield ctx.createTimer(2);
      ctx.setCustomStatus({ initialTime, guid, resumedTime: ctx.currentUtcDateTime.getTime() });
      yield ctx.createTimer(3);
    });
    const fired = newTimerFiredEvent(1, new Date(3000));
    fired.timestamp = dateToTimestamp(new Date(3000));
    const result = await new OrchestrationExecutor(registry).execute(
      "order-A",
      [turn(10000), start(), newTimerCreatedEvent(1, new Date(3000))],
      [turn(20000), fired],
    );
    expect(result.customStatus).toEqual({
      initialTime: 1000,
      resumedTime: 3000,
      guid: "b6589fc6-ab0d-582c-b120-99d1c2d40ab9",
    });
    expect(result.actions[0].workflowActionType.value).toMatchObject({ fireAt: { seconds: 6n } });
    expect(result.version).toBeUndefined();
  });

  it("preserves other patch metadata and recognizes a compacted marker in a later turn", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx) {
      ctx.setCustomStatus(ctx.currentUtcDateTime.getTime());
      yield ctx.waitForExternalEvent("finish");
    });
    const version = create(WorkflowVersionSchema, { name: "existing", patches: ["other-patch"] });
    const first = await new OrchestrationExecutor(registry).execute("order-A", [], [turn(10000, version), start()]);
    expect(first.version).toMatchObject({
      name: "existing",
      patches: ["other-patch", "dapr-js:workflow-semantics-v2"],
    });
    const replay = await new OrchestrationExecutor(registry).execute(
      "order-A",
      [turn(10000), start(), turn(20000, first.version)],
      [turn(30000)],
    );
    expect(replay.customStatus).toBe(10000);
    expect(replay.version).toEqual(first.version);
  });

  it.each([undefined, "execution-A"])(
    "keeps GUIDs and detached IDs stable on replay (execution ID: %s)",
    async (executionId) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("workflow", function* (ctx) {
        ctx.setCustomStatus([ctx.newGuid(), ctx.newGuid()]);
        ctx.scheduleNewDetachedWorkflow("child");
        yield ctx.waitForExternalEvent("finish");
      });
      const initial = start(1000, "order-A", executionId);
      const first = await new OrchestrationExecutor(registry).execute("order-A", [], [turn(10000), initial]);
      const replay = await new OrchestrationExecutor(registry).execute(
        "order-A",
        [turn(10000, first.version), initial],
        [turn(20000)],
      );
      expect(replay.customStatus).toEqual(first.customStatus);
      expect(replay.actions).toEqual(first.actions);
      const next = await new OrchestrationExecutor(registry).execute(
        "order-A",
        [],
        [turn(30000), start(2000, "order-A", executionId)],
      );
      expect(next.customStatus).not.toEqual(first.customStatus);
      expect(next.actions[0]).not.toEqual(first.actions[0]);
      const other = await new OrchestrationExecutor(registry).execute(
        "order-B",
        [],
        [turn(10000), start(1000, "order-B", executionId)],
      );
      expect(other.customStatus).not.toEqual(first.customStatus);
      expect(other.actions[0]).not.toEqual(first.actions[0]);
    },
  );

  it("includes nanoseconds when using the generation start timestamp", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", (ctx) => ctx.newGuid());
    const first = start();
    const next = start();
    next.timestamp!.nanos = 1;
    const results = await Promise.all(
      [first, next].map((event) => new OrchestrationExecutor(registry).execute("order-A", [], [turn(10000), event])),
    );
    expect(results[0].actions[0]).not.toEqual(results[1].actions[0]);
  });

  it("hashes the full custom namespace while preserving UUID namespace results", () => {
    const ids = ["order-A", "order-B", "ab-not-hex-A", "ab-not-hex-B", "", "__proto__"];
    expect(new Set(ids.map((id) => newDeterministicGuid(id, "0"))).size).toBe(ids.length);
    expect(newDeterministicGuid("order-A", "0")).toBe(newDeterministicGuid("order-A", "0"));
    expect(newDeterministicGuid(RFC4122_NAMESPACE_DNS, "www.widgets.com")).toBe("21f7f8de-8051-5b89-8680-0195ef798b6a");
  });
});

describe("workflow outputs and invalid yields", () => {
  it.each([false, true])("accepts ordinary outputs (async: %s)", async (asyncWorkflow) => {
    for (const output of ["hello", "", [1, 2], [], 42, false, null, undefined, { value: 1 }]) {
      const registry = new Registry();
      registry.addNamedOrchestrator("workflow", asyncWorkflow ? async () => output : () => output);
      const result = await new OrchestrationExecutor(registry).execute("order-A", [], [start()]);
      const completion = result.actions[0].workflowActionType;
      if (completion.case !== "completeWorkflow") throw new Error("Expected completion");
      expect(completion.value.workflowStatus).toBe(OrchestrationStatus.COMPLETED);
      expect(completion.value.result).toBe(output == null ? undefined : JSON.stringify(output));
    }
  });

  it.each([false, true])("fails invalid initial and later yields (async: %s)", async (asyncWorkflow) => {
    for (const later of [false, true]) {
      for (const value of [undefined, null, 42, "not a task", Promise.resolve(1)]) {
        const registry = new Registry();
        registry.addNamedOrchestrator(
          "workflow",
          asyncWorkflow
            ? async function* (ctx) {
                if (later) yield ctx.callActivity("activity");
                yield value;
              }
            : function* (ctx) {
                if (later) yield ctx.callActivity("activity");
                yield value;
              },
        );
        const events = later ? [newTaskScheduledEvent(1, "activity"), newTaskCompletedEvent(1, '"ok"')] : [];
        const result = await new OrchestrationExecutor(registry).execute("order-A", [], [start(), ...events]);
        expect(result.actions).toHaveLength(1);
        expect(result.actions[0].workflowActionType.value).toMatchObject({
          workflowStatus: OrchestrationStatus.FAILED,
          failureDetails: { errorMessage: "The orchestrator generator yielded a non-Task object" },
        });
      }
    }
  });

  it.each([null, undefined, "failure", 42, Object.create(null)])(
    "reports non-Error workflow failures: %p",
    async (value) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("workflow", async () => {
        throw value;
      });
      const result = await new OrchestrationExecutor(registry).execute("order-A", [], [start()]);
      expect(result.actions[0].workflowActionType.value).toMatchObject({
        workflowStatus: OrchestrationStatus.FAILED,
        failureDetails: {
          errorType: "Error",
          errorMessage: value !== null && typeof value === "object" ? "A non-Error value was thrown" : String(value),
        },
      });
    },
  );
});

describe("prototype-safe workflow names and events", () => {
  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])("registers only explicit names: %s", (name) => {
    const registry = new Registry();
    const fn = () => "done";
    expect(registry.getActivity(name)).toBeUndefined();
    expect(registry.getOrchestrator(name)).toBeUndefined();
    registry.addNamedActivity(name, fn);
    registry.addNamedOrchestrator(name, fn);
    expect(registry.getActivity(name)).toBe(fn);
    expect(registry.getOrchestrator(name)).toBe(fn);
    expect(() => registry.addNamedActivity(name, fn)).toThrow("already exists");
    expect(() => registry.addNamedOrchestrator(name, fn)).toThrow("already exists");
  });

  it.each(["constructor", "__proto__", "toString"])("delivers awaited and buffered events: %s", async (name) => {
    for (const buffered of [false, true]) {
      const registry = new Registry();
      registry.addNamedOrchestrator("workflow", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
        ctx.waitForExternalEvent(name).cancel();
        if (buffered) yield ctx.waitForExternalEvent("trigger");
        return yield ctx.waitForExternalEvent(name);
      });
      const result = await new OrchestrationExecutor(registry).execute(
        "order-A",
        [],
        [start(), newEventRaisedEvent(name, '"delivered"'), newEventRaisedEvent("trigger")],
      );
      expect(result.actions[0].workflowActionType.value).toMatchObject({
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: '"delivered"',
      });
    }
  });

  it("carries prototype-named events past abandoned waiters", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx) {
      ctx.waitForExternalEvent("__proto__");
      yield ctx.waitForExternalEvent("restart");
      ctx.continueAsNew("next", true);
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "order-A",
      [],
      [start(), newEventRaisedEvent("restart"), newEventRaisedEvent("__proto__", '"carried"')],
    );
    expect(result.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.CONTINUED_AS_NEW,
      carryoverEvents: [
        expect.objectContaining({
          eventType: { case: "eventRaised", value: expect.objectContaining({ name: "__proto__", input: '"carried"' }) },
        }),
      ],
    });
    const ctx = new OrchestrationRuntimeContext("order-A");
    expect(Object.getPrototypeOf(ctx._pendingEvents)).toBeNull();
    expect(Object.getPrototypeOf(ctx._receivedEvents)).toBeNull();
  });
});

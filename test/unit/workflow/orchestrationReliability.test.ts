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
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { OrchestrationExecutor, Registry, Task } from "../../../src/workflow/engine";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import {
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newTaskCompletedEvent,
  newTaskScheduledEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";

const sent = (name = "message", instanceId = "recipient") =>
  create(HistoryEventSchema, {
    eventId: 1,
    eventType: { case: "eventSent", value: { name, instanceId, input: '{"value":1}' } },
  });

describe("workflow delivery and replay", () => {
  it.each(["return", "continue", "wait"])(
    "preserves outbound events on %s and consumes confirmations on replay",
    async (mode) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("sender", function* (inner) {
        const ctx = new WorkflowContext(inner);
        ctx.sendEvent("recipient", "message", { value: 1 });
        if (mode === "continue") ctx.continueAsNew("next");
        if (mode === "wait") yield ctx.waitForExternalEvent("resume");
        return "done";
      });
      const start = newExecutionStartedEvent("sender", "id");
      const first = await new OrchestrationExecutor(registry).execute("id", [], [start]);
      expect(first.actions.map((action) => action.workflowActionType.case)).toEqual(
        mode === "wait" ? ["sendEvent"] : ["sendEvent", "completeWorkflow"],
      );
      expect(first.actions[0].workflowActionType.value).toMatchObject({
        instance: { instanceId: "recipient" },
        name: "message",
        data: '{"value":1}',
      });
      const replay = await new OrchestrationExecutor(registry).execute(
        "id",
        [start, sent()],
        [newEventRaisedEvent("resume")],
      );
      expect(replay.actions.map((action) => action.workflowActionType.case)).toEqual(["completeWorkflow"]);
      expect(replay.actions[0].workflowActionType.value).toMatchObject({
        workflowStatus: mode === "continue" ? OrchestrationStatus.CONTINUED_AS_NEW : OrchestrationStatus.COMPLETED,
      });
    },
  );

  it.each([sent("different"), sent("message", "other")])(
    "detects changed outbound event destinations or names",
    async (event) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("sender", function* (ctx) {
        ctx.sendEvent("recipient", "message", { value: 1 });
        yield ctx.waitForExternalEvent("resume");
      });
      const result = await new OrchestrationExecutor(registry).execute(
        "id",
        [newExecutionStartedEvent("sender", "id")],
        [event],
      );
      expect(result.actions[0].workflowActionType.value).toMatchObject({
        workflowStatus: OrchestrationStatus.FAILED,
        failureDetails: { errorType: "NonDeterminismError" },
      });
    },
  );

  it.each([false, true])("does not send pending messages from a failed workflow (after wait: %s)", async (wait) => {
    const registry = new Registry();
    registry.addNamedOrchestrator("sender", function* (ctx) {
      if (wait) yield ctx.waitForExternalEvent("resume");
      ctx.sendEvent("recipient", "message", 1);
      throw new Error("failure");
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "id",
      [],
      [newExecutionStartedEvent("sender", "id"), newEventRaisedEvent("resume")],
    );
    expect(result.actions.map((action) => action.workflowActionType.case)).toEqual(["completeWorkflow"]);
    expect(result.actions[0].workflowActionType.value).toMatchObject({ workflowStatus: OrchestrationStatus.FAILED });
  });

  it.each([false, true])("carries late events past abandoned waiters only when requested (save: %s)", async (save) => {
    const registry = new Registry();
    registry.addNamedOrchestrator("continuing", function* (inner) {
      const ctx = new WorkflowContext(inner);
      const restart = ctx.waitForExternalEvent("restart");
      const next = ctx.waitForExternalEvent("next");
      yield ctx.whenAny([restart, next]);
      ctx.continueAsNew(1, save);
    });
    const start = newExecutionStartedEvent("continuing", "id");
    const events = [
      newEventRaisedEvent("restart"),
      newEventRaisedEvent("next", '"first"'),
      newEventRaisedEvent("NEXT", '"second"'),
      newTimerCreatedEvent(99, new Date()),
      newTimerFiredEvent(99, new Date()),
    ];
    for (const replay of [false, true]) {
      const result = await new OrchestrationExecutor(registry).execute(
        "id",
        replay ? [start, ...events] : [start],
        replay ? [newEventRaisedEvent("unrelated")] : events,
      );
      const completion = result.actions[0].workflowActionType;
      if (completion.case !== "completeWorkflow") throw new Error("Expected completion");
      expect(completion.value.workflowStatus).toBe(OrchestrationStatus.CONTINUED_AS_NEW);
      const carried = completion.value.carryoverEvents.filter(
        (event) => event.eventType.case === "eventRaised" && event.eventType.value.name === "next",
      );
      expect(carried.map((event) => event.eventType.value)).toEqual(
        save ? [expect.objectContaining({ input: '"first"' }), expect.objectContaining({ input: '"second"' })] : [],
      );
    }
  });

  it.each([false, true])("replays empty, nested and overlapping compositions (async: %s)", async (asyncGenerator) => {
    const registry = new Registry();
    function* workflow(
      inner: ConstructorParameters<typeof WorkflowContext>[0],
    ): Generator<Task<unknown>, unknown, unknown> {
      const ctx = new WorkflowContext(inner);
      const empty = yield ctx.whenAll([]);
      const first = ctx.callActivity<number>("echo", 1);
      const second = ctx.callActivity<number>("echo", 2);
      const joined = ctx.whenAll([first, second]);
      const race = ctx.whenAny([first, second]);
      yield ctx.whenAll([ctx.whenAny([joined]), ctx.whenAny([race])]);
      return { empty, values: joined.getResult(), winner: race.getResult().getResult() };
    }
    registry.addNamedOrchestrator(
      "composed",
      asyncGenerator
        ? async function* (ctx) {
            return yield* workflow(ctx);
          }
        : workflow,
    );
    const start = newExecutionStartedEvent("composed", "id");
    const scheduled = [newTaskScheduledEvent(1, "echo"), newTaskScheduledEvent(2, "echo")];
    const first = await new OrchestrationExecutor(registry).execute("id", [], [start]);
    expect(first.actions.map((action) => action.workflowActionType.case)).toEqual(["scheduleTask", "scheduleTask"]);
    const partial = await new OrchestrationExecutor(registry).execute(
      "id",
      [start, ...scheduled],
      [newTaskCompletedEvent(2, "2")],
    );
    expect(partial.actions).toEqual([]);
    const result = await new OrchestrationExecutor(registry).execute(
      "id",
      [start, ...scheduled, newTaskCompletedEvent(2, "2")],
      [newTaskCompletedEvent(1, "1")],
    );
    expect(result.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.COMPLETED,
      result: JSON.stringify({ empty: [], values: [1, 2], winner: 2 }),
    });
  });
});

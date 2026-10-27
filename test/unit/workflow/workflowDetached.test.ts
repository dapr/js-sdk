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

import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { WorkflowActionSchema } from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { DetachedWorkflowOptions, HistoryPropagationScope, WorkflowContext, TWorkflow, Task } from "../../../src";
import { OrchestrationContext, OrchestrationRuntimeContext } from "../../../src/workflow/engine";
import { OrchestrationExecutor } from "../../../src/workflow/engine";
import { Registry } from "../../../src/workflow/engine";
import {
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newTaskCompletedEvent,
  newTaskScheduledEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";

const created = (instanceId: string, eventId = 1) =>
  create(HistoryEventSchema, {
    eventId,
    eventType: { case: "detachedWorkflowInstanceCreated", value: { instanceId } },
  });

describe("detached workflows", () => {
  it("preserves existing context subclasses without requiring a detached workflow implementation", () => {
    class LegacyContext extends OrchestrationContext {
      private readonly inner = new OrchestrationRuntimeContext("legacy");
      readonly instanceId = "legacy";
      readonly currentUtcDateTime = new Date(0);
      readonly isReplaying = false;
      createTimer = this.inner.createTimer.bind(this.inner);
      callActivity = this.inner.callActivity.bind(this.inner);
      callSubOrchestrator = this.inner.callSubOrchestrator.bind(this.inner);
      waitForExternalEvent = this.inner.waitForExternalEvent.bind(this.inner);
      continueAsNew = this.inner.continueAsNew.bind(this.inner);
      setCustomStatus = this.inner.setCustomStatus.bind(this.inner);
      sendEvent = this.inner.sendEvent.bind(this.inner);
      newGuid = this.inner.newGuid.bind(this.inner);
    }

    const ctx = new WorkflowContext(new LegacyContext());
    expect(ctx.getWorkflowInstanceId()).toBe("legacy");
    expect(ctx.callActivity("echo").isComplete).toBe(false);
    expect(() => ctx.scheduleNewDetachedWorkflow("detached")).toThrow(
      "This orchestration context does not support detached workflows",
    );
  });

  it.each([false, true])("accepts a workflow name or function reference (reference: %s)", (reference) => {
    const inner = new OrchestrationRuntimeContext("caller", "source");
    const ctx = new WorkflowContext(inner);
    const workflow: TWorkflow = function* detached(ctx: WorkflowContext): any {
      return yield ctx.waitForExternalEvent("done");
    };
    const startAt = new Date("2026-10-19T12:00:00Z");
    const options: DetachedWorkflowOptions = { targetAppId: "destination" };
    const task = ctx.scheduleNewDetachedWorkflow(
      reference ? workflow : "detached",
      { value: 42 },
      "id",
      startAt,
      options,
    );
    expect(task.isComplete).toBe(true);
    expect(task.getResult()).toBe("id");
    expect(inner._pendingTasks).toEqual({});
    const action = fromBinary(WorkflowActionSchema, toBinary(WorkflowActionSchema, inner.getActions()[0]));
    expect(action).toMatchObject({
      id: 1,
      router: { sourceAppID: "source", targetAppID: "destination" },
      workflowActionType: {
        case: "createDetachedWorkflow",
        value: {
          name: "detached",
          instanceId: "id",
          input: '{"value":42}',
          scheduledStartTimestamp: { seconds: BigInt(startAt.getTime() / 1000), nanos: 0 },
        },
      },
    });
  });

  it.each([undefined, null, false, 0, "", { items: [1, false, null] }])("preserves input %p", (input) => {
    const ctx = new OrchestrationRuntimeContext("caller");
    ctx.scheduleNewDetachedWorkflow("detached", input);
    const action = ctx.getActions()[0];
    expect(action.router).toBeUndefined();
    if (action.workflowActionType.case !== "createDetachedWorkflow") throw new Error("Expected detached start");
    expect(action.workflowActionType.value.input).toBe(JSON.stringify(input));
    expect(action.workflowActionType.value.scheduledStartTimestamp).toBeUndefined();
  });

  it("generates unique replay-stable IDs without consuming durable task IDs", () => {
    const schedule = () => {
      const ctx = new OrchestrationRuntimeContext("caller");
      const first = ctx.scheduleNewDetachedWorkflow("detached").getResult();
      const second = ctx.scheduleNewDetachedWorkflow("detached").getResult();
      expect(first).not.toBe(second);
      expect(ctx.getActions().map((action) => action.id)).toEqual([1, 2]);
      return [first, second];
    };
    expect(schedule()).toEqual(schedule());
  });

  it("rejects duplicate pending instance IDs without allocating another action", () => {
    const ctx = new OrchestrationRuntimeContext("caller");
    ctx.scheduleNewDetachedWorkflow("detached", undefined, "id");
    expect(() => ctx.scheduleNewDetachedWorkflow("other", undefined, "id")).toThrow("already been scheduled");
    expect(ctx.getActions()).toHaveLength(1);
  });

  it.each([
    { name: "", id: undefined, startAt: undefined, options: undefined, error: "name" },
    { name: " ", id: undefined, startAt: undefined, options: undefined, error: "name" },
    { name: "detached", id: "", startAt: undefined, options: undefined, error: "instanceId" },
    { name: "detached", id: " ", startAt: undefined, options: undefined, error: "instanceId" },
    { name: "detached", id: undefined, startAt: new Date(NaN), options: undefined, error: "startAt" },
    { name: "detached", id: undefined, startAt: undefined, options: { targetAppId: " " }, error: "targetAppId" },
    {
      name: "detached",
      id: undefined,
      startAt: undefined,
      options: { targetAppId: "destination", retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 } },
      error: "do not support retries",
    },
    {
      name: "detached",
      id: undefined,
      startAt: undefined,
      options: { targetAppId: "destination", propagationScope: HistoryPropagationScope.LINEAGE },
      error: "do not support retries",
    },
  ])("rejects invalid scheduling arguments: $error ($id)", ({ name, id, startAt, options, error }) => {
    const ctx = new OrchestrationRuntimeContext("caller", "source");
    expect(() => ctx.scheduleNewDetachedWorkflow(name, undefined, id, startAt, options)).toThrow(error);
    expect(ctx.getActions()).toEqual([]);
    expect(ctx._pendingTasks).toEqual({});
    const fresh = new OrchestrationRuntimeContext("caller", "source");
    expect(ctx.scheduleNewDetachedWorkflow("valid").getResult()).toBe(
      fresh.scheduleNewDetachedWorkflow("valid").getResult(),
    );
    expect(ctx.getActions()[0].id).toBe(1);
  });

  it("rejects cross-app scheduling without caller routing metadata", () => {
    const ctx = new OrchestrationRuntimeContext("caller");
    expect(() =>
      ctx.scheduleNewDetachedWorkflow("remote", undefined, undefined, undefined, { targetAppId: "destination" }),
    ).toThrow("calling app ID");
    expect(ctx.getActions()).toEqual([]);
  });

  it("snapshots input, routing, and scheduled start when the call is made", () => {
    const ctx = new OrchestrationRuntimeContext("caller", "source");
    const input = { value: 1 };
    const options = { targetAppId: "destination" };
    const date = new Date("2026-10-19T12:00:00Z");
    ctx.scheduleNewDetachedWorkflow("detached", input, undefined, date, options);
    const original = toBinary(WorkflowActionSchema, ctx.getActions()[0]);
    input.value = 2;
    options.targetAppId = "mutated";
    date.setFullYear(2000);
    expect(toBinary(WorkflowActionSchema, ctx.getActions()[0])).toEqual(original);
  });

  it.each(["completed", "continued"])("preserves completion action semantics when the caller is %s", async (mode) => {
    const registry = new Registry();
    registry.addNamedOrchestrator("caller", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      const id = yield ctx.scheduleNewDetachedWorkflow("detached", null);
      ctx.callActivity("unawaited-activity");
      if (mode === "continued") ctx.continueAsNew(id, true);
      return id;
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "caller-id",
      [],
      [newExecutionStartedEvent("caller", "caller-id")],
    );
    expect(result.actions.map((action) => action.workflowActionType.case)).toEqual(
      mode === "continued" ? ["completeWorkflow"] : ["createDetachedWorkflow", "completeWorkflow"],
    );
    expect(result.actions[result.actions.length - 1].workflowActionType.value).toMatchObject({
      workflowStatus: mode === "continued" ? OrchestrationStatus.CONTINUED_AS_NEW : OrchestrationStatus.COMPLETED,
    });
  });

  it.each([false, true])(
    "consumes creation on replay without rescheduling (immediate completion: %s)",
    async (immediate) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("caller", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
        const id = yield ctx.scheduleNewDetachedWorkflow("detached");
        if (!immediate) yield ctx.waitForExternalEvent("continue");
        return id;
      });
      const executor = new OrchestrationExecutor(registry);
      const start = newExecutionStartedEvent("caller", "caller-id");
      const first = await executor.execute("caller-id", [], [start]);
      const action = first.actions[0].workflowActionType;
      if (action.case !== "createDetachedWorkflow") throw new Error("Expected detached start");
      const replay = await executor.execute(
        "caller-id",
        [start, created(action.value.instanceId)],
        [newEventRaisedEvent("continue")],
      );
      expect(replay.actions).toHaveLength(1);
      expect(replay.actions[0].workflowActionType).toMatchObject({
        case: "completeWorkflow",
        value: { workflowStatus: OrchestrationStatus.COMPLETED, result: JSON.stringify(action.value.instanceId) },
      });
    },
  );

  it("consumes creation confirmations without completing an unrelated pending activity", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("caller", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      yield ctx.scheduleNewDetachedWorkflow("detached", undefined, "detached-id");
      return yield ctx.callActivity("echo");
    });
    const executor = new OrchestrationExecutor(registry);
    const history = [
      newExecutionStartedEvent("caller", "caller-id"),
      created("detached-id"),
      newTaskScheduledEvent(2, "echo"),
    ];
    expect((await executor.execute("caller-id", [], history)).actions).toEqual([]);
    const replay = await executor.execute("caller-id", history, [newTaskCompletedEvent(2, '"result"')]);
    expect(replay.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { result: '"result"', workflowStatus: OrchestrationStatus.COMPLETED },
    });
  });

  it("matches detached confirmations by instance ID, not history event order or sequence number", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("caller", function* (ctx) {
      ctx.scheduleNewDetachedWorkflow("detached", undefined, "first");
      ctx.scheduleNewDetachedWorkflow("detached", undefined, "second");
      yield ctx.waitForExternalEvent("continue");
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "caller-id",
      [newExecutionStartedEvent("caller", "caller-id")],
      [created("second", 10), created("first", 11)],
    );
    expect(result.actions).toEqual([]);
  });

  it.each(["missing", "different action", "different instance"])("fails nondeterministic replay: %s", async (kind) => {
    const registry = new Registry();
    registry.addNamedOrchestrator("caller", function* (ctx) {
      if (kind === "different action") ctx.callActivity("echo");
      if (kind === "different instance") ctx.scheduleNewDetachedWorkflow("detached", undefined, "changed-id");
      yield ctx.waitForExternalEvent("continue");
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "caller-id",
      [newExecutionStartedEvent("caller", "caller-id")],
      [created("original-id")],
    );
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.FAILED, failureDetails: { errorType: "NonDeterminismError" } },
    });
  });
});

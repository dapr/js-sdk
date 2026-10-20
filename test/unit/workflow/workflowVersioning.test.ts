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
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  OrchestrationContext,
  OrchestrationRuntimeContext,
  OrchestrationExecutor,
  Registry,
  type TOrchestrator,
} from "../../../src/workflow/engine";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import {
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newTaskCompletedEvent,
  newTaskScheduledEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";

const marker = (patches?: string[]) =>
  create(HistoryEventSchema, {
    eventType: { case: "workflowStarted", value: { version: patches ? { name: "workflow", patches } : undefined } },
  });

/** New executions lead with the SDK's internal semantics marker; user patches follow it. */
const SEMANTICS = "dapr-js:workflow-semantics-v2";

function context(patches?: string[]): OrchestrationRuntimeContext {
  return new OrchestrationRuntimeContext("id", undefined, undefined, "workflow", undefined, undefined, undefined, [
    marker(patches),
  ]);
}

function executor(workflow: TOrchestrator): OrchestrationExecutor {
  const registry = new Registry();
  registry.addNamedOrchestrator("workflow", workflow);
  return new OrchestrationExecutor(registry);
}

describe("workflow patch decisions (.NET semantics)", () => {
  it.each([undefined, [], ["existing"]])("only enables recorded patches during replay with history %p", (patches) => {
    const ctx = context(patches);
    expect(ctx.isPatched("existing")).toBe(patches?.includes("existing") ?? false);
    expect(ctx.isPatched("new")).toBe(false);
    expect(ctx.version?.patches ?? []).toEqual(patches ?? []);
  });

  it("enables live patches and records order and duplicates, not a set", () => {
    const ctx = context();
    ctx._isReplaying = false;
    for (const patch of ["b", "a", "b", "a"]) expect(ctx.isPatched(patch)).toBe(true);
    expect(ctx.version).toMatchObject({ name: "workflow", patches: ["b", "a", "b", "a"] });
  });

  it("keeps a false replay decision when the same patch is checked in live execution", () => {
    const ctx = context();
    expect(ctx.isPatched("p")).toBe(false);
    ctx._isReplaying = false;
    expect(ctx.isPatched("p")).toBe(false);
    expect(ctx.version).toBeUndefined();
    expect(ctx.isPatched("later")).toBe(true);
    expect(ctx.version?.patches).toEqual(["later"]);
  });

  it("keeps true decisions when replay state changes", () => {
    const ctx = context();
    ctx._isReplaying = false;
    expect(ctx.isPatched("p")).toBe(true);
    ctx._isReplaying = true;
    expect(ctx.isPatched("p")).toBe(true);
    expect(ctx.version?.patches).toEqual(["p", "p"]);
  });

  it("uses exact case-sensitive names without trimming or object-prototype collisions", () => {
    const ctx = context(["Patch", " patch ", "__proto__", "constructor"]);
    for (const name of ["Patch", " patch ", "__proto__", "constructor"]) expect(ctx.isPatched(name)).toBe(true);
    for (const name of ["patch", "PATCH", "toString"]) expect(ctx.isPatched(name)).toBe(false);
  });

  it.each(["", " ", "\t\r\n"])("rejects blank name %p without recording a patch", (name) => {
    const ctx = context();
    ctx._isReplaying = false;
    expect(() => ctx.isPatched(name)).toThrow(TypeError);
    expect(ctx.version).toBeUndefined();
  });

  it.each([null, undefined, 42, {}, []])("rejects non-string JavaScript input %p", (name) => {
    expect(() => Reflect.apply(context().isPatched, context(), [name])).toThrow(TypeError);
  });

  it("does not expose mutable internal patch state through the response", () => {
    const ctx = context(["p"]);
    ctx.isPatched("p");
    ctx.version!.patches.push("injected");
    expect(ctx.version?.patches).toEqual(["p"]);
    expect(ctx.isPatched("injected")).toBe(false);
  });

  it("omits version metadata when patches are not used, even with versioned history", () => {
    expect(context(["unused"]).version).toBeUndefined();
  });

  it("keeps patch state isolated between instances", () => {
    const first = context();
    first._isReplaying = false;
    expect(first.isPatched("p")).toBe(true);
    expect(context().isPatched("p")).toBe(false);
  });

  it("provides a non-abstract, explicit unsupported default for existing custom contexts", () => {
    expect(() => OrchestrationContext.prototype.isPatched("p")).toThrow(
      "This orchestration context does not support workflow patches",
    );
  });
});

describe.each([false, true])("workflow patch replay (async generator: %s)", (asyncGenerator) => {
  function patchedExecutor(): OrchestrationExecutor {
    function* workflow(inner: OrchestrationContext) {
      const ctx = new WorkflowContext(inner);
      const patched = ctx.isPatched("validation");
      if (patched) yield ctx.callActivity("validate");
      yield ctx.callActivity("original");
      yield ctx.waitForExternalEvent("finish");
      return { patched, repeated: ctx.isPatched("validation") };
    }
    return executor(
      asyncGenerator
        ? async function* (ctx) {
            return yield* workflow(ctx);
          }
        : workflow,
    );
  }

  const start = () => newExecutionStartedEvent("workflow", "id");

  it("records a new patch without consuming an action sequence number", async () => {
    const result = await patchedExecutor().execute("id", [], [marker(), start()]);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      id: 1,
      workflowActionType: { case: "scheduleTask", value: { name: "validate" } },
    });
    expect(result.version).toMatchObject({ name: "workflow", patches: [SEMANTICS, "validation"] });
  });

  it("replays an old instance without patch history and never schedules the inserted activity", async () => {
    const result = await patchedExecutor().execute(
      "id",
      [marker(), start(), newTaskScheduledEvent(1, "original"), newTaskCompletedEvent(1)],
      [marker(), newEventRaisedEvent("finish")],
    );
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      id: 2,
      workflowActionType: {
        case: "completeWorkflow",
        value: {
          workflowStatus: OrchestrationStatus.COMPLETED,
          result: JSON.stringify({ patched: false, repeated: false }),
        },
      },
    });
    expect(result.version).toBeUndefined();
  });

  it("loads markers from the entire past before replay and preserves checks across turn boundaries", async () => {
    const recorded = fromBinary(HistoryEventSchema, toBinary(HistoryEventSchema, marker(["validation"])));
    const result = await patchedExecutor().execute(
      "id",
      [
        marker(),
        start(),
        newTaskScheduledEvent(1, "validate"),
        recorded,
        newTaskCompletedEvent(1),
        newTaskScheduledEvent(2, "original"),
        marker(),
        newTaskCompletedEvent(2),
      ],
      [marker(), newEventRaisedEvent("finish")],
    );
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: JSON.stringify({ patched: true, repeated: true }),
      },
    });
    expect(result.version?.patches).toEqual(["validation", "validation"]);
  });

  it("enables an existing instance's patch if its first check occurs after replay", async () => {
    function* workflow(ctx: OrchestrationContext) {
      yield ctx.waitForExternalEvent("resume");
      if (ctx.isPatched("late")) yield ctx.callActivity("new-step");
      return "done";
    }
    const run = executor(
      asyncGenerator
        ? async function* (ctx) {
            return yield* workflow(ctx);
          }
        : workflow,
    );
    const result = await run.execute("id", [marker(), start()], [marker(), newEventRaisedEvent("resume")]);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "scheduleTask",
      value: { name: "new-step" },
    });
    expect(result.version?.patches).toEqual(["late"]);
  });

  it("aggregates patches from multiple historical turns but emits only evaluated checks", async () => {
    const run = executor((ctx) => ({ checks: [ctx.isPatched("a"), ctx.isPatched("b"), ctx.isPatched("new")] }));
    const result = await run.execute(
      "id",
      [start(), marker(["a", "unused"]), marker(["b"])],
      [newEventRaisedEvent("ignored")],
    );
    expect(result.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.COMPLETED,
      result: '{"checks":[true,true,false]}',
    });
    expect(result.version?.patches).toEqual(["a", "b"]);
  });

  it("surfaces invalid names as workflow failures, not false decisions", async () => {
    const result = await executor((ctx) => ctx.isPatched(" ")).execute("id", [], [start()]);
    expect(result.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.FAILED,
      failureDetails: { errorType: "TypeError", errorMessage: expect.stringContaining("patchName") },
    });
    expect(result.version?.patches).toEqual([SEMANTICS]);
  });

  it("continues as new without carrying the previous execution's patch state", async () => {
    const continuing = executor((ctx) => {
      ctx.isPatched("old-generation");
      ctx.continueAsNew("next", true);
    });
    const first = await continuing.execute("id", [], [start()]);
    expect(first.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.CONTINUED_AS_NEW,
    });
    expect(first.version?.patches).toEqual([SEMANTICS, "old-generation"]);
    const next = await executor((ctx) => ctx.isPatched("new-generation")).execute("id", [], [start()]);
    expect(next.version?.patches).toEqual([SEMANTICS, "new-generation"]);
  });

  it("does not mask unrelated nondeterminism with patch support", async () => {
    const result = await patchedExecutor().execute(
      "id",
      [marker(["validation"]), start(), newTaskScheduledEvent(1, "wrong-activity")],
      [newTaskCompletedEvent(1)],
    );
    expect(result.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.FAILED,
      failureDetails: { errorType: "NonDeterminismError" },
    });
  });
});

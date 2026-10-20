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

import { WorkflowHarness } from "@dapr/testcontainer-node";
import {
  DaprWorkflowClient,
  WorkflowRuntime,
  WorkflowContext,
  WorkflowRuntimeStatus,
  type TWorkflow,
  type HistoryEvent,
} from "../../../src";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { minimumDaprRuntime } from "../helpers/runtimeVersion";

describe("workflow patch versioning", () => {
  let harness: WorkflowHarness;
  let client: DaprWorkflowClient;
  let runtime: WorkflowRuntime;

  const newRuntime = () =>
    new WorkflowRuntime({
      daprHost: harness.getHost(),
      daprPort: harness.getGrpcPort().toString(),
    });

  beforeAll(async () => {
    harness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE });
    harness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
    await harness.start();
  }, 180_000);

  beforeEach(() => {
    client = new DaprWorkflowClient({
      daprHost: harness.getHost(),
      daprPort: harness.getGrpcPort().toString(),
    });
    runtime = newRuntime();
  });

  afterEach(async () => {
    await runtime.stop();
    await client.stop();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(() => harness.stop());
  });

  async function waitForStatus(id: string, expected: string): Promise<void> {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      const state = await client.getWorkflowState(id, true);
      if (state?.getCustomStatus() === expected) return;
      if (state?.runtimeStatus === WorkflowRuntimeStatus.FAILED) {
        throw new Error(`Workflow ${id} failed: ${JSON.stringify(state.workflowFailureDetails)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Workflow ${id} did not reach '${expected}'`);
  }

  function versions(history: HistoryEvent[]) {
    return history.flatMap((event) =>
      event.eventType.case === "workflowStarted" && event.eventType.value.version
        ? [event.eventType.value.version]
        : [],
    );
  }

  for (const asyncGenerator of [false, true]) {
    minimumDaprRuntime(
      "1.17.0",
      `upgrades old and not-yet-reached instances and persists new-instance patches across worker restarts (async: ${asyncGenerator})`,
      async () => {
        const name = "patchUpgrade";
        function* original(ctx: WorkflowContext, waitBefore: boolean) {
          if (waitBefore) {
            ctx.setCustomStatus("before");
            yield ctx.waitForExternalEvent("before");
          }
          yield ctx.callActivity("original");
          ctx.setCustomStatus("after");
          yield ctx.waitForExternalEvent("after");
          return "original";
        }
        function* upgraded(ctx: WorkflowContext, waitBefore: boolean) {
          if (waitBefore) {
            ctx.setCustomStatus("before");
            yield ctx.waitForExternalEvent("before");
          }
          const patched = ctx.isPatched("validation");
          if (patched) yield ctx.callActivity("validate");
          yield ctx.callActivity("original");
          ctx.setCustomStatus("after");
          yield ctx.waitForExternalEvent("after");
          const repeated = ctx.isPatched("validation");
          yield ctx.createTimer(0.01);
          return { patched, repeated };
        }
        function register(workflow: typeof original | typeof upgraded) {
          const fn: TWorkflow = asyncGenerator
            ? async function* (ctx, input: boolean) {
                return yield* workflow(ctx, input);
              }
            : workflow;
          runtime
            .registerWorkflowByName(name, fn)
            .registerActivityWithName("original", () => "original")
            .registerActivityWithName("validate", () => "validated");
        }
        register(original);
        await runtime.start();
        const passed = await client.scheduleNewWorkflow(name, false);
        const notReached = await client.scheduleNewWorkflow(name, true);
        await Promise.all([waitForStatus(passed, "after"), waitForStatus(notReached, "before")]);
        expect(versions(await client.getWorkflowHistory(passed))).toEqual([]);

        await runtime.stop();
        runtime = newRuntime();
        register(upgraded);
        await runtime.start();
        const fresh = await client.scheduleNewWorkflow(name, false);
        await client.raiseEvent(notReached, "before");
        await Promise.all([waitForStatus(notReached, "after"), waitForStatus(fresh, "after")]);

        // Ensure the enabled decisions really reached durable history before replacing the worker.
        for (const id of [notReached, fresh]) {
          expect(versions(await client.getWorkflowHistory(id)).flatMap((version) => version.patches)).toEqual([
            "validation",
          ]);
        }
        await runtime.stop();
        runtime = newRuntime();
        register(upgraded);
        await runtime.start();
        await Promise.all([passed, notReached, fresh].map((id) => client.raiseEvent(id, "after")));

        for (const id of [passed, notReached, fresh]) {
          const enabled = id !== passed;
          const state = await client.waitForWorkflowCompletion(id, true, 30);
          expect(state?.workflowFailureDetails).toBeUndefined();
          expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
          expect(state?.getOutput()).toEqual({ patched: enabled, repeated: enabled });
          const history = await client.getWorkflowHistory(id);
          const activities = history.flatMap((event) =>
            event.eventType.case === "taskScheduled" ? [event.eventType.value.name] : [],
          );
          expect(activities).toEqual(enabled ? ["validate", "original"] : ["original"]);
          if (enabled) {
            expect(versions(history).flatMap((version) => version.patches)).toEqual(["validation", "validation"]);
          } else {
            expect(versions(history)).toEqual([]);
          }
        }
      },
      120_000,
    );
  }

  minimumDaprRuntime(
    "1.17.0",
    "preserves multiple patch names, case and duplicate order across several turns",
    async () => {
      runtime.registerWorkflowByName("patchSequence", function* (ctx) {
        const decisions: boolean[] = [];
        for (const patch of ["A", "a", "A", "__proto__"]) {
          decisions.push(ctx.isPatched(patch));
          yield ctx.createTimer(0.01);
        }
        return { decisions };
      });
      await runtime.start();
      const id = await client.scheduleNewWorkflow("patchSequence");
      const state = await client.waitForWorkflowCompletion(id, true, 30);
      expect(state?.workflowFailureDetails).toBeUndefined();
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.getOutput()).toEqual({ decisions: [true, true, true, true] });
      expect(versions(await client.getWorkflowHistory(id)).flatMap((version) => version.patches)).toEqual([
        "A",
        "a",
        "A",
        "__proto__",
      ]);
    },
    60_000,
  );

  minimumDaprRuntime(
    "1.17.0",
    "adds patches to an already-versioned instance without changing replayed steps",
    async () => {
      const name = "patchExisting";
      runtime
        .registerWorkflowByName(name, function* (ctx) {
          if (ctx.isPatched("base")) yield ctx.callActivity("base");
          ctx.setCustomStatus("waiting");
          yield ctx.waitForExternalEvent("resume");
        })
        .registerActivityWithName("base", () => "done");
      await runtime.start();
      const id = await client.scheduleNewWorkflow(name);
      await waitForStatus(id, "waiting");
      await runtime.stop();

      runtime = newRuntime();
      runtime
        .registerWorkflowByName(name, function* (ctx) {
          const earlier = ctx.isPatched("inserted-before");
          if (earlier) yield ctx.callActivity("must-not-run");
          if (ctx.isPatched("base")) yield ctx.callActivity("base");
          ctx.setCustomStatus("waiting");
          yield ctx.waitForExternalEvent("resume");
          const later = ctx.isPatched("inserted-after");
          if (later) yield ctx.callActivity("added");
          yield ctx.createTimer(0.01);
          return { earlier, later, repeated: ctx.isPatched("inserted-before") };
        })
        .registerActivityWithName("base", () => "done")
        .registerActivityWithName("added", () => "done");
      await runtime.start();
      await client.raiseEvent(id, "resume");
      const state = await client.waitForWorkflowCompletion(id, true, 30);
      expect(state?.workflowFailureDetails).toBeUndefined();
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.getOutput()).toEqual({ earlier: false, later: true, repeated: false });
      const history = await client.getWorkflowHistory(id);
      expect(versions(history).flatMap((version) => version.patches)).toEqual(["base", "inserted-after"]);
      expect(
        history.flatMap((event) => (event.eventType.case === "taskScheduled" ? [event.eventType.value.name] : [])),
      ).toEqual(["base", "added"]);
    },
    60_000,
  );

  minimumDaprRuntime(
    "1.17.0",
    "starts independent patch history after continueAsNew",
    async () => {
      runtime.registerWorkflowByName("patchContinue", function* (ctx, generation: number) {
        const patch = generation === 0 ? "first-generation" : "second-generation";
        const patched = ctx.isPatched(patch);
        yield ctx.createTimer(0.01);
        if (generation === 0) {
          ctx.continueAsNew(1);
        } else {
          return { generation, patched, repeated: ctx.isPatched(patch) };
        }
      });
      await runtime.start();
      const id = await client.scheduleNewWorkflow("patchContinue", 0);
      const state = await client.waitForWorkflowCompletion(id, true, 30);
      expect(state?.workflowFailureDetails).toBeUndefined();
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.getOutput()).toEqual({ generation: 1, patched: true, repeated: true });
      const recorded = versions(await client.getWorkflowHistory(id));
      expect(recorded.length).toBeGreaterThan(0);
      expect(recorded.some((version) => version.patches.includes("first-generation"))).toBe(false);
      expect(recorded.flatMap((version) => version.patches)).toEqual(["second-generation", "second-generation"]);
    },
    60_000,
  );

  minimumDaprRuntime(
    "1.17.0",
    "reports invalid patch names as workflow failures",
    async () => {
      runtime.registerWorkflowByName("invalidPatch", function* (ctx) {
        ctx.isPatched(" ");
        yield ctx.createTimer(0.01);
      });
      await runtime.start();
      const id = await client.scheduleNewWorkflow("invalidPatch");
      const state = await client.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.FAILED);
      expect(state?.workflowFailureDetails?.getErrorMessage()).toContain("patchName");
      expect(versions(await client.getWorkflowHistory(id))).toEqual([]);
    },
    60_000,
  );
});

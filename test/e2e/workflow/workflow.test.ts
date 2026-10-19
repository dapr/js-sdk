/*
Copyright 2022 The Dapr Authors
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
import { ConnectError } from "@connectrpc/connect";
import DaprWorkflowClient from "../../../src/workflow/client/DaprWorkflowClient";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import WorkflowRuntime from "../../../src/workflow/runtime/WorkflowRuntime";
import { type TWorkflow, WorkflowRuntimeStatus, Task } from "../../../src";
import { getFunctionName } from "../../../src/workflow/internal";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { minimumDaprRuntime } from "../helpers/runtimeVersion";
import { CustomSerializer } from "../../fixtures/CustomSerializer";

describe("workflow", () => {
  let workflowHarness: WorkflowHarness;
  let workflowClient: DaprWorkflowClient;
  let workflowRuntime: WorkflowRuntime;

  beforeAll(async () => {
    workflowHarness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE });
    workflowHarness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
    await workflowHarness.start();
  }, 180 * 1000);

  beforeEach(async () => {
    // Create local SDK instances so the tests exercise this checkout, not the
    // SDK version bundled as a dependency of @dapr/testcontainer-node.
    workflowClient = new DaprWorkflowClient({
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getGrpcPort().toString(),
    });
    workflowRuntime = new WorkflowRuntime({
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getGrpcPort().toString(),
    });
  });

  afterEach(async () => {
    await workflowRuntime.stop();
    await workflowClient.stop();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await workflowHarness.stop();
    });
  });

  const waitForCustomStatus = async (instanceId: string): Promise<string> => {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const state = await workflowClient.getWorkflowState(instanceId, true);
      if (state?.customStatus) {
        return state.customStatus;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Workflow ${instanceId} did not publish custom status before timeout`);
  };

  it("round-trips custom payloads through replay, events, continue-as-new, activities and child workflows", async () => {
    const serializer = new CustomSerializer();
    const options = {
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getGrpcPort().toString(),
      serializer,
    };
    await workflowClient.stop();
    workflowClient = new DaprWorkflowClient(options);
    workflowRuntime = new WorkflowRuntime(options);
    const echo = (_ctx: WorkflowActivityContext, input: bigint) => {
      expect(typeof input).toBe("bigint");
      return input;
    };
    const child: TWorkflow = async (_ctx: WorkflowContext, input: bigint) => {
      expect(typeof input).toBe("bigint");
      return input + 1n;
    };
    const workflow: TWorkflow = function* (
      ctx: WorkflowContext,
      input: { count: bigint; restarted: boolean },
    ): Generator<Task<unknown>, unknown, unknown> {
      expect(typeof input.count).toBe("bigint");
      if (!input.restarted) {
        ctx.setCustomStatus({ waiting: true, count: input.count });
        const delta = (yield ctx.waitForExternalEvent<bigint>("add")) as bigint;
        ctx.continueAsNew({ count: input.count + delta, restarted: true });
        return;
      }
      const count = (yield ctx.callActivity(echo, input.count)) as bigint;
      const result = yield ctx.callChildWorkflow(child, count);
      ctx.setCustomStatus({ result });
      return result;
    };
    workflowRuntime.registerWorkflow(workflow).registerWorkflow(child).registerActivity(echo);
    await workflowRuntime.start();
    const input = { count: 9007199254740993n, restarted: false };
    const id = await workflowClient.scheduleNewWorkflow(workflow, input);
    const started = await workflowClient.waitForWorkflowStart(id, true, 30);
    expect(started?.getInput()).toEqual(input);
    await workflowClient.raiseEvent(id, "add", 2n);
    const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.getOutput<bigint>()).toBe(input.count + 3n);
    expect(state?.serializedOutput).toBe(serializer.serialize(input.count + 3n));
    expect(state?.getCustomStatus()).toEqual({ result: input.count + 3n });
    const fetched = await workflowClient.getWorkflowState(id, true);
    expect(fetched?.getOutput<bigint>()).toBe(input.count + 3n);
  }, 60000);

  it("preserves default JSON omission across workflow inputs, activities, results and custom status", async () => {
    const omitted = { toJSON: () => undefined };
    const activity = () => omitted;
    const workflow: TWorkflow = function* (
      ctx: WorkflowContext,
      input: unknown,
    ): Generator<Task<unknown>, unknown, unknown> {
      expect(input).toBeUndefined();
      ctx.setCustomStatus(omitted);
      expect(yield ctx.callActivity(activity)).toBeUndefined();
      return omitted;
    };
    workflowRuntime.registerWorkflow(workflow).registerActivity(activity);
    await workflowRuntime.start();
    const id = await workflowClient.scheduleNewWorkflow(workflow, omitted);
    const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.getInput()).toBeUndefined();
    expect(state?.getOutput()).toBeUndefined();
    expect(state?.getCustomStatus()).toBeUndefined();
  }, 31000);

  it("should be able to run an empty orchestration", async () => {
    let invoked = false;
    const emptyWorkflow: TWorkflow = async (_: WorkflowContext, __: any) => {
      invoked = true;
    };
    workflowRuntime.registerWorkflow(emptyWorkflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(emptyWorkflow);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(invoked).toBe(true);
    expect(state).toBeDefined();
    expect(state?.name).toEqual(getFunctionName(emptyWorkflow));
    expect(state?.instanceId).toEqual(id);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
  }, 31000);

  it("should signal readiness after connecting and process immediately scheduled work", async () => {
    const echo = (_: WorkflowActivityContext, input: string) => input;
    const workflow: TWorkflow = function* (ctx: WorkflowContext, input: string): any {
      return yield ctx.callActivity(echo, input);
    };
    workflowRuntime.registerWorkflow(workflow).registerActivity(echo);

    await workflowRuntime.start();
    expect(workflowRuntime.isReady).toBe(true);

    const id = await workflowClient.scheduleNewWorkflow(workflow, "ready");
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedOutput).toEqual(JSON.stringify("ready"));
  }, 31000);

  it("should be able to run an activity sequence", async () => {
    const plusOne = async (_: WorkflowActivityContext, input: number) => {
      return input + 1;
    };

    const sequenceWorkflow: TWorkflow = async function* (ctx: WorkflowContext, startVal: number): any {
      const numbers = [startVal];
      let current = startVal;

      for (let i = 0; i < 10; i++) {
        current = yield ctx.callActivity(plusOne, current);
        numbers.push(current);
      }
      ctx.setCustomStatus("foo");
      return numbers;
    };

    workflowRuntime.registerWorkflow(sequenceWorkflow).registerActivity(plusOne);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(sequenceWorkflow, 1);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.name).toEqual(getFunctionName(sequenceWorkflow));
    expect(state?.instanceId).toEqual(id);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedInput).toEqual(JSON.stringify(1));
    expect(state?.serializedOutput).toEqual(JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
    expect(state?.customStatus).toEqual(JSON.stringify("foo"));
  }, 31000);

  it("should be able to run fan-out/fan-in", async () => {
    let activityCounter = 0;

    const incrementActivity = (_: WorkflowActivityContext) => {
      activityCounter++;
    };

    const sequenceWorkflow: TWorkflow = async function* (ctx: WorkflowContext, count: number): any {
      // Fan out to multiple sub-orchestrations
      const tasks: Task<any>[] = [];

      for (let i = 0; i < count; i++) {
        tasks.push(ctx.callActivity(incrementActivity));
      }

      // Wait for all the sub-orchestrations to complete
      yield ctx.whenAll(tasks);
    };

    workflowRuntime.registerWorkflow(sequenceWorkflow).registerActivity(incrementActivity);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(sequenceWorkflow, 10);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 10);

    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(activityCounter).toEqual(10);
  }, 31000);

  it("should be able to use the sub-orchestration", async () => {
    let activityCounter = 0;

    const incrementActivity = (_: WorkflowActivityContext, input: number) => {
      activityCounter++;
      return input + 1;
    };

    const childWorkflow: TWorkflow = async function* (ctx: WorkflowContext, input: number): any {
      return yield ctx.callActivity(incrementActivity, input);
    };

    const parentWorkflow: TWorkflow = async function* (ctx: WorkflowContext, input: number): any {
      return yield ctx.callChildWorkflow(childWorkflow, input);
    };

    workflowRuntime
      .registerActivity(incrementActivity)
      .registerWorkflow(childWorkflow)
      .registerWorkflow(parentWorkflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(parentWorkflow, 10);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(activityCounter).toEqual(1);
    expect(state?.serializedOutput).toEqual(JSON.stringify(11));
  }, 31000);

  it("should allow waiting for multiple external events", async () => {
    const workflow: TWorkflow = async function* (ctx: WorkflowContext, _: any): any {
      const a = yield ctx.waitForExternalEvent("A");
      const b = yield ctx.waitForExternalEvent("B");
      const c = yield ctx.waitForExternalEvent("C");
      return [a, b, c];
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow);
    await Promise.all([
      workflowClient.raiseEvent(id, "A", "a"),
      workflowClient.raiseEvent(id, "B", "b"),
      workflowClient.raiseEvent(id, "C", "c"),
    ]);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedOutput).toEqual(JSON.stringify(["a", "b", "c"]));
  }, 31000);

  it("should be able to run an single timer", async () => {
    const delay = 3;
    const singleTimerWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _: number): any {
      // seems there is a issue from durabletask-sidecar.
      // TODO: Once transfer to durabletask-go, reset the timer
      yield ctx.createTimer(delay + 1);
    };

    workflowRuntime.registerWorkflow(singleTimerWorkflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(singleTimerWorkflow);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.name).toEqual(getFunctionName(singleTimerWorkflow));
    expect(state?.instanceId).toEqual(id);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.createdAt).toBeDefined();
    expect(state?.lastUpdatedAt).toBeDefined();
  }, 31000);

  it("should wait for external events with a timeout - true", async () => {
    const workflow: TWorkflow = async function* (ctx: WorkflowContext, _: any): any {
      const approval = ctx.waitForExternalEvent("Approval");
      const timeout = ctx.createTimer(10);
      const winner = yield ctx.whenAny([approval, timeout]);

      if (winner == approval) {
        return "approved";
      } else {
        return "timed out";
      }
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow);
    await workflowClient.waitForWorkflowStart(id, false, 30);
    await workflowClient.raiseEvent(id, "Approval");

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedOutput).toEqual(JSON.stringify("approved"));
  }, 31000);

  it("should wait for external events with a timeout - false", async () => {
    const workflow: TWorkflow = async function* (ctx: WorkflowContext, _: any): any {
      const approval = ctx.waitForExternalEvent("Approval");
      const timeout = ctx.createTimer(3);
      const winner = yield ctx.whenAny([approval, timeout]);

      if (winner == approval) {
        return "approved";
      } else {
        return "timed out";
      }
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow);

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedOutput).toEqual(JSON.stringify("timed out"));
  }, 31000);

  it("should preserve deterministic values when replaying after an external event", async () => {
    const workflow: TWorkflow = async function* (ctx: WorkflowContext): any {
      const getDeterministicValues = () => ({
        firstGuid: ctx.newGuid(),
        secondGuid: ctx.newGuid(),
        currentTime: ctx.getCurrentUtcDateTime().toISOString(),
      });
      const initialValues = getDeterministicValues();
      ctx.setCustomStatus(initialValues);
      yield ctx.waitForExternalEvent("continue");
      return initialValues;
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow);
    await workflowClient.waitForWorkflowStart(id, false, 30);
    const initialValues = JSON.parse(await waitForCustomStatus(id));
    await workflowClient.raiseEvent(id, "continue");

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.workflowFailureDetails).toBeUndefined();
    const output = JSON.parse(state?.serializedOutput ?? "{}");
    expect(output).toEqual(initialValues);
  }, 31000);

  it("should report activity failures on the failed workflow state", async () => {
    const failingActivity = () => {
      throw new Error("expected activity failure");
    };
    const workflow: TWorkflow = async function* (ctx: WorkflowContext): any {
      yield ctx.callActivity(failingActivity);
    };

    workflowRuntime.registerWorkflow(workflow).registerActivity(failingActivity);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.FAILED);
    expect(state?.workflowFailureDetails?.getErrorType()).toEqual("TaskFailedError");
    expect(state?.workflowFailureDetails?.getErrorMessage()).toContain("expected activity failure");
  }, 31000);

  it("should be able to suspend and resume an orchestration", async () => {
    const workflow: TWorkflow = async function* (ctx: WorkflowContext, _: any): any {
      const res = yield ctx.waitForExternalEvent("my_event");
      return res;
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow);
    let state = await workflowClient.waitForWorkflowStart(id, undefined, 30);
    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.RUNNING);

    // Suspend the workflow and confirm it enters the SUSPENDED state.
    await workflowClient.suspendWorkflow(id);
    state = await workflowClient.getWorkflowState(id, false);
    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.SUSPENDED);

    // Resume the workflow and confirm it returns to the RUNNING state.
    await workflowClient.resumeWorkflow(id);
    state = await workflowClient.getWorkflowState(id, false);
    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.RUNNING);

    // Unblock the workflow by raising the awaited event.
    await workflowClient.raiseEvent(id, "my_event", "hello");
    state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedOutput).toEqual(JSON.stringify("hello"));
  }, 31000);

  it("should be able to terminate an orchestration", async () => {
    const workflow: TWorkflow = async function* (ctx: WorkflowContext, _: any): any {
      const res = yield ctx.waitForExternalEvent("my_event");
      return res;
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow);
    let state = await workflowClient.waitForWorkflowStart(id, undefined, 30);
    expect(state);
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.RUNNING);

    await workflowClient.terminateWorkflow(id, "some reason for termination");
    state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.TERMINATED);
    expect(state?.serializedOutput).toEqual(JSON.stringify("some reason for termination"));
  }, 31000);

  it("should allow to continue as new", async () => {
    const workflow: TWorkflow = async (ctx: WorkflowContext, input: number) => {
      if (input < 10) {
        ctx.continueAsNew(input + 1, true);
      } else {
        return input;
      }
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow, 1);

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedOutput).toEqual(JSON.stringify(10));
  }, 31000);

  it("should preserve buffered external events when continuing as new by default", async () => {
    const workflow: TWorkflow = async function* (ctx: WorkflowContext, step: number): any {
      if (step === 0) {
        yield ctx.waitForExternalEvent("continue");
        ctx.continueAsNew(1);
        return;
      }

      return yield ctx.waitForExternalEvent("buffered");
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow, 0);
    await workflowClient.raiseEvent(id, "buffered", "preserved");
    await workflowClient.raiseEvent(id, "continue", "continue");

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedOutput).toEqual(JSON.stringify("preserved"));
  }, 31000);

  it("should be able to run an single orchestration without activity", async () => {
    const workflow: TWorkflow = async (_: WorkflowContext, startVal: number) => {
      return startVal + 1;
    };

    workflowRuntime.registerWorkflow(workflow);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow, 15);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.name).toEqual(getFunctionName(workflow));
    expect(state?.instanceId).toEqual(id);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedInput).toEqual(JSON.stringify(15));
    expect(state?.serializedOutput).toEqual(JSON.stringify(16));
  }, 31000);

  minimumDaprRuntime(
    "1.17.0",
    "should list instances, return history, and rerun from an event",
    async () => {
      const echoActivity = (_: WorkflowActivityContext, input: { value: string }) => input;
      const workflow: TWorkflow = async function* (ctx: WorkflowContext, input: { value: string }): any {
        return yield ctx.callActivity(echoActivity, input);
      };
      const instanceId = `management-source-${Date.now()}`;
      const rerunInstanceId = `management-rerun-${Date.now()}`;

      workflowRuntime.registerWorkflow(workflow).registerActivity(echoActivity);
      await workflowRuntime.start();

      const startedId = await workflowClient.scheduleNewWorkflow(workflow, { value: "original" }, instanceId);
      const completedState = await workflowClient.waitForWorkflowCompletion(startedId, undefined, 30);
      expect(completedState?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
      expect(completedState?.serializedOutput).toEqual(JSON.stringify({ value: "original" }));

      const history = await workflowClient.getWorkflowHistory(instanceId);
      const scheduledEvent = history.find((event) => event.eventType.case === "taskScheduled");
      expect(history.length).toBeGreaterThan(0);
      expect(scheduledEvent).toBeDefined();
      expect(scheduledEvent?.eventType).toMatchObject({
        case: "taskScheduled",
        value: { input: JSON.stringify({ value: "original" }) },
      });

      const invalidEventId = Math.max(...history.map((event) => event.eventId)) + 1;
      const invalidRerunId = `management-invalid-${Date.now()}`;
      await expect(
        workflowClient.rerunWorkflowFromEvent(instanceId, invalidEventId, { newInstanceId: invalidRerunId }),
      ).rejects.toBeInstanceOf(ConnectError);
      expect(await workflowClient.getWorkflowState(invalidRerunId, true)).toBeUndefined();

      const rerunId = await workflowClient.rerunWorkflowFromEvent(instanceId, scheduledEvent!.eventId, {
        newInstanceId: rerunInstanceId,
        input: { value: "rerun" },
      });
      expect(rerunId).toEqual(rerunInstanceId);

      const rerunState = await workflowClient.waitForWorkflowCompletion(rerunId, undefined, 30);
      expect(rerunState?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
      expect(rerunState?.serializedOutput).toEqual(JSON.stringify({ value: "rerun" }));
      expect((await workflowClient.getWorkflowState(instanceId, true))?.serializedOutput).toEqual(
        JSON.stringify({ value: "original" }),
      );

      const listedIds: string[] = [];
      let continuationToken: string | undefined;
      do {
        const page = await workflowClient.listWorkflowInstanceIds(continuationToken, 1);
        listedIds.push(...page.instanceIds);
        continuationToken = page.continuationToken;
      } while (continuationToken);

      expect(listedIds).toContain(instanceId);
      expect(listedIds).toContain(rerunInstanceId);
    },
    65000,
  );

  minimumDaprRuntime(
    "1.17.0",
    "should reject history and rerun requests for missing instances",
    async () => {
      await workflowRuntime.start();
      const missingId = `missing-history-${Date.now()}`;
      const rerunId = `missing-source-rerun-${Date.now()}`;
      await expect(workflowClient.getWorkflowHistory(missingId)).rejects.toBeInstanceOf(ConnectError);
      await expect(
        workflowClient.rerunWorkflowFromEvent(missingId, 0, { newInstanceId: rerunId }),
      ).rejects.toBeInstanceOf(ConnectError);
      expect(await workflowClient.getWorkflowState(rerunId, true)).toBeUndefined();
    },
    31000,
  );

  for (const { name, options, expectedOutput } of [
    { name: "original input and a generated ID", options: undefined, expectedOutput: { value: "original" } },
    { name: "explicit null input", options: { input: null }, expectedOutput: null },
    { name: "false input", options: { input: false }, expectedOutput: false },
    { name: "zero input", options: { input: 0 }, expectedOutput: 0 },
    { name: "empty string input", options: { input: "" }, expectedOutput: "" },
    { name: "cleared input", options: { overwriteInput: true }, expectedOutput: undefined },
    {
      name: "original input when overwrite is disabled",
      options: { input: { value: "ignored" }, overwriteInput: false },
      expectedOutput: { value: "original" },
    },
  ]) {
    minimumDaprRuntime(
      "1.17.0",
      `should rerun with ${name}`,
      async () => {
        const echoActivity = (_: WorkflowActivityContext, input: unknown) => ({ received: input });
        const workflow: TWorkflow = async function* (ctx: WorkflowContext, input: unknown): any {
          return yield ctx.callActivity(echoActivity, input);
        };
        workflowRuntime.registerWorkflow(workflow).registerActivity(echoActivity);
        await workflowRuntime.start();

        const sourceId = await workflowClient.scheduleNewWorkflow(workflow, { value: "original" });
        const sourceState = await workflowClient.waitForWorkflowCompletion(sourceId, true, 30);
        expect(sourceState?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        const history = await workflowClient.getWorkflowHistory(sourceId);
        const scheduledEvent = history.find((event) => event.eventType.case === "taskScheduled");
        expect(scheduledEvent).toBeDefined();

        const rerunId = await workflowClient.rerunWorkflowFromEvent(sourceId, scheduledEvent!.eventId, options);
        expect(rerunId).not.toBe("");
        expect(rerunId).not.toBe(sourceId);
        const state = await workflowClient.waitForWorkflowCompletion(rerunId, true, 30);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(state?.serializedOutput).toBe(JSON.stringify({ received: expectedOutput }));
      },
      65000,
    );
  }

  it("should support explicitly named workflows and activities", async () => {
    const plusOne = (_: WorkflowActivityContext, input: number) => input + 1;
    const workflow: TWorkflow = async function* (ctx: WorkflowContext, input: number): any {
      return yield ctx.callActivity("namedPlusOne", input);
    };

    workflowRuntime.registerActivityWithName("namedPlusOne", plusOne).registerWorkflowByName("namedWorkflow", workflow);
    await workflowRuntime.start();

    const instanceId = `named-workflow-${Date.now()}`;
    const id = await workflowClient.scheduleNewWorkflow("namedWorkflow", 41, instanceId);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(id).toEqual(instanceId);
    expect(state?.name).toEqual("namedWorkflow");
    expect(state?.instanceId).toEqual(instanceId);
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedInput).toEqual(JSON.stringify(41));
    expect(state?.serializedOutput).toEqual(JSON.stringify(42));
  }, 31000);

  it("should be able to purge orchestration by id", async () => {
    const plusOneActivity = async (_: WorkflowActivityContext, input: number) => {
      return input + 1;
    };

    const workflow: TWorkflow = async function* (ctx: WorkflowContext, startVal: number): any {
      return yield ctx.callActivity(plusOneActivity, startVal);
    };

    workflowRuntime.registerWorkflow(workflow).registerActivity(plusOneActivity);
    await workflowRuntime.start();

    const id = await workflowClient.scheduleNewWorkflow(workflow, 1);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.name).toEqual(getFunctionName(workflow));
    expect(state?.instanceId).toEqual(id);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.serializedInput).toEqual(JSON.stringify(1));
    expect(state?.serializedOutput).toEqual(JSON.stringify(2));

    const purgeResult = await workflowClient.purgeWorkflow(id);
    expect(purgeResult).toEqual(true);
    expect(await workflowClient.getWorkflowState(id, false)).toBeUndefined();
  }, 31000);
});

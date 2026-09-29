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
import DaprWorkflowClient from "../../../src/workflow/client/DaprWorkflowClient";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import WorkflowRuntime from "../../../src/workflow/runtime/WorkflowRuntime";
import { TWorkflow } from "../../../src/types/workflow/Workflow.type";
import { getFunctionName } from "../../../src/workflow/internal";
import { WorkflowRuntimeStatus } from "../../../src/workflow/runtime/WorkflowRuntimeStatus";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";
import { Task } from "../../../src/workflow/engine/task/Task";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

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

    const workflowStartTime = Date.now();
    const id = await workflowClient.scheduleNewWorkflow(singleTimerWorkflow);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.name).toEqual(getFunctionName(singleTimerWorkflow));
    expect(state?.instanceId).toEqual(id);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.createdAt).toBeDefined();
    expect(state?.lastUpdatedAt).toBeDefined();
    expect(Date.now() - workflowStartTime).toBeGreaterThanOrEqual((delay + 1) * 1000);
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

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

import DaprWorkflowClient from "../../../src/workflow/client/DaprWorkflowClient";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import WorkflowRuntime from "../../../src/workflow/runtime/WorkflowRuntime";
import { TWorkflow } from "../../../src/types/workflow/Workflow.type";
import { getFunctionName } from "../../../src/workflow/internal";
import { WorkflowRuntimeStatus } from "../../../src/workflow/runtime/WorkflowRuntimeStatus";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";
import { Task } from "@microsoft/durabletask-js/task/task";

const clientHost = "localhost";
const clientPort = "4001";

describe("Workflow", () => {
  let workflowClient: DaprWorkflowClient;
  let workflowRuntime: WorkflowRuntime;

  beforeEach(async () => {
    // Start a worker, which will connect to the sidecar in a background thread
    workflowClient = new DaprWorkflowClient({
      daprHost: clientHost,
      daprPort: clientPort,
    });
    workflowRuntime = new WorkflowRuntime({
      daprHost: clientHost,
      daprPort: clientPort,
    });
  });

  afterEach(async () => {
    await workflowRuntime.stop();
    await workflowClient.stop();
  });

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

    const incrementActivity = (_: WorkflowActivityContext) => {
      activityCounter++;
    };

    const childWorkflow: TWorkflow = async function* (ctx: WorkflowContext): any {
      yield ctx.callActivity(incrementActivity);
    };

    const parentWorkflow: TWorkflow = async function* (ctx: WorkflowContext): any {
      // Call sub-orchestration
      yield ctx.callSubWorkflow(childWorkflow);
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

    // Send events to the client immediately
    const id = await workflowClient.scheduleNewWorkflow(workflow);
    workflowClient.raiseEvent(id, "A", "a");
    workflowClient.raiseEvent(id, "B", "b");
    workflowClient.raiseEvent(id, "C", "c");
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

    let expectedCompletionSecond = state?.createdAt?.getTime() ?? 0;
    if (state && state.createdAt !== undefined) {
      expectedCompletionSecond += delay * 1000;
    }
    expect(expectedCompletionSecond).toBeDefined();
    const actualCompletionSecond = state?.lastUpdatedAt?.getTime() ?? 0;
    expect(actualCompletionSecond).toBeDefined();

    expect(state).toBeDefined();
    expect(state?.name).toEqual(getFunctionName(singleTimerWorkflow));
    expect(state?.instanceId).toEqual(id);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.createdAt).toBeDefined();
    expect(state?.lastUpdatedAt).toBeDefined();
    expect(expectedCompletionSecond).toBeLessThanOrEqual(actualCompletionSecond);
  }, 31000);

  it("should wait for external events with a timeout - true", async () => {
    const shouldRaiseEvent = true;
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

    // Send events to the client immediately
    const id = await workflowClient.scheduleNewWorkflow(workflow);

    if (shouldRaiseEvent) {
      workflowClient.raiseEvent(id, "Approval");
    }

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state);
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);

    if (shouldRaiseEvent) {
      expect(state?.serializedOutput).toEqual(JSON.stringify("approved"));
    } else {
      expect(state?.serializedOutput).toEqual(JSON.stringify("timed out"));
    }
  }, 31000);

  it("should wait for external events with a timeout - false", async () => {
    const shouldRaiseEvent = false;
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

    // Send events to the client immediately
    const id = await workflowClient.scheduleNewWorkflow(workflow);

    if (shouldRaiseEvent) {
      workflowClient.raiseEvent(id, "Approval");
    }

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    expect(state).toBeDefined();
    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);

    if (shouldRaiseEvent) {
      expect(state?.serializedOutput).toEqual(JSON.stringify("approved"));
    } else {
      expect(state?.serializedOutput).toEqual(JSON.stringify("timed out"));
    }
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
  }, 31000);
});

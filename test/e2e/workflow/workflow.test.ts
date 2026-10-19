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
import { type TWorkflow, WorkflowRuntimeStatus, Task, WorkflowFailureDetails } from "../../../src";
import { getFunctionName } from "../../../src/workflow/internal";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { minimumDaprRuntime } from "../helpers/runtimeVersion";

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

  for (const explicitName of [false, true]) {
    minimumDaprRuntime(
      "1.17.0",
      `exposes workflow names and activity execution keys through real execution and replay (explicit name: ${explicitName})`,
      async () => {
        const inspect = (ctx: WorkflowActivityContext) => ({
          instanceId: ctx.getWorkflowInstanceId(),
          taskId: ctx.getWorkflowActivityId(),
          executionKey: ctx.getTaskExecutionId(),
        });
        const workflow: TWorkflow = function* contextWorkflow(ctx: WorkflowContext, input: unknown): any {
          const nameBefore = ctx.getWorkflowName();
          const first = yield ctx.callActivity(inspect);
          const nameAfter = ctx.getWorkflowName();
          const second = yield ctx.callActivity(inspect);
          ctx.setCustomStatus({ phase: "done", name: ctx.getWorkflowName() });
          return { input, nameBefore, nameAfter, nameAtEnd: ctx.getWorkflowName(), first, second };
        };
        const name = explicitName ? "explicit-context-name" : getFunctionName(workflow);
        if (explicitName) workflowRuntime.registerWorkflowByName(name, workflow);
        else workflowRuntime.registerWorkflow(workflow);
        workflowRuntime.registerActivity(inspect);
        await workflowRuntime.start();

        const input = { items: [1, false, null, ""] };
        const id = await workflowClient.scheduleNewWorkflow(name, input);
        const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
        expect(state?.exists).toBe(true);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(state?.getInput<typeof input>()).toEqual(input);
        const output = state?.getOutput<{
          input: typeof input;
          nameBefore: string;
          nameAfter: string;
          nameAtEnd: string;
          first: ReturnType<typeof inspect>;
          second: ReturnType<typeof inspect>;
        }>();
        expect(output).toMatchObject({ input, nameBefore: name, nameAfter: name, nameAtEnd: name });
        expect(output?.first.instanceId).toBe(id);
        expect(output?.second.instanceId).toBe(id);
        expect(output?.first.taskId).not.toBe(output?.second.taskId);
        const history = await workflowClient.getWorkflowHistory(id);
        const scheduledKeys = new Map<number, string | undefined>();
        for (const event of history) {
          if (event.eventType.case === "taskScheduled") {
            scheduledKeys.set(event.eventId, event.eventType.value.taskExecutionId || undefined);
          }
        }
        expect(scheduledKeys.size).toBe(2);
        expect(scheduledKeys.has(output!.first.taskId)).toBe(true);
        expect(scheduledKeys.has(output!.second.taskId)).toBe(true);
        expect(output?.first.executionKey).toBe(scheduledKeys.get(output!.first.taskId));
        expect(output?.second.executionKey).toBe(scheduledKeys.get(output!.second.taskId));
        expect(state?.getCustomStatus<{ phase: string; name: string }>()).toEqual({ phase: "done", name });
        expect(state?.serializedInput).toBe(JSON.stringify(input));
        expect(state?.serializedOutput).toBe(JSON.stringify(output));
        expect(state?.customStatus).toBe(JSON.stringify({ phase: "done", name }));

        expect(await workflowClient.purgeWorkflow(id)).toBe(true);
        const missing = await workflowClient.getWorkflowState(id, true);
        expect(missing).toBeUndefined();
        expect(missing?.exists ?? false).toBe(false);
        expect(state?.exists).toBe(true);
      },
      31000,
    );
  }

  minimumDaprRuntime(
    "1.17.0",
    "persists nonempty activity execution IDs across fan-out, replay, activity requests and completions",
    async () => {
      const observed: { replaying: boolean; keys: (string | undefined)[] }[] = [];
      const inspectExecution = (ctx: WorkflowActivityContext, input: number) => ({
        input,
        taskId: ctx.getWorkflowActivityId(),
        key: ctx.getTaskExecutionId(),
      });
      const workflow: TWorkflow = function* (ctx: WorkflowContext): any {
        const tasks = [ctx.callActivity(inspectExecution, 1), ctx.callActivity(inspectExecution, 2)];
        const before = tasks.map((task) => task.executionId);
        observed.push({ replaying: ctx.isReplaying(), keys: before });
        const results = yield ctx.whenAll(tasks);
        return { before, after: tasks.map((task) => task.executionId), results };
      };
      workflowRuntime.registerWorkflow(workflow).registerActivity(inspectExecution);
      await workflowRuntime.start();
      const id = await workflowClient.scheduleNewWorkflow(workflow);
      const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      const output = state?.getOutput<{
        before: string[];
        after: string[];
        results: ReturnType<typeof inspectExecution>[];
      }>();
      expect(output).toBeDefined();
      expect(output!.before).toHaveLength(2);
      expect(new Set(output!.before).size).toBe(2);
      for (const key of output!.before) {
        expect(key).toMatch(/^[0-9a-f-]{36}$/);
      }
      expect(output!.after).toEqual(output!.before);
      expect(output!.results.map((value) => value.input)).toEqual([1, 2]);
      expect(output!.results.map((value) => value.key)).toEqual(output!.before);
      expect(observed.some((value) => value.replaying)).toBe(true);
      for (const observation of observed) {
        expect(observation.keys).toEqual(output!.before);
      }
      const history = await workflowClient.getWorkflowHistory(id);
      for (const [index, activity] of output!.results.entries()) {
        const scheduled = history.find(
          (event) => event.eventType.case === "taskScheduled" && event.eventId === activity.taskId,
        );
        const completed = history.find(
          (event) =>
            event.eventType.case === "taskCompleted" && event.eventType.value.taskScheduledId === activity.taskId,
        );
        expect(scheduled?.eventType.value).toMatchObject({ taskExecutionId: output!.before[index] });
        expect(completed?.eventType.value).toMatchObject({ taskExecutionId: output!.before[index] });
      }
    },
    31000,
  );

  minimumDaprRuntime(
    "1.17.0",
    "preserves one activity execution ID across failed and successful retry attempts",
    async () => {
      const attempts: { taskId: number; key: string | undefined }[] = [];
      const flakyActivity = (ctx: WorkflowActivityContext) => {
        attempts.push({ taskId: ctx.getWorkflowActivityId(), key: ctx.getTaskExecutionId() });
        if (attempts.length === 1) throw new Error("transient execution-ID test failure");
        return ctx.getTaskExecutionId();
      };
      const workflow: TWorkflow = function* (ctx: WorkflowContext): any {
        const task = ctx.callActivity(flakyActivity, undefined, {
          retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
        });
        const before = task.executionId;
        const activityKey = yield task;
        return { before, after: task.executionId, activityKey };
      };
      workflowRuntime.registerWorkflow(workflow).registerActivity(flakyActivity);
      await workflowRuntime.start();
      const id = await workflowClient.scheduleNewWorkflow(workflow);
      const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      const output = state?.getOutput<{ before: string; after: string; activityKey: string }>();
      expect(output?.before).toMatch(/^[0-9a-f-]{36}$/);
      expect(output).toEqual({ before: output!.before, after: output!.before, activityKey: output!.before });
      expect(attempts).toHaveLength(2);
      expect(attempts[0].taskId).not.toBe(attempts[1].taskId);
      expect(attempts.map((attempt) => attempt.key)).toEqual([output!.before, output!.before]);
      const history = await workflowClient.getWorkflowHistory(id);
      const activityEvents = history.filter(
        (event) =>
          event.eventType.case === "taskScheduled" ||
          event.eventType.case === "taskCompleted" ||
          event.eventType.case === "taskFailed",
      );
      expect(activityEvents.map((event) => event.eventType.case).sort()).toEqual([
        "taskCompleted",
        "taskFailed",
        "taskScheduled",
        "taskScheduled",
      ]);
      for (const event of activityEvents) {
        expect(event.eventType.value).toMatchObject({ taskExecutionId: output!.before });
      }
    },
    31000,
  );

  minimumDaprRuntime(
    "1.17.0",
    "assigns different activity execution IDs across continue-as-new with the same instance and task IDs",
    async () => {
      const inspectGeneration = (ctx: WorkflowActivityContext) => ({
        instanceId: ctx.getWorkflowInstanceId(),
        taskId: ctx.getWorkflowActivityId(),
        key: ctx.getTaskExecutionId(),
      });
      type Generation = ReturnType<typeof inspectGeneration>;
      const workflow: TWorkflow = function* (ctx: WorkflowContext, previous?: Generation): any {
        const task = ctx.callActivity(inspectGeneration);
        const before = task.executionId;
        const current: Generation = yield task;
        if (!previous) {
          ctx.continueAsNew(current);
          return;
        }
        return { previous, current, before, after: task.executionId };
      };
      workflowRuntime.registerWorkflow(workflow).registerActivity(inspectGeneration);
      await workflowRuntime.start();
      const id = await workflowClient.scheduleNewWorkflow(workflow);
      const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      const output = state?.getOutput<{ previous: Generation; current: Generation; before: string; after: string }>();
      expect(output?.previous.instanceId).toBe(id);
      expect(output?.current.instanceId).toBe(id);
      expect(output?.previous.taskId).toBe(output?.current.taskId);
      expect(output?.previous.key).toMatch(/^[0-9a-f-]{36}$/);
      expect(output?.current.key).toMatch(/^[0-9a-f-]{36}$/);
      expect(output?.current.key).not.toBe(output?.previous.key);
      expect(output?.before).toBe(output?.current.key);
      expect(output?.after).toBe(output?.current.key);
    },
    31000,
  );

  it.each([false, 0, "", null])(
    "preserves falsy JSON values in typed state accessors (%s)",
    async (value) => {
      const echo = (_ctx: WorkflowActivityContext, input: unknown) => ({ value: input });
      const workflow: TWorkflow = function* (ctx: WorkflowContext, input: unknown): any {
        yield ctx.callActivity(echo, input);
        ctx.setCustomStatus(input);
        return input;
      };
      workflowRuntime.registerWorkflow(workflow).registerActivity(echo);
      await workflowRuntime.start();
      const id = await workflowClient.scheduleNewWorkflow(workflow, value);
      const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.getInput()).toBe(value);
      // Preserve the engine's existing omission of null output and custom status.
      expect(state?.getOutput()).toBe(value === null ? undefined : value);
      expect(state?.getCustomStatus()).toBe(value === null ? undefined : value);
    },
    31000,
  );

  it("preserves recursively wrapped activity failures through a child and parent workflow", async () => {
    const fail = () => {
      throw new TypeError("nested activity failure");
    };
    const child: TWorkflow = function* (ctx: WorkflowContext): any {
      return yield ctx.callActivity(fail);
    };
    const parent: TWorkflow = function* (ctx: WorkflowContext): any {
      return yield ctx.callChildWorkflow(child);
    };
    workflowRuntime.registerWorkflow(parent).registerWorkflow(child).registerActivity(fail);
    await workflowRuntime.start();
    const id = await workflowClient.scheduleNewWorkflow(parent);
    const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.FAILED);
    expect(state?.exists).toBe(true);
    const outer = state?.workflowFailureDetails;
    expect(outer).toBeInstanceOf(WorkflowFailureDetails);
    const childFailure = outer?.getInnerFailure();
    expect(childFailure).toBeInstanceOf(WorkflowFailureDetails);
    const root = childFailure?.getInnerFailure();
    expect(root).toBeInstanceOf(WorkflowFailureDetails);
    expect(root?.getErrorType()).toBe("TypeError");
    expect(root?.getErrorMessage()).toBe("nested activity failure");
    expect(root?.getStackTrace()).toContain("nested activity failure");
    expect(root?.getInnerFailure()).toBeUndefined();
    expect(outer?.innerFailure?.innerFailure?.errorMessage).toBe("nested activity failure");
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

  it.each(["event", "timer"])(
    "should expose COMPLETED through getWorkflowState after an activity and whenAny resolves via %s",
    async (winner) => {
      const setupActivity = (_: WorkflowActivityContext, jobName: string) => jobName;
      const workflow: TWorkflow = async function* (
        ctx: WorkflowContext,
        jobName: string,
      ): AsyncGenerator<Task<unknown>, string, unknown> {
        yield ctx.callActivity(setupActivity, jobName);
        const eventTask = ctx.waitForExternalEvent(`job-done:${jobName}`);
        const timerTask = ctx.createTimer(winner === "event" ? 30 : 1);
        ctx.setCustomStatus("waiting");
        const completedTask = yield ctx.whenAny([eventTask, timerTask]);
        return completedTask === eventTask ? "completed" : "timeout";
      };

      workflowRuntime.registerWorkflow(workflow).registerActivity(setupActivity);
      await workflowRuntime.start();
      const id = await workflowClient.scheduleNewWorkflow(workflow, "test-job-734");

      const readyDeadline = Date.now() + 10_000;
      let state = await workflowClient.getWorkflowState(id, true);
      while (state?.customStatus !== JSON.stringify("waiting") && Date.now() < readyDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        state = await workflowClient.getWorkflowState(id, true);
      }
      expect(state?.customStatus).toEqual(JSON.stringify("waiting"));

      const completionDeadline = Date.now() + 2000;
      if (winner === "event") {
        await workflowClient.raiseEvent(id, "job-done:test-job-734", { success: true });
      }
      do {
        state = await workflowClient.getWorkflowState(id, true);
        if (state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      } while (Date.now() < completionDeadline);

      expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.serializedOutput).toEqual(JSON.stringify(winner === "event" ? "completed" : "timeout"));
      expect(Date.now()).toBeLessThanOrEqual(completionDeadline);
    },
    15_000,
  );

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
      return yield ctx.waitForExternalEvent("my_event");
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
      return yield ctx.waitForExternalEvent("my_event");
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

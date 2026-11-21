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

import { create } from "@bufbuild/protobuf";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { OrchestrationRuntimeContext } from "../../../src/workflow/engine/context/OrchestrationRuntimeContext";
import { OrchestrationExecutor } from "../../../src/workflow/engine/worker/OrchestrationExecutor";
import { Registry } from "../../../src/workflow/engine/worker/Registry";
import {
  newExecutionStartedEvent,
  newFailureDetails,
  newTaskFailedEvent,
  newTaskScheduledEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
  timestampToDate,
} from "../../../src/workflow/engine/worker/protoHelpers";
import type { RetryPolicy } from "../../../src/types/workflow/RetryPolicy.type";

describe("workflow retry policies", () => {
  const policy: RetryPolicy = {
    firstRetryInterval: 2,
    maxNumberOfAttempts: 3,
    backoffCoefficient: 2,
    maxRetryInterval: 3,
  };

  it("retries a failed activity with deterministic exponential delays and returns its result", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");
    const task = context.callActivity("activity", { value: 42 }, { retryPolicy: policy });

    const firstAction = Object.values(context._pendingActions)[0];
    if (firstAction.workflowActionType.case !== "scheduleTask") {
      throw new Error("Expected a scheduled activity action");
    }
    expect(firstAction.workflowActionType.value).toMatchObject({
      name: "activity",
      input: JSON.stringify({ value: 42 }),
    });

    context._pendingActions = {};
    context._pendingTasks[1].fail("first failure", newFailureDetails(new Error("first failure")));
    const firstTimer = Object.values(context._pendingActions)[0];
    if (firstTimer.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a retry timer action");
    }
    expect(
      timestampToDate(firstTimer.workflowActionType.value.fireAt).getTime() - context.currentUtcDateTime.getTime(),
    ).toBe(2000);
    context.currentUtcDateTime = timestampToDate(firstTimer.workflowActionType.value.fireAt);
    context._pendingActions = {};
    const firstTimerTask = context._pendingTasks[2];
    expect(firstTimerTask).toBeDefined();

    firstTimerTask.complete(undefined);
    const secondAction = Object.values(context._pendingActions)[0];
    if (secondAction.workflowActionType.case !== "scheduleTask") {
      throw new Error("Expected a scheduled activity action");
    }
    expect(secondAction.workflowActionType.value.name).toBe("activity");

    context._pendingActions = {};
    context._pendingTasks[3].fail("second failure", newFailureDetails(new Error("second failure")));
    const secondTimer = Object.values(context._pendingActions)[0];
    if (secondTimer.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a retry timer action");
    }
    expect(
      timestampToDate(secondTimer.workflowActionType.value.fireAt).getTime() - context.currentUtcDateTime.getTime(),
    ).toBe(3000);
    context._pendingActions = {};

    context._pendingTasks[4].complete(undefined);
    context._pendingActions = {};
    context._pendingTasks[5].complete("success");

    expect(task.isComplete).toBe(true);
    expect(task.getResult()).toBe("success");
  });

  it("fails after the configured maximum number of attempts", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");
    const task = context.callActivity("activity", undefined, {
      retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
    });
    const failure = newFailureDetails(new Error("final failure"));

    context._pendingTasks[1].fail("first failure", newFailureDetails(new Error("first failure")));
    context._pendingActions = {};
    context._pendingTasks[2].complete(undefined);
    context._pendingActions = {};
    context._pendingTasks[3].fail("final failure", failure);

    expect(task.isFailed).toBe(true);
    expect(task.getException().message).toContain("final failure");
    expect(Object.values(context._pendingActions)).toHaveLength(0);
  });

  it("uses the requested child instance ID for the first attempt and a deterministic ID for retries", () => {
    const context = new OrchestrationRuntimeContext("parent-id");
    context.callSubOrchestrator("child", { value: 42 }, "requested-child-id", {
      retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
    });

    const firstAction = Object.values(context._pendingActions)[0];
    if (firstAction.workflowActionType.case !== "createChildWorkflow") {
      throw new Error("Expected a child workflow action");
    }
    expect(firstAction.workflowActionType.value.instanceId).toBe("requested-child-id");

    context._pendingActions = {};
    context._pendingTasks[1].fail("first failure", newFailureDetails(new Error("first failure")));
    const timer = Object.values(context._pendingActions)[0];
    if (timer.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a retry timer action");
    }
    expect(timer.workflowActionType.value.origin).toMatchObject({
      case: "childWorkflowRetry",
      value: { instanceId: "requested-child-id" },
    });
    context._pendingActions = {};
    context._pendingTasks[2].complete(undefined);

    const retryAction = Object.values(context._pendingActions)[0];
    if (retryAction.workflowActionType.case !== "createChildWorkflow") {
      throw new Error("Expected a retried child workflow action");
    }
    expect(retryAction.workflowActionType.value.instanceId).toBe("parent-id:0003");
    expect(retryAction.workflowActionType.value.retryParentInstanceInfo?.instanceID).toBe("requested-child-id");
    expect(retryAction.workflowActionType.value.input).toBe(JSON.stringify({ value: 42 }));
  });

  it("recreates the same retry timer when replaying identical history", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("retryWorkflow", function* (context) {
      yield context.callActivity("activity", undefined, {
        retryPolicy: { firstRetryInterval: 2, maxNumberOfAttempts: 3 },
      });
    });
    const executor = new OrchestrationExecutor(registry);
    const executionStarted = newExecutionStartedEvent("retryWorkflow", "workflow-id");
    const taskScheduled = newTaskScheduledEvent(1, "activity");
    const taskFailed = newTaskFailedEvent(1, newFailureDetails(new Error("transient failure")));

    const firstResult = await executor.execute("workflow-id", [executionStarted, taskScheduled], [taskFailed]);
    const replayedResult = await executor.execute("workflow-id", [executionStarted, taskScheduled], [taskFailed]);

    const firstTimer = firstResult.actions[0];
    const replayedTimer = replayedResult.actions[0];
    if (
      firstTimer.workflowActionType.case !== "createTimer" ||
      replayedTimer.workflowActionType.case !== "createTimer"
    ) {
      throw new Error("Expected retry timer actions");
    }
    expect(replayedTimer.id).toBe(firstTimer.id);
    expect(timestampToDate(replayedTimer.workflowActionType.value.fireAt)).toEqual(
      timestampToDate(firstTimer.workflowActionType.value.fireAt),
    );
  });

  it("gives every activity attempt and retry timer the same task execution ID", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");
    context.callActivity("activity", undefined, { retryPolicy: policy });

    const firstAction = Object.values(context._pendingActions)[0];
    if (firstAction.workflowActionType.case !== "scheduleTask") {
      throw new Error("Expected a scheduled activity action");
    }
    const executionId = firstAction.workflowActionType.value.taskExecutionId;
    expect(executionId).not.toBe("");

    context._pendingActions = {};
    context._pendingTasks[1].fail("first failure", newFailureDetails(new Error("first failure")));
    const timer = Object.values(context._pendingActions)[0];
    if (timer.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a retry timer action");
    }
    expect(timer.workflowActionType.value.origin).toMatchObject({
      case: "activityRetry",
      value: { taskExecutionId: executionId },
    });

    context._pendingActions = {};
    context._pendingTasks[2].complete(undefined);
    const retryAction = Object.values(context._pendingActions)[0];
    if (retryAction.workflowActionType.case !== "scheduleTask") {
      throw new Error("Expected a retried activity action");
    }
    expect(retryAction.workflowActionType.value.taskExecutionId).toBe(executionId);
  });

  it("links child workflow retries and their timers to the first attempt", () => {
    const context = new OrchestrationRuntimeContext("parent-id");
    context.callSubOrchestrator("child", undefined, undefined, {
      retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 3 },
    });

    const firstAction = Object.values(context._pendingActions)[0];
    if (firstAction.workflowActionType.case !== "createChildWorkflow") {
      throw new Error("Expected a child workflow action");
    }
    expect(firstAction.workflowActionType.value.instanceId).toBe("parent-id:0001");
    expect(firstAction.workflowActionType.value.retryParentInstanceInfo).toBeUndefined();

    for (const [failedId, timerId, retryId] of [
      [1, 2, "parent-id:0003"],
      [3, 4, "parent-id:0005"],
    ] as const) {
      context._pendingActions = {};
      context._pendingTasks[failedId].fail("failure", newFailureDetails(new Error("failure")));
      const timer = Object.values(context._pendingActions)[0];
      if (timer.workflowActionType.case !== "createTimer") {
        throw new Error("Expected a retry timer action");
      }
      expect(timer.workflowActionType.value.origin).toMatchObject({
        case: "childWorkflowRetry",
        value: { instanceId: "parent-id:0001" },
      });

      context._pendingActions = {};
      context._pendingTasks[timerId].complete(undefined);
      const retryAction = Object.values(context._pendingActions)[0];
      if (retryAction.workflowActionType.case !== "createChildWorkflow") {
        throw new Error("Expected a retried child workflow action");
      }
      expect(retryAction.workflowActionType.value.instanceId).toBe(retryId);
      expect(retryAction.workflowActionType.value.retryParentInstanceInfo?.instanceID).toBe("parent-id:0001");
    }
  });

  it("replays a retry recorded before retry timers carried an origin", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("retryWorkflow", function* (context) {
      yield context.callActivity("activity", undefined, {
        retryPolicy: { firstRetryInterval: 2, maxNumberOfAttempts: 3 },
      });
    });
    const executor = new OrchestrationExecutor(registry);
    const executionStarted = newExecutionStartedEvent("retryWorkflow", "workflow-id");
    // No task execution ID and a plain createTimer origin: what older SDKs recorded.
    const taskScheduled = newTaskScheduledEvent(1, "activity");
    const taskFailed = newTaskFailedEvent(1, newFailureDetails(new Error("transient failure")));

    const failed = await executor.execute("workflow-id", [executionStarted, taskScheduled], [taskFailed]);
    const timer = failed.actions[0];
    if (timer.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a retry timer action");
    }
    expect(timer.workflowActionType.value.origin.case).toBe("createTimer");

    const fireAt = timestampToDate(timer.workflowActionType.value.fireAt);
    const retried = await executor.execute(
      "workflow-id",
      [executionStarted, taskScheduled, taskFailed, newTimerCreatedEvent(timer.id, fireAt)],
      [newTimerFiredEvent(timer.id, fireAt)],
    );
    expect(retried.actions).toHaveLength(1);
    expect(retried.actions[0].workflowActionType.case).toBe("scheduleTask");
  });

  it("replays an activity retry whose history has execution IDs but a plain timer origin", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("retryWorkflow", function* (context) {
      yield context.callActivity("activity", undefined, {
        retryPolicy: { firstRetryInterval: 2, maxNumberOfAttempts: 3 },
      });
    });
    const executor = new OrchestrationExecutor(registry);
    const executionStarted = newExecutionStartedEvent("retryWorkflow", "workflow-id");
    const taskScheduled = newTaskScheduledEvent(1, "activity", undefined, "exec-1");
    const taskFailed = newTaskFailedEvent(1, newFailureDetails(new Error("transient failure")), "exec-1");

    const failed = await executor.execute("workflow-id", [executionStarted, taskScheduled], [taskFailed]);
    const timer = failed.actions[0];
    if (timer.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a retry timer action");
    }
    expect(timer.workflowActionType.value.origin).toMatchObject({
      case: "activityRetry",
      value: { taskExecutionId: "exec-1" },
    });

    // The recorded timer has the createTimer origin older SDKs wrote, while the
    // replayed action now has activityRetry. Replay must accept the difference.
    const fireAt = timestampToDate(timer.workflowActionType.value.fireAt);
    const retried = await executor.execute(
      "workflow-id",
      [executionStarted, taskScheduled, taskFailed, newTimerCreatedEvent(timer.id, fireAt)],
      [newTimerFiredEvent(timer.id, fireAt)],
    );
    expect(retried.actions).toHaveLength(1);
    const retryAction = retried.actions[0].workflowActionType;
    if (retryAction.case !== "scheduleTask") {
      throw new Error("Expected a retried activity action");
    }
    expect(retryAction.value.taskExecutionId).toBe("exec-1");
  });

  it("replays a child workflow retry recorded without retry parent links", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("parent", function* (context) {
      yield context.callSubOrchestrator("child", undefined, undefined, {
        retryPolicy: { firstRetryInterval: 2, maxNumberOfAttempts: 3 },
      });
    });
    const executor = new OrchestrationExecutor(registry);
    const childCreated = (eventId: number) =>
      create(HistoryEventSchema, {
        eventId,
        eventType: {
          case: "childWorkflowInstanceCreated",
          value: { name: "child", instanceId: `parent-id:${eventId.toString(16).padStart(4, "0")}` },
        },
      });
    const childFailed = (taskScheduledId: number) =>
      create(HistoryEventSchema, {
        eventId: -1,
        eventType: {
          case: "childWorkflowInstanceFailed",
          value: { taskScheduledId, failureDetails: newFailureDetails(new Error("child failed")) },
        },
      });
    const fireAt = new Date(Date.now() + 2000);
    const firstAttempt = [
      newExecutionStartedEvent("parent", "parent-id"),
      childCreated(1),
      childFailed(1),
      newTimerCreatedEvent(2, fireAt),
    ];

    const retried = await executor.execute("parent-id", firstAttempt, [newTimerFiredEvent(2, fireAt)]);
    expect(retried.actions).toHaveLength(1);
    const retryAction = retried.actions[0].workflowActionType;
    if (retryAction.case !== "createChildWorkflow") {
      throw new Error("Expected a retried child workflow action");
    }
    expect(retryAction.value.instanceId).toBe("parent-id:0003");
    expect(retryAction.value.retryParentInstanceInfo?.instanceID).toBe("parent-id:0001");

    const failedAgain = await executor.execute(
      "parent-id",
      [...firstAttempt, newTimerFiredEvent(2, fireAt), childCreated(3)],
      [childFailed(3)],
    );
    expect(failedAgain.actions).toHaveLength(1);
    const secondTimer = failedAgain.actions[0].workflowActionType;
    if (secondTimer.case !== "createTimer") {
      throw new Error("Expected a retry timer action");
    }
    expect(secondTimer.value.origin).toMatchObject({
      case: "childWorkflowRetry",
      value: { instanceId: "parent-id:0001" },
    });
  });

  it("keeps the createTimer origin on timers the workflow creates itself", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");
    context.createTimer(5);

    const timer = Object.values(context._pendingActions)[0];
    if (timer.workflowActionType.case !== "createTimer") {
      throw new Error("Expected a timer action");
    }
    expect(timer.workflowActionType.value.origin.case).toBe("createTimer");
  });

  it("does not retry failures marked non-retriable", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");
    const task = context.callActivity("activity", undefined, { retryPolicy: policy });
    const failure = newFailureDetails(new Error("permanent failure"));
    failure.isNonRetriable = true;

    context._pendingActions = {};
    context._pendingTasks[1].fail("permanent failure", failure);

    expect(task.isFailed).toBe(true);
    expect(Object.values(context._pendingActions)).toHaveLength(0);
  });

  it("does not schedule a retry that would exceed the retry timeout", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");
    const task = context.callActivity("activity", undefined, {
      retryPolicy: { firstRetryInterval: 3, maxNumberOfAttempts: 3, retryTimeout: 2 },
    });

    context._pendingActions = {};
    context._pendingTasks[1].fail("failure", newFailureDetails(new Error("failure")));

    expect(task.isFailed).toBe(true);
    expect(Object.values(context._pendingActions)).toHaveLength(0);
  });

  it("rejects invalid policies before scheduling an action", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");

    expect(() =>
      context.callActivity("activity", undefined, {
        retryPolicy: { firstRetryInterval: 0, maxNumberOfAttempts: 2 },
      }),
    ).toThrow("firstRetryInterval");
    expect(Object.values(context._pendingActions)).toHaveLength(0);
  });

  it("accepts the retryable task through the normal task interface", () => {
    const context = new OrchestrationRuntimeContext("workflow-id");
    const task = context.callActivity("activity", undefined, { retryPolicy: policy });

    expect(task).toBeDefined();
    expect(context._pendingTasks[1]).toBeDefined();
  });
});

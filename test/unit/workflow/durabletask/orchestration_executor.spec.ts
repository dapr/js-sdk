// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

import { CompleteOrchestrationAction, OrchestratorAction } from "../../../../src/workflow/internal/durabletask/proto/orchestrator_service_pb";
import { OrchestrationContext } from "../../../../src/workflow/internal/durabletask/task/context/orchestration-context";
import {
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newOrchestratorStartedEvent,
  newResumeEvent,
  newSubOrchestrationCompletedEvent,
  newSubOrchestrationCreatedEvent,
  newSubOrchestrationFailedEvent,
  newSuspendEvent,
  newTaskCompletedEvent,
  newTaskFailedEvent,
  newTaskScheduledEvent,
  newTerminatedEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
} from "../../../../src/workflow/internal/durabletask/utils/pb-helper.util";
import { OrchestrationExecutor } from "../../../../src/workflow/internal/durabletask/worker/orchestration-executor";
import * as pb from "../../../../src/workflow/internal/durabletask/proto/orchestrator_service_pb";
import { Registry } from "../../../../src/workflow/internal/durabletask/worker/registry";
import { TOrchestrator } from "../../../../src/workflow/internal/durabletask/types/orchestrator.type";
import { ActivityContext } from "../../../../src/workflow/internal/durabletask/task/context/activity-context";
import { CompletableTask } from "../../../../src/workflow/internal/durabletask/task/completable-task";
import { Task } from "../../../../src/workflow/internal/durabletask/task/task";
import { getName, whenAll, whenAny } from "../../../../src/workflow/internal/durabletask/task";

const TEST_INSTANCE_ID = "abc123";

describe("Orchestration Executor", () => {
  it("should validate the orchestrator function input population", async () => {
    const orchestrator: TOrchestrator = async (ctx: OrchestrationContext, input: any) => {
      // return all orchestrator inputs back as the output
      return [input, ctx.instanceId, ctx.currentUtcDateTime, ctx.isReplaying];
    };

    const testInput = 42;
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const startTime = new Date();
    const newEvents = [
      newOrchestratorStartedEvent(startTime),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, JSON.stringify(testInput)),
    ];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, [], newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()).not.toBeNull();
    const expectedOutput = [testInput, TEST_INSTANCE_ID, startTime.toISOString(), false];
    expect(completeAction?.getResult()?.getValue()).toEqual(JSON.stringify(expectedOutput));
  });

  it("should test the actions output for a completed orchestration", async () => {
    const emptyOrchestrator: TOrchestrator = async (_: OrchestrationContext) => {
      return "done";
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(emptyOrchestrator);
    const newEvents = [newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, [], newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()).not.toBeNull();
    expect(completeAction?.getResult()?.getValue()).toEqual('"done"');
  });
  it("should test the effect of scheduling an unregistered orchestrator", async () => {
    const registry = new Registry();
    const name = "Bogus";
    const newEvents = [newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, [], newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("OrchestratorNotRegisteredError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).not.toBeNull();
  });
  it("should the actions output for the createTimer orchestrator method", async () => {
    const delayOrchestrator: TOrchestrator = async function* (ctx: OrchestrationContext) {
      const dueTime = new Date(ctx.currentUtcDateTime.getTime() + 1000);
      yield ctx.createTimer(dueTime);
      return "done";
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(delayOrchestrator);
    // Set start time to 2020-01-01 12:00:00
    const startTime = new Date(2020, 0, 1, 12, 0, 0);
    const expectedFireAt = new Date(startTime.getTime() + 1000);
    const newEvents = [
      newOrchestratorStartedEvent(startTime),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
    ];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, [], newEvents);
    const actions = result.actions;
    expect(actions).not.toBeNull();
    expect(actions.length).toEqual(1);
    expect(actions[0]?.constructor?.name).toEqual(OrchestratorAction.name);
    expect(actions[0]?.getId()).toEqual(1);
    expect(actions[0]?.getCreatetimer()?.getFireat()?.toDate()).toEqual(expectedFireAt);
  });
  it("should test the resumption of a task using a timerFired event", async () => {
    const delayOrchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const dueTime = new Date(ctx.currentUtcDateTime.getTime() + 1000);
      yield ctx.createTimer(dueTime);
      return "done";
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(delayOrchestrator);
    // Set start time to 2020-01-01 12:00:00
    const startTime = new Date(2020, 0, 1, 12, 0, 0);
    const expectedFireAt = new Date(startTime.getTime() + 1000);
    const oldEvents = [
      newOrchestratorStartedEvent(startTime),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
      newTimerCreatedEvent(1, expectedFireAt),
    ];
    const newEvents = [newTimerFiredEvent(1, expectedFireAt)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()).not.toBeNull();
    expect(completeAction?.getResult()?.getValue()).toEqual('"done"');
  });
  it("should test the actions output for the callActivity orchestrator method", async () => {
    const dummyActivity = async (_: ActivityContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any) {
      yield ctx.callActivity(dummyActivity);
      return "done";
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const newEvents = [newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, [], newEvents);
    const actions = result.actions;
    expect(actions).not.toBeNull();
    expect(actions.length).toEqual(1);
    expect(actions[0]?.constructor?.name).toEqual(OrchestratorAction.name);
    expect(actions[0]?.getId()).toEqual(1);
    expect(actions[0]?.getScheduletask()?.getName()).toEqual("dummyActivity");
  });
  it("should test the successful completion of an activity task", async () => {
    const dummyActivity = async (_: ActivityContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const result = yield ctx.callActivity(dummyActivity);
      return result;
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
      newTaskScheduledEvent(1, dummyActivity.name),
    ];
    const encodedOutput = JSON.stringify("done!");
    const newEvents = [newTaskCompletedEvent(1, encodedOutput)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual(encodedOutput);
  });
  it("should test the failure of an activity task", async () => {
    const dummyActivity = async (_: ActivityContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, orchestratorInput: any): any {
      const result = yield ctx.callActivity(dummyActivity, orchestratorInput);
      return result;
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
      newTaskScheduledEvent(1, getName(dummyActivity)),
    ];
    const ex = new Error("Kah-BOOOOM!!!");
    const newEvents = [newTaskFailedEvent(1, ex)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("TaskFailedError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain(ex.message);
    // TODO: In javascript this becomes an Anonymous function call (e.g., Object.<anonymous>)
    // can we do traceback in it?
    // Make sure the line of code where the exception was raised is included in the stack trace
    // console.log(completeAction?.getFailuredetails()?.getStacktrace()?.getValue());
    // const userCodeStatement = "ctx.callActivity(dummyActivity, orchestratorInput)";
    // expect(completeAction?.getFailuredetails()?.getStacktrace()?.getValue()).toContain(userCodeStatement);
  });
  it("should test the non-determinism detection logic when callTimer is expected but some other method (callActivity) is called instead", async () => {
    const dummyActivity = async (_: ActivityContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const result = yield ctx.callActivity(dummyActivity);
      return result;
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const fireAt = new Date();
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
      newTimerCreatedEvent(1, fireAt),
    ];
    const newEvents = [newTimerFiredEvent(1, fireAt)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("NonDeterminismError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("1");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("createTimer");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("callActivity");
  });
  it("should test the non-determinism detection logic when invoking activity functions", async () => {
    const orchestrator: TOrchestrator = async function* (_: OrchestrationContext): any {
      const result = yield new CompletableTask(); // dummy task
      return result;
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
      newTaskScheduledEvent(1, "bogusActivity"),
    ];
    const newEvents = [newTaskCompletedEvent(1, "done!")];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("NonDeterminismError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("1");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("callActivity");
  });
  it("should test the non-determinism detection when an activity exists in the history but a non-activity is in the code", async () => {
    const dummyActivity = async (_: ActivityContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      // Create a timer when the history expects an activity call
      yield ctx.createTimer(new Date());
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
      newTaskScheduledEvent(1, getName(dummyActivity)),
    ];
    const newEvents = [newTaskCompletedEvent(1)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("NonDeterminismError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("1");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("callActivity");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("createTimer");
  });
  it("should test the non-determinism detection when calling an activity with a name that differs from the name in the history", async () => {
    const dummyActivity = async (_: ActivityContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      // Create a timer when the history expects an activity call
      yield ctx.callActivity(dummyActivity);
    };
    const registry = new Registry();
    const name = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(name, TEST_INSTANCE_ID, undefined),
      newTaskScheduledEvent(1, "originalActivity"),
    ];
    const newEvents = [newTaskCompletedEvent(1)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("NonDeterminismError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("1");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("callActivity");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("originalActivity");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("dummyActivity");
  });
  it("should test that a sub-orchestration task is completed when the sub-orchestration completes", async () => {
    const subOrchestrator = async (_: OrchestrationContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const res = yield ctx.callSubOrchestrator(subOrchestrator);
      return res;
    };
    const registry = new Registry();
    const subOrchestratorName = registry.addOrchestrator(subOrchestrator);
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID, undefined),
      newSubOrchestrationCreatedEvent(1, subOrchestratorName, "sub-orch-123"),
    ];
    const newEvents = [newSubOrchestrationCompletedEvent(1, "42")];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual("42");
  });
  it("should test that a sub-orchestration task is completed when the sub-orchestration fails", async () => {
    const subOrchestrator = async (_: OrchestrationContext) => {
      // do nothing
    };
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const res = yield ctx.callSubOrchestrator(subOrchestrator);
      return res;
    };
    const registry = new Registry();
    const subOrchestratorName = registry.addOrchestrator(subOrchestrator);
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID, undefined),
      newSubOrchestrationCreatedEvent(1, subOrchestratorName, "sub-orch-123"),
    ];
    const ex = new Error("Kah-BOOOOM!!!");
    const newEvents = [newSubOrchestrationFailedEvent(1, ex)];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("TaskFailedError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain(ex.message);
    // TODO
    // // Make sure the line of code where the exception was raised is included in the stack trace
    // user_code_statement = "ctx.call_sub_orchestrator(suborchestrator)"
    // assert user_code_statement in complete_action.failureDetails.stackTrace.value
  });
  it("should test the non-determinism detection when a sub-orchestration action is encountered when it shouldn't be-subOrchestrator", async () => {
    const orchestrator: TOrchestrator = async (_: OrchestrationContext) => {
      const res = new CompletableTask(); // dummy task
      return res;
    };
    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID, undefined),
      newSubOrchestrationCreatedEvent(1, "some_sub_orchestration", "sub-orch-123"),
    ];
    const newEvents = [newSubOrchestrationCompletedEvent(1, "42")];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("NonDeterminismError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("1");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("callSubOrchestrator");
    // TODO
    // // Make sure the line of code where the exception was raised is included in the stack trace
    // user_code_statement = "ctx.call_sub_orchestrator(suborchestrator)"
    // assert user_code_statement in complete_action.failureDetails.stackTrace.value
  });
  /**
   * It should test the non-determinism detection when a sub-orchestration action is encountered when it shouldn't be.
   * This variation tests the case where the expected task type is wrong (e.g. the code schedules a timer task
   * but the history contains a sub-orchestration completed task)
   */
  it("should test the non-determinism detection when a sub-orchestration action is encountered when it shouldn't be-timer", async () => {
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const res = yield ctx.createTimer(new Date()); // Created timer but history expects sub-orchestration
      return res;
    };
    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID, undefined),
      newSubOrchestrationCreatedEvent(1, "some_sub_orchestration", "sub-orch-123"),
    ];
    const newEvents = [newSubOrchestrationCompletedEvent(1, "42")];
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("NonDeterminismError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("1");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain("callSubOrchestrator");
    // TODO
    // // Make sure the line of code where the exception was raised is included in the stack trace
    // user_code_statement = "ctx.call_sub_orchestrator(suborchestrator)"
    // assert user_code_statement in complete_action.failureDetails.stackTrace.value
  });

  it("should test that an orchestration can wait for and process an external event sent by a client", async () => {
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const res = yield ctx.waitForExternalEvent("my_event");
      return res;
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);

    let oldEvents: any[] = [];
    let newEvents = [newOrchestratorStartedEvent(), newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID)];

    // Execute the orchestration until it is waiting for an external event.
    // The result should be an empty list of actions because the orchestration didn't schedule any work
    let executor = new OrchestrationExecutor(registry);
    let result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    expect(result.actions.length).toBe(0);

    // Now send an external event to the orchestration and execute it again.
    // This time the orcehstration should complete
    oldEvents = newEvents;
    newEvents = [newEventRaisedEvent("my_event", "42")];
    executor = new OrchestrationExecutor(registry);
    result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);

    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual("42");
  });

  it("should test that an orchestration can receive an event that arrives earlier than expected", async () => {
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      yield ctx.createTimer(new Date(ctx.currentUtcDateTime.getTime() + 24 * 60 * 60 * 1000));
      const res = yield ctx.waitForExternalEvent("my_event");
      return res;
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);

    let oldEvents: any[] = [];
    let newEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID),
      newEventRaisedEvent("my_event", "42"),
    ];

    // Execute the orchestration
    // It should be in a running state waiting for the timer to fire
    let executor = new OrchestrationExecutor(registry);
    let result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    let actions = result.actions;
    expect(actions.length).toBe(1);
    expect(actions[0].hasCreatetimer()).toBeTruthy();

    // Complete the timer task
    // The orchestration should move to the waitForExternalEvent step now which should
    // then complete immediately because the event was buffered in the old event history
    const timerDueTime = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    newEvents.push(newTimerCreatedEvent(1, timerDueTime));
    oldEvents = newEvents;
    newEvents = [newTimerFiredEvent(1, timerDueTime)];
    executor = new OrchestrationExecutor(registry);
    result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    actions = result.actions;

    const completeAction = getAndValidateSingleCompleteOrchestrationAction(actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual("42");
  });

  it("should test that an orchestration can be suspended and resumed", async () => {
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const res = yield ctx.waitForExternalEvent("my_event");
      return res;
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);

    const oldEvents = [newOrchestratorStartedEvent(), newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID)];

    let newEvents = [newSuspendEvent(), newEventRaisedEvent("my_event", "42")];

    // Execute the orchestration
    // It should be in a running state because it was suspended prior
    // to the processing the event raised event
    let executor = new OrchestrationExecutor(registry);
    let result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    let actions = result.actions;
    expect(actions.length).toBe(0);

    // Resume the orchestration, it should complete successfully
    oldEvents.push(...newEvents);
    newEvents = [newResumeEvent()];
    executor = new OrchestrationExecutor(registry);
    result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    actions = result.actions;
    const completeAction = getAndValidateSingleCompleteOrchestrationAction(actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual("42");
  });

  it("should test that an orchestration can be terminated before it completes", async () => {
    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, _: any): any {
      const res = yield ctx.waitForExternalEvent("my_event");
      return res;
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);

    const oldEvents = [newOrchestratorStartedEvent(), newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID)];

    const newEvents = [newTerminatedEvent(JSON.stringify("terminated!")), newEventRaisedEvent("my_event", "42")];

    // Execute the orchestration
    // It should be in a running state waiting for an external event
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);

    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_TERMINATED);
    expect(completeAction?.getResult()?.getValue()).toEqual(JSON.stringify("terminated!"));
  });

  it("should be able to continue-as-new", async () => {
    for (const saveEvent of [true, false]) {
      const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, input: number): any {
        yield ctx.createTimer(new Date(ctx.currentUtcDateTime.getTime() + 1 * 24 * 60 * 60 * 1000));
        ctx.continueAsNew(input + 1, saveEvent);
      };

      const registry = new Registry();
      const orchestratorName = registry.addOrchestrator(orchestrator);

      const oldEvents = [
        newOrchestratorStartedEvent(),
        newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID, "1"),
        newEventRaisedEvent("my_event", "42"),
        newEventRaisedEvent("my_event", "43"),
        newEventRaisedEvent("my_event", "44"),
        newTimerCreatedEvent(1, new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)),
      ];

      const newEvents = [newTimerFiredEvent(1, new Date(Date.now() + 1 * 24 * 60 * 60 * 1000))];

      // Execute the orchestration, it should be in a running state waiting for the timer to fire
      const executor = new OrchestrationExecutor(registry);
      const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);

      const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
      expect(completeAction?.getOrchestrationstatus()).toEqual(
        pb.OrchestrationStatus.ORCHESTRATION_STATUS_CONTINUED_AS_NEW,
      );
      expect(completeAction?.getResult()?.getValue()).toEqual(JSON.stringify(2));
      expect(completeAction?.getCarryovereventsList()?.length).toEqual(saveEvent ? 3 : 0);

      for (let i = 0; i < (completeAction?.getCarryovereventsList()?.length ?? 0); i++) {
        const event = completeAction?.getCarryovereventsList()[i];

        // TODO: Should we check this with Typescript? As class typings are harder to detect
        // expect(typeof event).toEqual(pb.HistoryEvent);

        expect(event?.hasEventraised());
        expect(event?.getEventraised()?.getName()?.toLocaleLowerCase()).toEqual("my_event");
        expect(event?.getEventraised()?.getInput()?.getValue()).toEqual(JSON.stringify(42 + i));
      }
    }
  });

  it("should test that a fan-out pattern correctly schedules N tasks", async () => {
    const hello = async (_: any, name: string) => {
      return `Hello ${name}`;
    };

    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext, count: number): any {
      const tasks: Task<any>[] = [];

      for (let i = 0; i < count; i++) {
        tasks.push(ctx.callActivity(hello, i.toString()));
      }

      const results = yield whenAll(tasks);
      return results;
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const activityName = registry.addActivity(hello);

    const oldEvents: any[] = [];
    const newEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID, "10"),
    ];

    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    const actions = result.actions;
    // The result should be 10 "taskScheduled" actions with inputs from 0 to 9
    expect(actions.length).toEqual(10);

    for (let i = 0; i < 10; i++) {
      expect(actions[i].hasScheduletask());
      expect(actions[i].getScheduletask()?.getName()).toEqual(activityName);
      expect(actions[i].getScheduletask()?.getInput()?.getValue()).toEqual(`"${i}"`);
    }
  });

  it("should test that a fan-in pattern works correctly", async () => {
    const printInt = (_: any, value: number) => {
      return value.toString();
    };

    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext): any {
      const tasks: Task<string>[] = [];

      for (let i = 0; i < 10; i++) {
        tasks.push(ctx.callActivity(printInt, i));
      }

      const results = yield whenAll(tasks);
      return results;
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const activityName = registry.addActivity(printInt);

    const oldEvents = [newOrchestratorStartedEvent(), newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID)];

    for (let i = 0; i < 10; i++) {
      oldEvents.push(newTaskScheduledEvent(i + 1, activityName, i.toString()));
    }

    const newEvents: any[] = [];

    for (let i = 0; i < 10; i++) {
      newEvents.push(newTaskCompletedEvent(i + 1, printInt(null, i)));
    }

    // First, test with only the first 5 events
    // we expect the orchestrator to be running
    // it should however return 0 actions, since it is still waiting for the other 5 tasks to complete
    let executor = new OrchestrationExecutor(registry);
    let result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents.slice(0, 4));
    let actions = result.actions;
    expect(actions.length).toBe(0);

    // Now test with the full set of new events
    // we expect the orchestration to complete
    executor = new OrchestrationExecutor(registry);
    result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    actions = result.actions;

    const completeAction = getAndValidateSingleCompleteOrchestrationAction(actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual("[0,1,2,3,4,5,6,7,8,9]");
  });

  it("should test that a fan-in works correctly when one of the tasks fails", async () => {
    const printInt = (_: any, value: number) => {
      return value.toString();
    };

    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext): any {
      const tasks: Task<string>[] = [];

      for (let i = 0; i < 10; i++) {
        tasks.push(ctx.callActivity(printInt, i));
      }

      const results = yield whenAll(tasks);
      return results;
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const activityName = registry.addActivity(printInt);

    const oldEvents = [newOrchestratorStartedEvent(), newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID)];

    for (let i = 0; i < 10; i++) {
      oldEvents.push(newTaskScheduledEvent(i + 1, activityName, i.toString()));
    }

    // Chaos test with 5 tasks completing successfully, 1 failing and 4 still running
    // we exect that the orchestration fails immediately now and does not wait for the 4 that are running
    const newEvents: any[] = [];

    for (let i = 0; i < 5; i++) {
      newEvents.push(newTaskCompletedEvent(i + 1, printInt(null, i)));
    }

    const ex = new Error("Kah-BOOOOM!!!");
    newEvents.push(newTaskFailedEvent(6, ex));

    // Now test with the full set of new events
    // We expect the orchestration to complete
    const executor = new OrchestrationExecutor(registry);
    const result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);

    const completeAction = getAndValidateSingleCompleteOrchestrationAction(result.actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED);
    expect(completeAction?.getFailuredetails()?.getErrortype()).toEqual("TaskFailedError");
    expect(completeAction?.getFailuredetails()?.getErrormessage()).toContain(ex.message);
  });

  it("should test that a whenAny pattern works correctly", async () => {
    const hello = (_: any, name: string) => {
      return `Hello ${name}!`;
    };

    const orchestrator: TOrchestrator = async function* (ctx: OrchestrationContext): any {
      const t1 = ctx.callActivity(hello, "Tokyo");
      const t2 = ctx.callActivity(hello, "Seattle");

      const winner = yield whenAny([t1, t2]);

      if (winner == t1) {
        return t1.getResult();
      } else {
        return t2.getResult();
      }
    };

    const registry = new Registry();
    const orchestratorName = registry.addOrchestrator(orchestrator);
    const activityName = registry.addActivity(hello);

    // Test 1: Start the orchestration and let it yield on the whenAny
    // this should return 2 actions: a Tokyo Task Schedule and a Seattle Task Schedule
    let oldEvents: any[] = [];
    let newEvents = [newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID)];
    let executor = new OrchestrationExecutor(registry);
    let result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    let actions = result.actions;

    expect(actions.length).toEqual(2);
    expect(actions[0].hasScheduletask()).toBeTruthy();
    expect(actions[1].hasScheduletask()).toBeTruthy();

    // The next tests assume that the orchestration has already await at the task.whenAny
    oldEvents = [
      newOrchestratorStartedEvent(),
      newExecutionStartedEvent(orchestratorName, TEST_INSTANCE_ID),
      newTaskScheduledEvent(1, activityName, JSON.stringify("Tokyo")),
      newTaskScheduledEvent(2, activityName, JSON.stringify("Seattle")),
    ];

    // Test 2: Complete the "Tokyo" task.
    // the orchestration should now complete with "Hello Tokyo!"
    let encodedOutput = JSON.stringify(hello(null, "Tokyo"));
    newEvents = [newTaskCompletedEvent(1, encodedOutput)];
    executor = new OrchestrationExecutor(registry);
    result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    actions = result.actions;
    let completeAction = getAndValidateSingleCompleteOrchestrationAction(actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual(encodedOutput);

    // Test 3: Complete the "Seattle" task.
    // the orchestration should now complete with "Hello Tokyo!"
    encodedOutput = JSON.stringify(hello(null, "Seattle"));
    newEvents = [newTaskCompletedEvent(2, encodedOutput)];
    executor = new OrchestrationExecutor(registry);
    result = await executor.execute(TEST_INSTANCE_ID, oldEvents, newEvents);
    actions = result.actions;
    completeAction = getAndValidateSingleCompleteOrchestrationAction(actions);
    expect(completeAction?.getOrchestrationstatus()).toEqual(pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
    expect(completeAction?.getResult()?.getValue()).toEqual(encodedOutput);
  });
});

function getAndValidateSingleCompleteOrchestrationAction(
  actions: OrchestratorAction[],
): CompleteOrchestrationAction | undefined {
  expect(actions.length).toEqual(1);
  const action = actions[0];
  expect(action?.constructor?.name).toEqual(CompleteOrchestrationAction.name);

  const resCompleteOrchestration = action.getCompleteorchestration();
  expect(resCompleteOrchestration).not.toBeNull();
  return resCompleteOrchestration;
}

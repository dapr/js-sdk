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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import * as pb from "../proto/orchestrator_service_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

export function newOrchestratorStartedEvent(timestamp?: Date | null): pb.HistoryEvent {
  const ts = new Timestamp();

  if (timestamp) {
    ts.fromDate(timestamp);
  }

  const orchestratorStartEvent = new pb.OrchestratorStartedEvent();

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setOrchestratorstarted(orchestratorStartEvent);

  return event;
}

export function newExecutionStartedEvent(name: string, instanceId: string, encodedInput?: string): pb.HistoryEvent {
  const ts = new Timestamp();

  const orchestrationInstance = new pb.OrchestrationInstance();
  orchestrationInstance.setInstanceid(instanceId);

  const executionStartedEvent = new pb.ExecutionStartedEvent();
  executionStartedEvent.setName(name);
  executionStartedEvent.setInput(getStringValue(encodedInput));
  executionStartedEvent.setOrchestrationinstance(orchestrationInstance);

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setExecutionstarted(executionStartedEvent);

  return event;
}

export function newTimerCreatedEvent(timerId: number, fireAt: Date): pb.HistoryEvent {
  const ts = new Timestamp();
  ts.fromDate(fireAt);

  const timerCreatedEvent = new pb.TimerCreatedEvent();
  timerCreatedEvent.setFireat(ts);

  const event = new pb.HistoryEvent();
  event.setEventid(timerId);
  event.setTimestamp(ts);
  event.setTimercreated(timerCreatedEvent);

  return event;
}

export function newTimerFiredEvent(timerId: number, fireAt: Date): pb.HistoryEvent {
  const ts = new Timestamp();
  ts.fromDate(fireAt);

  const timerFiredEvent = new pb.TimerFiredEvent();
  timerFiredEvent.setTimerid(timerId);
  timerFiredEvent.setFireat(ts);

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setTimerfired(timerFiredEvent);

  return event;
}

export function newTaskScheduledEvent(eventId: number, name: string, encodedInput?: string): pb.HistoryEvent {
  const ts = new Timestamp();

  const taskScheduledEvent = new pb.TaskScheduledEvent();
  taskScheduledEvent.setName(name);
  taskScheduledEvent.setInput(getStringValue(encodedInput));

  const event = new pb.HistoryEvent();
  event.setEventid(eventId);
  event.setTimestamp(ts);
  event.setTaskscheduled(taskScheduledEvent);

  return event;
}

export function newTaskCompletedEvent(eventId: number, encodedOutput?: string): pb.HistoryEvent {
  const ts = new Timestamp();

  const taskCompletedEvent = new pb.TaskCompletedEvent();
  taskCompletedEvent.setResult(getStringValue(encodedOutput));
  taskCompletedEvent.setTaskscheduledid(eventId);

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setTaskcompleted(taskCompletedEvent);

  return event;
}

export function newTaskFailedEvent(eventId: number, ex: Error): pb.HistoryEvent {
  const ts = new Timestamp();

  const taskFailedEvent = new pb.TaskFailedEvent();
  taskFailedEvent.setFailuredetails(newFailureDetails(ex));
  taskFailedEvent.setTaskscheduledid(eventId);

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setTaskfailed(taskFailedEvent);

  return event;
}

export function newSubOrchestrationCreatedEvent(
  eventId: number,
  name: string,
  instanceId: string,
  encodedInput?: string,
): pb.HistoryEvent {
  const ts = new Timestamp();

  const subOrchestrationInstanceCreatedEvent = new pb.SubOrchestrationInstanceCreatedEvent();
  subOrchestrationInstanceCreatedEvent.setName(name);
  subOrchestrationInstanceCreatedEvent.setInput(getStringValue(encodedInput));
  subOrchestrationInstanceCreatedEvent.setInstanceid(instanceId);

  const event = new pb.HistoryEvent();
  event.setEventid(eventId);
  event.setTimestamp(ts);
  event.setSuborchestrationinstancecreated(subOrchestrationInstanceCreatedEvent);

  return event;
}

export function newSubOrchestrationCompletedEvent(eventId: number, encodedOutput?: string): pb.HistoryEvent {
  const ts = new Timestamp();

  const subOrchestrationInstanceCompletedEvent = new pb.SubOrchestrationInstanceCompletedEvent();
  subOrchestrationInstanceCompletedEvent.setResult(getStringValue(encodedOutput));
  subOrchestrationInstanceCompletedEvent.setTaskscheduledid(eventId);

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setSuborchestrationinstancecompleted(subOrchestrationInstanceCompletedEvent);

  return event;
}

export function newSubOrchestrationFailedEvent(eventId: number, ex: Error): pb.HistoryEvent {
  const ts = new Timestamp();

  const subOrchestrationInstanceFailedEvent = new pb.SubOrchestrationInstanceFailedEvent();
  subOrchestrationInstanceFailedEvent.setFailuredetails(newFailureDetails(ex));
  subOrchestrationInstanceFailedEvent.setTaskscheduledid(eventId);

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setSuborchestrationinstancefailed(subOrchestrationInstanceFailedEvent);

  return event;
}

export function newFailureDetails(e: any): pb.TaskFailureDetails {
  const failure = new pb.TaskFailureDetails();
  failure.setErrortype(e.constructor.name);
  failure.setErrormessage(e.message);

  // Construct a google_protobuf_wrappers_pb.StringValue
  const stringValueStackTrace = new StringValue();
  stringValueStackTrace.setValue(e.stack?.toString() ?? "");
  failure.setStacktrace(stringValueStackTrace);

  return failure;
}

export function newEventRaisedEvent(name: string, encodedInput?: string): pb.HistoryEvent {
  const ts = new Timestamp();

  const eventRaised = new pb.EventRaisedEvent();
  eventRaised.setName(name);
  eventRaised.setInput(getStringValue(encodedInput));

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setEventraised(eventRaised);

  return event;
}

export function newSuspendEvent(): pb.HistoryEvent {
  const ts = new Timestamp();

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setExecutionsuspended(new pb.ExecutionSuspendedEvent());

  return event;
}

export function newResumeEvent(): pb.HistoryEvent {
  const ts = new Timestamp();

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setExecutionresumed(new pb.ExecutionResumedEvent());

  return event;
}

export function newTerminatedEvent(encodedOutput?: string): pb.HistoryEvent {
  const executionTerminatedEvent = new pb.ExecutionTerminatedEvent();
  executionTerminatedEvent.setInput(getStringValue(encodedOutput));

  const ts = new Timestamp();

  const event = new pb.HistoryEvent();
  event.setEventid(-1);
  event.setTimestamp(ts);
  event.setExecutionterminated(executionTerminatedEvent);

  return event;
}

export function getStringValue(val?: string): StringValue | undefined {
  if (!val) {
    return;
  }

  const stringValue = new StringValue();
  stringValue.setValue(val);

  return stringValue;
}

export function newCompleteOrchestrationAction(
  id: number,
  status: pb.OrchestrationStatus,
  result?: string,
  failureDetails?: pb.TaskFailureDetails,
  carryoverEvents?: pb.HistoryEvent[] | null,
): pb.OrchestratorAction {
  const completeOrchestrationAction = new pb.CompleteOrchestrationAction();
  completeOrchestrationAction.setOrchestrationstatus(status);
  completeOrchestrationAction.setResult(getStringValue(result));
  completeOrchestrationAction.setFailuredetails(failureDetails);
  completeOrchestrationAction.setCarryovereventsList(carryoverEvents || []);

  const action = new pb.OrchestratorAction();
  action.setId(id);
  action.setCompleteorchestration(completeOrchestrationAction);

  return action;
}

export function newCreateTimerAction(id: number, fireAt: Date): pb.OrchestratorAction {
  const timestamp = new Timestamp();
  timestamp.fromDate(fireAt);

  const createTimerAction = new pb.CreateTimerAction();
  createTimerAction.setFireat(timestamp);

  const action = new pb.OrchestratorAction();
  action.setId(id);
  action.setCreatetimer(createTimerAction);

  return action;
}

export function newScheduleTaskAction(id: number, name: string, encodedInput?: string): pb.OrchestratorAction {
  const scheduleTaskAction = new pb.ScheduleTaskAction();
  scheduleTaskAction.setName(name);
  scheduleTaskAction.setInput(getStringValue(encodedInput));

  const action = new pb.OrchestratorAction();
  action.setId(id);
  action.setScheduletask(scheduleTaskAction);

  return action;
}

export function newTimestamp(dt: Date): Timestamp {
  const timestamp = new Timestamp();
  timestamp.fromDate(dt);
  return timestamp;
}

export function newCreateSubOrchestrationAction(
  id: number,
  name: string,
  instanceId?: string | null,
  encodedInput?: string,
): pb.OrchestratorAction {
  const createSubOrchestrationAction = new pb.CreateSubOrchestrationAction();
  createSubOrchestrationAction.setName(name);
  createSubOrchestrationAction.setInstanceid(instanceId || "");
  createSubOrchestrationAction.setInput(getStringValue(encodedInput));

  const action = new pb.OrchestratorAction();
  action.setId(id);
  action.setCreatesuborchestration(createSubOrchestrationAction);

  return action;
}

export function isEmpty(v?: StringValue | null): boolean {
  return v == null || v.getValue() === "";
}

/**
 * Get the orchestration status by the enum value of the status
 *
 * @param status
 * @returns
 */
export function getOrchestrationStatusStr(status: number): string {
  const idx = Object.values(pb.OrchestrationStatus).indexOf(status);
  const name = Object.keys(pb.OrchestrationStatus)[idx];

  if (name?.startsWith("ORCHESTRATION_STATUS_")) {
    return name.slice("ORCHESTRATION_STATUS_".length);
  }

  return "UNKNOWN";
}

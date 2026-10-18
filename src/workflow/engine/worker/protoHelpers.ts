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

import { create } from "@bufbuild/protobuf";
import { timestampFromDate, timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";
import type { OrchestrationStatus, TaskFailureDetails, WorkflowInstance } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  OrchestrationStatus as OrchestrationStatusEnum,
  TaskFailureDetailsSchema,
  WorkflowInstanceSchema,
} from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import type {
  HistoryEvent,
  ExecutionStartedEvent,
  TaskScheduledEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TimerCreatedEvent,
  TimerFiredEvent,
  EventRaisedEvent,
  ExecutionTerminatedEvent,
  ExecutionSuspendedEvent,
  ExecutionResumedEvent,
  WorkflowStartedEvent,
} from "../../../proto/dapr/proto/durabletask/v1/history_events_pb";
import {
  HistoryEventSchema,
  ExecutionStartedEventSchema,
  TaskScheduledEventSchema,
  TaskCompletedEventSchema,
  TaskFailedEventSchema,
  TimerCreatedEventSchema,
  TimerFiredEventSchema,
  EventRaisedEventSchema,
  ExecutionTerminatedEventSchema,
  ExecutionSuspendedEventSchema,
  ExecutionResumedEventSchema,
  WorkflowStartedEventSchema,
  TimerOriginCreateTimerSchema,
} from "../../../proto/dapr/proto/durabletask/v1/history_events_pb";
import type {
  WorkflowAction,
  ScheduleTaskAction,
  CreateTimerAction,
  CreateChildWorkflowAction,
  CompleteWorkflowAction,
  SendEventAction,
} from "../../../proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";
import {
  WorkflowActionSchema,
  ScheduleTaskActionSchema,
  CreateTimerActionSchema,
  CreateChildWorkflowActionSchema,
  CompleteWorkflowActionSchema,
  SendEventActionSchema,
} from "../../../proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";

export function dateToTimestamp(date: Date): Timestamp {
  return timestampFromDate(date);
}

export function timestampToDate(ts?: Timestamp): Date {
  if (!ts) return new Date(0);
  return timestampDate(ts);
}

export function newFailureDetails(e: Error): TaskFailureDetails {
  return create(TaskFailureDetailsSchema, {
    errorType: e.constructor?.name ?? "Error",
    errorMessage: e.message,
    stackTrace: e.stack?.toString() ?? "",
    isNonRetriable: false,
  });
}

export function newExecutionStartedEvent(name: string, instanceId: string, encodedInput?: string): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "executionStarted",
      value: create(ExecutionStartedEventSchema, {
        name,
        input: encodedInput,
        workflowInstance: create(WorkflowInstanceSchema, { instanceId }),
      }),
    },
  });
}

export function newTaskScheduledEvent(eventId: number, name: string, encodedInput?: string, taskExecutionId?: string): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "taskScheduled",
      value: create(TaskScheduledEventSchema, {
        name,
        input: encodedInput,
        taskExecutionId: taskExecutionId ?? "",
      }),
    },
  });
}

export function newTaskCompletedEvent(eventId: number, encodedOutput?: string, taskExecutionId?: string): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "taskCompleted",
      value: create(TaskCompletedEventSchema, {
        taskScheduledId: eventId,
        result: encodedOutput,
        taskExecutionId: taskExecutionId ?? "",
      }),
    },
  });
}

export function newTaskFailedEvent(eventId: number, details: TaskFailureDetails, taskExecutionId?: string): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "taskFailed",
      value: create(TaskFailedEventSchema, {
        taskScheduledId: eventId,
        failureDetails: details,
        taskExecutionId: taskExecutionId ?? "",
      }),
    },
  });
}

export function newTimerCreatedEvent(timerId: number, fireAt: Date): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: timerId,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "timerCreated",
      value: create(TimerCreatedEventSchema, {
        fireAt: dateToTimestamp(fireAt),
        origin: {
          case: "createTimer",
          value: create(TimerOriginCreateTimerSchema, {}),
        },
      }),
    },
  });
}

export function newTimerFiredEvent(timerId: number, fireAt: Date): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "timerFired",
      value: create(TimerFiredEventSchema, {
        timerId,
        fireAt: dateToTimestamp(fireAt),
      }),
    },
  });
}

export function newEventRaisedEvent(name: string, encodedInput?: string): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "eventRaised",
      value: create(EventRaisedEventSchema, {
        name,
        input: encodedInput,
      }),
    },
  });
}

export function newExecutionTerminatedEvent(encodedOutput?: string): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "executionTerminated",
      value: create(ExecutionTerminatedEventSchema, {
        input: encodedOutput,
      }),
    },
  });
}

export function newExecutionSuspendedEvent(): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "executionSuspended",
      value: create(ExecutionSuspendedEventSchema, {}),
    },
  });
}

export function newExecutionResumedEvent(): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "executionResumed",
      value: create(ExecutionResumedEventSchema, {}),
    },
  });
}

export function newWorkflowStartedEvent(): HistoryEvent {
  return create(HistoryEventSchema, {
    eventId: -1,
    timestamp: dateToTimestamp(new Date()),
    eventType: {
      case: "workflowStarted",
      value: create(WorkflowStartedEventSchema, {}),
    },
  });
}

export function newScheduleTaskAction(
  id: number,
  name: string,
  encodedInput?: string,
  taskExecutionId?: string,
): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    workflowActionType: {
      case: "scheduleTask",
      value: create(ScheduleTaskActionSchema, {
        name,
        input: encodedInput,
        taskExecutionId: taskExecutionId ?? "",
      }),
    },
  });
}

export function newCreateTimerAction(id: number, fireAt: Date): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    workflowActionType: {
      case: "createTimer",
      value: create(CreateTimerActionSchema, {
        fireAt: dateToTimestamp(fireAt),
        origin: {
          case: "createTimer",
          value: create(TimerOriginCreateTimerSchema, {}),
        },
      }),
    },
  });
}

export function newCreateChildWorkflowAction(
  id: number,
  name: string,
  instanceId: string,
  encodedInput?: string,
): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    workflowActionType: {
      case: "createChildWorkflow",
      value: create(CreateChildWorkflowActionSchema, {
        name,
        instanceId,
        input: encodedInput,
      }),
    },
  });
}

export function newSendEventAction(
  id: number,
  instanceId: string,
  eventName: string,
  encodedData?: string,
): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    workflowActionType: {
      case: "sendEvent",
      value: create(SendEventActionSchema, {
        instance: create(WorkflowInstanceSchema, { instanceId }),
        name: eventName,
        data: encodedData,
      }),
    },
  });
}

export function newCompleteWorkflowAction(
  id: number,
  status: OrchestrationStatus,
  result?: string,
  failureDetails?: TaskFailureDetails,
  carryoverEvents?: HistoryEvent[],
): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    workflowActionType: {
      case: "completeWorkflow",
      value: create(CompleteWorkflowActionSchema, {
        workflowStatus: status,
        result,
        failureDetails,
        carryoverEvents: carryoverEvents ?? [],
      }),
    },
  });
}

export function isEmpty(v?: string | null): boolean {
  return v == null || v === "";
}

export function getOrchestrationStatusStr(status: OrchestrationStatus): string {
  return OrchestrationStatusEnum[status] ?? "UNKNOWN";
}

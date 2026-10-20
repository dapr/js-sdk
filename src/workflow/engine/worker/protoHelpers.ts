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

import { create, fromBinary } from "@bufbuild/protobuf";
import { types } from "node:util";
import { TaskFailedError } from "../task";
import type { ActivityOptions } from "../../../types/workflow/ActivityOptions.type";
import { createPropagatedHistoryView, type PropagatedHistoryView } from "../../runtime/PropagatedHistory";
import { timestampFromDate, timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";
import type {
  OrchestrationStatus,
  TaskFailureDetails,
} from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  OrchestrationStatus as OrchestrationStatusEnum,
  TaskFailureDetailsSchema,
  WorkflowInstanceSchema,
  TaskRouterSchema,
} from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import type {
  HistoryEvent,
  PropagatedHistory as HistoryMessage,
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
import type { WorkflowAction } from "../../../proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";
import {
  WorkflowActionSchema,
  ScheduleTaskActionSchema,
  CreateTimerActionSchema,
  CreateChildWorkflowActionSchema,
  CreateDetachedWorkflowActionSchema,
  CompleteWorkflowActionSchema,
  SendEventActionSchema,
} from "../../../proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";

type RoutingOptions = Pick<ActivityOptions, "targetAppId" | "propagationScope"> & { sourceAppId?: string };

export function decodePropagatedHistory(history?: HistoryMessage): PropagatedHistoryView | undefined {
  if (!history?.chunks.length) {
    return undefined;
  }
  return createPropagatedHistoryView({
    scope: history.scope,
    chunks: history.chunks.map((chunk) => ({
      appId: chunk.appId,
      instanceId: chunk.instanceId,
      workflowName: chunk.workflowName,
      events: chunk.rawEvents.map((event) => fromBinary(HistoryEventSchema, event)),
      rawEvents: chunk.rawEvents,
      rawSignatures: chunk.rawSignatures,
      signingCertChains: chunk.signingCertChains,
    })),
  });
}

export function dateToTimestamp(date: Date): Timestamp {
  return timestampFromDate(date);
}

export function timestampToDate(ts?: Timestamp): Date {
  if (!ts) return new Date(0);
  return timestampDate(ts);
}

export function toError(value: unknown): Error {
  if (types.isNativeError(value)) return value;
  if (value !== null && (typeof value === "object" || typeof value === "function")) {
    // Read data properties without invoking user-defined getters or string conversion.
    try {
      const message: unknown = Object.getOwnPropertyDescriptor(value, "message")?.value;
      const stack: unknown = Object.getOwnPropertyDescriptor(value, "stack")?.value;
      const error = new Error(typeof message === "string" ? message : "A non-Error value was thrown");
      if (typeof stack === "string") error.stack = stack;
      return error;
    } catch {
      return new Error("A non-Error value was thrown and its error details could not be inspected");
    }
  }
  return new Error(String(value));
}

export function newFailureDetails(value: unknown): TaskFailureDetails {
  const e = toError(value);
  return create(TaskFailureDetailsSchema, {
    errorType: e.constructor?.name ?? "Error",
    errorMessage: e.message,
    stackTrace: e.stack?.toString() ?? "",
    isNonRetriable: false,
    innerFailure: e instanceof TaskFailedError ? e.failureDetails : undefined,
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

export function newTaskScheduledEvent(
  eventId: number,
  name: string,
  encodedInput?: string,
  taskExecutionId?: string,
): HistoryEvent {
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

export function newTaskFailedEvent(
  eventId: number,
  details: TaskFailureDetails,
  taskExecutionId?: string,
): HistoryEvent {
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
  options?: RoutingOptions,
): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    router: options?.targetAppId
      ? create(TaskRouterSchema, { sourceAppID: options.sourceAppId, targetAppID: options.targetAppId })
      : undefined,
    workflowActionType: {
      case: "scheduleTask",
      value: create(ScheduleTaskActionSchema, {
        name,
        input: encodedInput,
        taskExecutionId: taskExecutionId ?? "",
        historyPropagationScope: options?.propagationScope || undefined,
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
  options?: RoutingOptions,
): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    router: options?.targetAppId
      ? create(TaskRouterSchema, { sourceAppID: options.sourceAppId, targetAppID: options.targetAppId })
      : undefined,
    workflowActionType: {
      case: "createChildWorkflow",
      value: create(CreateChildWorkflowActionSchema, {
        name,
        instanceId,
        input: encodedInput,
        historyPropagationScope: options?.propagationScope || undefined,
      }),
    },
  });
}

export function newCreateDetachedWorkflowAction(
  id: number,
  name: string,
  instanceId: string,
  encodedInput?: string,
  startAt?: Date,
  options?: RoutingOptions,
): WorkflowAction {
  return create(WorkflowActionSchema, {
    id,
    router: options?.targetAppId
      ? create(TaskRouterSchema, { sourceAppID: options.sourceAppId, targetAppID: options.targetAppId })
      : undefined,
    workflowActionType: {
      case: "createDetachedWorkflow",
      value: create(CreateDetachedWorkflowActionSchema, {
        name,
        instanceId,
        input: encodedInput,
        scheduledStartTimestamp: startAt === undefined ? undefined : dateToTimestamp(startAt),
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

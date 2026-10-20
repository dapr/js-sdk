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

import type {
  HistoryEvent,
  PropagatedHistory as HistoryMessage,
} from "../../../proto/dapr/proto/durabletask/v1/history_events_pb";
import { create } from "@bufbuild/protobuf";
import {
  WorkflowVersionSchema,
  type WorkflowVersion,
  type TaskRouter,
} from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import type { AnyGenerator } from "../context/OrchestrationContext";
import { OrchestrationStatus } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { OrchestrationRuntimeContext } from "../context/OrchestrationRuntimeContext";
import { Task, NonDeterminismError, StopIterationError } from "../task";
import type { CompletableTask } from "../task";
import { Registry } from "./Registry";
import { OrchestrationExecuteResult } from "./OrchestrationExecuteResult";
import {
  isEmpty,
  getOrchestrationStatusStr,
  decodePropagatedHistory,
  newFailureDetails,
  toError,
} from "./protoHelpers";
import { Logger } from "../../../logger/Logger";
import { IDaprSerializer } from "../../../serialization/IDaprSerializer";
import { deserializeWorkflowValue } from "../../../serialization/Serialization.util";
import { serializeWorkflowValue } from "../../../serialization/Serialization.util";
import type { BinaryStoreWorkflowPayloadResolver } from "../../payloads/BinaryStoreWorkflowPayloadResolver";
import { WorkflowPayloadHandler } from "../../payloads/WorkflowPayloadHandler";
import { PayloadReference } from "../../payloads/PayloadReference";
import { PayloadKind } from "../../payloads/BinaryStorePayloadOptions";
import {
  PayloadIntegrityError,
  PayloadNotFoundError,
  PayloadNotResolvableError,
  PayloadRehydrationLimitError,
} from "../../payloads/PayloadErrors";
import { TransientWorkItemError, isRetryableRpcError } from "./TransientWorkItemError";

const WORKFLOW_SEMANTICS_PATCH = "dapr-js:workflow-semantics-v2";

/** Errors that a re-executed turn would reproduce; retrying them would loop forever. */
function isDeterministicPayloadError(error: unknown): boolean {
  return (
    error instanceof PayloadNotResolvableError ||
    error instanceof PayloadNotFoundError ||
    error instanceof PayloadIntegrityError ||
    error instanceof PayloadRehydrationLimitError ||
    error instanceof TypeError ||
    error instanceof RangeError ||
    !isRetryableRpcError(error)
  );
}

function isWorkflowGenerator(value: unknown): value is AnyGenerator<Task<unknown>> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    "next" in value &&
    typeof value.next === "function" &&
    "throw" in value &&
    typeof value.throw === "function" &&
    ((Symbol.iterator in value && typeof value[Symbol.iterator] === "function") ||
      (Symbol.asyncIterator in value && typeof value[Symbol.asyncIterator] === "function"))
  );
}

export class OrchestrationExecutor {
  private readonly logger = new Logger("Workflow", "OrchestrationExecutor");
  private _isSuspended = false;
  private _suspendedEvents: HistoryEvent[] = [];
  private _useTurnClock = true;
  private _hasTurnClock = false;

  constructor(
    private readonly _registry: Registry,
    private readonly serializer?: IDaprSerializer,
    private readonly payloads?: BinaryStoreWorkflowPayloadResolver,
    private readonly _supportsWorkflowPatches = true,
  ) {}

  async execute(
    instanceId: string,
    oldEvents: HistoryEvent[],
    newEvents: HistoryEvent[],
    router?: TaskRouter,
    propagatedHistory?: HistoryMessage,
  ): Promise<OrchestrationExecuteResult> {
    if (!newEvents?.length) {
      throw new Error("The new history event list must have at least one event in it");
    }

    const events = [...oldEvents, ...newEvents];
    const startEvent = events.find((event) => event.eventType.case === "executionStarted");
    const patches = new Set<string>();
    let historyVersion: WorkflowVersion | undefined;
    for (const event of events) {
      if (event.eventType.case === "workflowStarted" && event.eventType.value.version) {
        historyVersion = event.eventType.value.version;
        for (const patch of historyVersion.patches) patches.add(patch);
      }
    }
    // Unmarked committed histories must retain their original clock and GUID values on replay.
    const legacy =
      !patches.has(WORKFLOW_SEMANTICS_PATCH) &&
      (!this._supportsWorkflowPatches || oldEvents.some((event) => event.eventType.case === "workflowStarted"));
    this._useTurnClock = !legacy;
    this._hasTurnClock = false;
    if (!legacy) patches.add(WORKFLOW_SEMANTICS_PATCH);
    const version = legacy
      ? historyVersion
      : create(WorkflowVersionSchema, { ...historyVersion, patches: [...patches] });
    const executionId =
      startEvent?.eventType.case === "executionStarted"
        ? startEvent.eventType.value.workflowInstance?.executionId
        : undefined;
    const executionIdentity = startEvent?.timestamp
      ? JSON.stringify([executionId ?? "", startEvent.timestamp.seconds.toString(), startEvent.timestamp.nanos])
      : executionId;
    const appRouter = startEvent?.router ?? router;
    const appId = appRouter?.targetAppID || appRouter?.sourceAppID;
    const workflowName = startEvent?.eventType.case === "executionStarted" ? startEvent.eventType.value.name : "";
    const taskExecutionIds = new Map<number, string>();
    for (const event of events) {
      if (event.eventType.case === "taskScheduled") {
        taskExecutionIds.set(event.eventId, event.eventType.value.taskExecutionId);
      }
    }

    const handler = new WorkflowPayloadHandler(this.payloads, this.serializer, true);
    let ctx = new OrchestrationRuntimeContext(
      instanceId,
      appId,
      undefined,
      workflowName,
      this.serializer,
      taskExecutionIds,
      handler,
    );
    try {
      const history = decodePropagatedHistory(propagatedHistory);
      ctx = new OrchestrationRuntimeContext(
        instanceId,
        appId,
        history,
        workflowName,
        this.serializer,
        taskExecutionIds,
        handler,
        executionIdentity,
        legacy,
      );
      this.logger.debug(`${instanceId}: Rebuilding local state with ${oldEvents.length} history event...`);
      ctx._isReplaying = true;

      for (const oldEvent of oldEvents) {
        await this.processEvent(ctx, oldEvent);
      }

      this.logger.info(`${instanceId}: Processing ${newEvents.length} new history event(s)`);
      ctx._isReplaying = false;

      for (const newEvent of newEvents) {
        await this.processEvent(ctx, newEvent);
      }
    } catch (e: unknown) {
      ctx.setFailed(toError(e));
    }

    if (!ctx._isComplete) {
      const taskCount = Object.keys(ctx._pendingTasks).length;
      const eventCount = Object.keys(ctx._pendingEvents).length;
      this.logger.info(`${instanceId}: Waiting for ${taskCount} task(s) and ${eventCount} event(s) to complete...`);
    } else if (ctx._completionStatus && ctx._completionStatus !== OrchestrationStatus.CONTINUED_AS_NEW) {
      const completionStatusStr = getOrchestrationStatusStr(ctx._completionStatus);
      this.logger.info(`${instanceId}: Orchestration completed with status ${completionStatusStr}`);
    }

    let actions = ctx.getActions();
    let encodedCustomStatus: string | undefined;
    try {
      await handler.encodeActions(
        actions,
        instanceId,
        startEvent?.eventType.case === "executionStarted" && !!startEvent.eventType.value.parentInstance,
      );
      encodedCustomStatus = await handler.encode(
        ctx._customStatus != null ? serializeWorkflowValue(ctx._customStatus, this.serializer) : undefined,
        { kind: PayloadKind.CustomStatus, instanceId },
      );
    } catch (error) {
      if (!isDeterministicPayloadError(error)) {
        this.logger.warn(
          `${instanceId}: Payload offloading failed transiently; releasing the work item for redelivery: ${
            toError(error).message
          }`,
        );
        throw new TransientWorkItemError(`Payload offloading failed for '${instanceId}'`, error);
      }
      ctx.setFailed(error instanceof Error ? error : new Error(String(error)));
      actions = ctx.getActions();
    }
    this.logger.info(`${instanceId}: Returning ${actions.length} action(s)`);

    return new OrchestrationExecuteResult(actions, ctx._customStatus, encodedCustomStatus, version);
  }

  private async processEvent(ctx: OrchestrationRuntimeContext, event: HistoryEvent): Promise<void> {
    if (ctx._isComplete) {
      const continued = ctx._completionStatus === OrchestrationStatus.CONTINUED_AS_NEW;
      const completed = ctx._completionStatus === OrchestrationStatus.COMPLETED;
      const confirmation =
        ((completed || continued) && event.eventType.case === "eventSent") ||
        (completed && event.eventType.case === "detachedWorkflowInstanceCreated");
      if (!confirmation && !(continued && event.eventType.case === "eventRaised")) {
        return;
      }
    }

    if (this._isSuspended && this.isSuspendable(event)) {
      this.logger.info("Suspended, buffering event");
      this._suspendedEvents.push(event);
      return;
    }

    const eventType = event.eventType;
    if (
      event.timestamp &&
      (!this._useTurnClock ||
        eventType.case === "workflowStarted" ||
        (!this._hasTurnClock && eventType.case === "executionStarted"))
    ) {
      ctx.currentUtcDateTime = new Date(Number(event.timestamp.seconds) * 1000 + event.timestamp.nanos / 1_000_000);
      if (eventType.case === "workflowStarted") this._hasTurnClock = true;
    }
    if (!eventType) {
      this.logger.info(`Unknown history event type, skipping...`);
      return;
    }

    try {
      await this.dispatchEvent(ctx, event);
    } catch (e: unknown) {
      if (e instanceof StopIterationError) {
        ctx.setComplete(e.value, OrchestrationStatus.COMPLETED);
        return;
      }

      this.logger.error(`Could not process the event ${eventType.case} due to error ${toError(e).message}`);
      throw e;
    }
  }

  private async dispatchEvent(ctx: OrchestrationRuntimeContext, event: HistoryEvent): Promise<void> {
    const eventType = event.eventType;
    switch (eventType.case) {
      case "workflowStarted":
        break;

      case "executionStarted": {
        const executionStartedEvent = eventType.value;
        const fn = this._registry.getOrchestrator(executionStartedEvent.name);

        if (!fn) {
          throw new Error(`Orchestrator '${executionStartedEvent.name}' is not registered.`);
        }

        let input: unknown = undefined;
        const rawInput = executionStartedEvent.input;
        if (rawInput != null && rawInput !== "") {
          input = await ctx.payloadHandler.read(rawInput, this._registry.expectsReference(executionStartedEvent.name));
        }

        const result = await fn(ctx, input);
        if (isWorkflowGenerator(result)) {
          await ctx.run(result);
        } else {
          ctx.setComplete(result, OrchestrationStatus.COMPLETED);
        }

        break;
      }

      case "timerCreated": {
        const timerId = event.eventId;
        const action = ctx._pendingActions[timerId];
        delete ctx._pendingActions[timerId];

        if (!action) {
          throw new NonDeterminismError(
            `A previous execution called createTimer with ID=${timerId} but the current execution doesn't have this action with this ID.`,
          );
        }

        const actionType = action.workflowActionType;
        if (actionType.case !== "createTimer") {
          throw new NonDeterminismError(
            `Failed to restore orchestration state: A previous execution called createTimer with ID=${timerId}, but the current execution is instead trying to call a different action.`,
          );
        }
        break;
      }

      case "timerFired": {
        const timerFiredEvent = eventType.value;
        const timerId = timerFiredEvent.timerId;

        let timerTask;
        if (timerId !== undefined) {
          timerTask = ctx._pendingTasks[timerId];
          delete ctx._pendingTasks[timerId];
        }

        if (timerTask?.isComplete) {
          return;
        }
        if (!timerTask) {
          if (!ctx._isReplaying) {
            this.logger.warn(`${ctx.instanceId}: Ignoring unexpected timerFired event with ID = ${timerId}`);
          }
          return;
        }

        timerTask.complete(undefined);
        await ctx.resume();
        break;
      }

      case "taskScheduled": {
        const taskId = event.eventId;
        const action = ctx._pendingActions[taskId];
        delete ctx._pendingActions[taskId];

        const actionType = action?.workflowActionType;
        if (!action) {
          throw new NonDeterminismError(
            `A previous execution called callActivity with ID=${taskId} but the current execution doesn't have this action with this ID.`,
          );
        }
        if (actionType.case !== "scheduleTask") {
          throw new NonDeterminismError(
            `Failed to restore orchestration state: A previous execution called callActivity with ID=${taskId}, but the current execution is instead trying to call a different action.`,
          );
        }
        if (actionType.value.name !== eventType.value.name) {
          throw new NonDeterminismError(
            `Failed to restore orchestration state: A previous execution called callActivity with name='${eventType.value.name}' and sequence number ${taskId}, but the current execution is instead trying to call ${actionType.value.name}.`,
          );
        }
        break;
      }

      case "taskCompleted": {
        const taskCompletedEvent = eventType.value;
        const taskId = taskCompletedEvent.taskScheduledId;

        const activityTask = this.takeActivityTask(ctx, taskId, taskCompletedEvent.taskExecutionId, "taskCompleted");
        if (!activityTask) {
          return;
        }

        let result: unknown;
        if (!isEmpty(taskCompletedEvent.result)) {
          try {
            result = await ctx.payloadHandler.read(
              taskCompletedEvent.result,
              ctx.payloadHandler.referenceResults.has(taskId),
            );
          } catch (error) {
            activityTask.fail(
              String(error),
              newFailureDetails(error instanceof Error ? error : new Error(String(error))),
            );
            await ctx.resume();
            break;
          }
        }

        activityTask.complete(result);
        await ctx.resume();
        break;
      }

      case "taskFailed": {
        const taskFailedEvent = eventType.value;
        const taskId = taskFailedEvent.taskScheduledId;

        const activityTask = this.takeActivityTask(ctx, taskId, taskFailedEvent.taskExecutionId, "taskFailed");
        if (!activityTask) {
          return;
        }

        const failureDetails = taskFailedEvent.failureDetails;
        activityTask.fail(
          `${ctx.instanceId}: Activity task #${taskId} failed: ${failureDetails?.errorMessage ?? "Unknown error"}`,
          failureDetails,
        );

        await ctx.resume();
        break;
      }

      case "childWorkflowInstanceCreated": {
        const taskId = event.eventId;
        const action = ctx._pendingActions[taskId];
        delete ctx._pendingActions[taskId];

        const actionType = action?.workflowActionType;
        if (!action) {
          throw new NonDeterminismError(
            `A previous execution called callSubOrchestrator with ID=${taskId} but the current execution doesn't have this action with this ID.`,
          );
        }
        if (actionType.case !== "createChildWorkflow") {
          throw new NonDeterminismError(
            `Failed to restore orchestration state: A previous execution called callSubOrchestrator with ID=${taskId}, but the current execution is instead trying to call a different action.`,
          );
        }
        if (actionType.value.name !== eventType.value.name) {
          throw new NonDeterminismError(
            `Failed to restore orchestration state: A previous execution called callSubOrchestrator with name='${eventType.value.name}' and sequence number ${taskId}, but the current execution is instead trying to call ${actionType.value.name}.`,
          );
        }
        break;
      }

      case "detachedWorkflowInstanceCreated": {
        const instanceId = eventType.value.instanceId;
        const action = Object.values(ctx._pendingActions).find(
          (pending) =>
            pending.workflowActionType.case === "createDetachedWorkflow" &&
            pending.workflowActionType.value.instanceId === instanceId,
        );
        if (!action) {
          throw new NonDeterminismError(
            `A previous execution scheduled a detached workflow with instanceId='${instanceId}', but the current execution doesn't have a matching detached workflow action.`,
          );
        }
        delete ctx._pendingActions[action.id];
        break;
      }

      case "childWorkflowInstanceCompleted": {
        const subCompletedEvent = eventType.value;
        const taskId = subCompletedEvent.taskScheduledId;

        const subOrchTask = ctx._pendingTasks[taskId];
        delete ctx._pendingTasks[taskId];

        if (!subOrchTask) {
          if (!ctx._isReplaying) {
            this.logger.warn(
              `${ctx.instanceId}: Ignoring unexpected childWorkflowInstanceCompleted event with ID = ${taskId}`,
            );
          }
          return;
        }

        let result: unknown;
        if (!isEmpty(subCompletedEvent.result)) {
          try {
            result = await ctx.payloadHandler.read(
              subCompletedEvent.result,
              ctx.payloadHandler.referenceResults.has(taskId),
            );
          } catch (error) {
            subOrchTask.fail(
              String(error),
              newFailureDetails(error instanceof Error ? error : new Error(String(error))),
            );
            await ctx.resume();
            break;
          }
        }

        subOrchTask.complete(result);
        await ctx.resume();
        break;
      }

      case "childWorkflowInstanceFailed": {
        const subFailedEvent = eventType.value;
        const taskId = subFailedEvent.taskScheduledId;

        const subOrchTask = ctx._pendingTasks[taskId];
        delete ctx._pendingTasks[taskId];

        if (!subOrchTask) {
          if (!ctx._isReplaying) {
            this.logger.warn(
              `${ctx.instanceId}: Ignoring unexpected childWorkflowInstanceFailed event with ID = ${taskId}`,
            );
          }
          return;
        }

        const failureDetails = subFailedEvent.failureDetails;
        subOrchTask.fail(
          `${ctx.instanceId}: Sub-orchestration task #${taskId} failed: ${
            failureDetails?.errorMessage ?? "Unknown error"
          }`,
          failureDetails,
        );

        await ctx.resume();
        break;
      }

      case "eventSent": {
        const action = ctx._pendingActions[event.eventId];
        const actionType = action?.workflowActionType;
        if (
          actionType?.case !== "sendEvent" ||
          actionType.value.instance?.instanceId !== eventType.value.instanceId ||
          actionType.value.name !== eventType.value.name
        ) {
          throw new NonDeterminismError(
            `A previous execution sent event '${eventType.value.name}' with ID=${event.eventId}, but the current execution doesn't have a matching sendEvent action.`,
          );
        }
        delete ctx._pendingActions[event.eventId];
        break;
      }

      case "eventRaised": {
        const eventName = eventType.value.name?.toLowerCase();

        if (!ctx._isReplaying) {
          this.logger.info(`${ctx.instanceId}: Event raised: ${eventName}`);
        }

        let taskList;
        if (eventName && !ctx._isComplete) {
          taskList = ctx._pendingEvents[eventName];
        }

        let decodedResult: unknown;

        if (taskList) {
          const eventTask = taskList.shift();

          if (!isEmpty(eventType.value.input)) {
            decodedResult =
              PayloadReference.parse(eventType.value.input) ??
              deserializeWorkflowValue(eventType.value.input ?? "", this.serializer);
          }

          if (eventTask) {
            ctx.completeExternalEvent(eventTask, decodedResult);
          }

          if (taskList.length === 0 && eventName) {
            delete ctx._pendingEvents[eventName];
          }

          await ctx.resume();
        } else {
          let eventList: unknown[] | undefined = [];

          if (eventName) {
            eventList = ctx._receivedEvents[eventName];
            if (!eventList?.length) {
              eventList = [];
              ctx._receivedEvents[eventName] = eventList;
            }
          }

          if (!isEmpty(eventType.value.input)) {
            decodedResult =
              PayloadReference.parse(eventType.value.input) ??
              deserializeWorkflowValue(eventType.value.input ?? "", this.serializer);
          }

          eventList?.push(decodedResult);

          if (!ctx._isReplaying) {
            this.logger.info(
              `${ctx.instanceId}: Event ${eventName} has been buffered as there are no tasks waiting for it.`,
            );
          }
        }
        break;
      }

      case "executionSuspended": {
        if (!this._isSuspended && !ctx._isReplaying) {
          this.logger.info(`${ctx.instanceId}: Execution suspended`);
        }
        this._isSuspended = true;
        break;
      }

      case "executionResumed": {
        if (!this._isSuspended) {
          return;
        }

        this._isSuspended = false;

        // Detach the buffer first: replaying a buffered event must never append to the list being drained.
        const buffered = this._suspendedEvents;
        this._suspendedEvents = [];
        for (const e of buffered) {
          await this.processEvent(ctx, e);
        }
        break;
      }

      case "executionTerminated": {
        if (!ctx._isReplaying) {
          this.logger.info(`${ctx.instanceId}: Execution terminated`);
        }

        let encodedOutput: string | undefined;
        if (!isEmpty(eventType.value.input)) {
          encodedOutput = eventType.value.input;
        }

        ctx.setComplete(encodedOutput, OrchestrationStatus.TERMINATED, true);
        break;
      }

      default:
        this.logger.info(`Unknown history event type: ${eventType.case}, skipping...`);
    }
  }

  private takeActivityTask(
    ctx: OrchestrationRuntimeContext,
    taskId: number,
    executionId: string,
    eventType: "taskCompleted" | "taskFailed",
  ): CompletableTask<unknown> | undefined {
    const task = ctx._pendingTasks[taskId];
    if (!task) {
      if (!ctx._isReplaying) {
        this.logger.warn(`${ctx.instanceId}: Ignoring unexpected ${eventType} event with ID = ${taskId}`);
      }
      return undefined;
    }
    if (executionId && task.executionId && executionId !== task.executionId) {
      this.logger.warn(
        `${ctx.instanceId}: Ignoring ${eventType} event with ID = ${taskId}: task execution ID does not match the pending task`,
      );
      return undefined;
    }
    delete ctx._pendingTasks[taskId];
    return task;
  }

  private isSuspendable(event: HistoryEvent): boolean {
    const eventType = event.eventType;
    if (!eventType) return true;
    return (
      eventType.case !== "executionResumed" &&
      eventType.case !== "executionSuspended" &&
      eventType.case !== "executionTerminated" &&
      (!this._useTurnClock || eventType.case !== "workflowStarted")
    );
  }
}

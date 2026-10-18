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

import type { HistoryEvent } from "../../../proto/dapr/proto/durabletask/v1/history_events_pb";
import type { AnyGenerator } from "../context/OrchestrationContext";
import { OrchestrationStatus } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { OrchestrationRuntimeContext } from "../context/OrchestrationRuntimeContext";
import { Task } from "../task/Task";
import { NonDeterminismError } from "../task/NonDeterminismError";
import { StopIterationError } from "../task/StopIterationError";
import { Registry } from "./Registry";
import { OrchestrationExecuteResult } from "./OrchestrationExecuteResult";
import { isEmpty, getOrchestrationStatusStr } from "./protoHelpers";
import { Logger } from "../../../logger/Logger";

export class OrchestrationExecutor {
  private readonly logger = new Logger("Workflow", "OrchestrationExecutor");
  private _isSuspended = false;
  private _suspendedEvents: HistoryEvent[] = [];

  constructor(private readonly _registry: Registry) {}

  async execute(
    instanceId: string,
    oldEvents: HistoryEvent[],
    newEvents: HistoryEvent[],
  ): Promise<OrchestrationExecuteResult> {
    if (!newEvents?.length) {
      throw new Error("The new history event list must have at least one event in it");
    }

    const ctx = new OrchestrationRuntimeContext(instanceId);

    try {
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
      ctx.setFailed(e as Error);
    }

    if (!ctx._isComplete) {
      const taskCount = Object.keys(ctx._pendingTasks).length;
      const eventCount = Object.keys(ctx._pendingEvents).length;
      this.logger.info(`${instanceId}: Waiting for ${taskCount} task(s) and ${eventCount} event(s) to complete...`);
    } else if (ctx._completionStatus && ctx._completionStatus !== OrchestrationStatus.CONTINUED_AS_NEW) {
      const completionStatusStr = getOrchestrationStatusStr(ctx._completionStatus);
      this.logger.info(`${instanceId}: Orchestration completed with status ${completionStatusStr}`);
    }

    const actions = ctx.getActions();
    this.logger.info(`${instanceId}: Returning ${actions.length} action(s)`);

    return new OrchestrationExecuteResult(actions, ctx._customStatus);
  }

  private async processEvent(ctx: OrchestrationRuntimeContext, event: HistoryEvent): Promise<void> {
    if (this._isSuspended && this.isSuspendable(event)) {
      this.logger.info("Suspended, buffering event");
      this._suspendedEvents.push(event);
      return;
    }

    const eventType = event.eventType;
    if (event.timestamp) {
      ctx.currentUtcDateTime = new Date(Number(event.timestamp.seconds) * 1000 + event.timestamp.nanos / 1_000_000);
    }
    if (!eventType) {
      this.logger.info(`Unknown history event type, skipping...`);
      return;
    }

    try {
      switch (eventType.case) {
        case "workflowStarted":
          ctx.currentUtcDateTime = event.timestamp
            ? new Date(Number(event.timestamp.seconds) * 1000 + event.timestamp.nanos / 1_000_000)
            : ctx.currentUtcDateTime;
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
            input = JSON.parse(rawInput);
          }

          const result = await fn(ctx, input);
          const isGenerator =
            typeof (result as AsyncGenerator)?.[Symbol.asyncIterator] === "function" ||
            typeof (result as Generator)?.[Symbol.iterator] === "function";

          if (isGenerator) {
            await ctx.run(result as AnyGenerator<Task<unknown>>);
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

          let activityTask;
          if (taskId !== undefined) {
            activityTask = ctx._pendingTasks[taskId];
            delete ctx._pendingTasks[taskId];
          }

          if (!activityTask) {
            if (!ctx._isReplaying) {
              this.logger.warn(`${ctx.instanceId}: Ignoring unexpected taskCompleted event with ID = ${taskId}`);
            }
            return;
          }

          let result: unknown;
          if (!isEmpty(taskCompletedEvent.result)) {
            result = JSON.parse(taskCompletedEvent.result ?? "");
          }

          activityTask.complete(result);
          await ctx.resume();
          break;
        }

        case "taskFailed": {
          const taskFailedEvent = eventType.value;
          const taskId = taskFailedEvent.taskScheduledId;

          let activityTask;
          if (taskId !== undefined) {
            activityTask = ctx._pendingTasks[taskId];
            delete ctx._pendingTasks[taskId];
          }

          if (!activityTask) {
            if (!ctx._isReplaying) {
              this.logger.warn(`${ctx.instanceId}: Ignoring unexpected taskFailed event with ID = ${taskId}`);
            }
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

        case "childWorkflowInstanceCompleted": {
          const subCompletedEvent = eventType.value;
          const taskId = subCompletedEvent.taskScheduledId;

          let subOrchTask;
          if (taskId !== undefined) {
            subOrchTask = ctx._pendingTasks[taskId];
            delete ctx._pendingTasks[taskId];
          }

          let result: unknown;
          if (!isEmpty(subCompletedEvent.result)) {
            result = JSON.parse(subCompletedEvent.result ?? "");
          }

          if (subOrchTask) {
            subOrchTask.complete(result);
          }

          await ctx.resume();
          break;
        }

        case "childWorkflowInstanceFailed": {
          const subFailedEvent = eventType.value;
          const taskId = subFailedEvent.taskScheduledId;

          let subOrchTask;
          if (taskId !== undefined) {
            subOrchTask = ctx._pendingTasks[taskId];
            delete ctx._pendingTasks[taskId];
          }

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

        case "eventRaised": {
          const eventName = eventType.value.name?.toLowerCase();

          if (!ctx._isReplaying) {
            this.logger.info(`${ctx.instanceId}: Event raised: ${eventName}`);
          }

          let taskList;
          if (eventName) {
            taskList = ctx._pendingEvents[eventName];
          }

          let decodedResult: unknown;

          if (taskList) {
            const eventTask = taskList.shift();

            if (!isEmpty(eventType.value.input)) {
              decodedResult = JSON.parse(eventType.value.input ?? "");
            }

            if (eventTask) {
              eventTask.complete(decodedResult);
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
              decodedResult = JSON.parse(eventType.value.input ?? "");
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

          for (const e of this._suspendedEvents) {
            await this.processEvent(ctx, e);
          }

          this._suspendedEvents = [];
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
    } catch (e: unknown) {
      if (e instanceof StopIterationError) {
        ctx.setComplete(e.value, OrchestrationStatus.COMPLETED);
        return;
      }

      this.logger.error(`Could not process the event ${eventType.case} due to error ${(e as Error).message}`);
      throw e;
    }
  }

  private isSuspendable(event: HistoryEvent): boolean {
    const eventType = event.eventType;
    if (!eventType) return true;
    return eventType.case !== "executionResumed" && eventType.case !== "executionTerminated";
  }
}

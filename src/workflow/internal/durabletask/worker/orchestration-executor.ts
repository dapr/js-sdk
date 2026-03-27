/*
Copyright 2024 The Dapr Authors
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

import {
  getNewEventSummary,
  getNonDeterminismError,
  getWrongActionNameError,
  getWrongActionTypeError,
  isSuspendable,
} from ".";
import * as pb from "../proto/orchestrator_service_pb";
import { getName } from "../task";
import { OrchestrationStateError } from "../task/exception/orchestration-state-error";
import { TOrchestrator } from "../types/orchestrator.type";
import { enumValueToKey } from "../utils/enum.util";
import { getOrchestrationStatusStr, isEmpty } from "../utils/pb-helper.util";
import { OrchestratorNotRegisteredError } from "./exception/orchestrator-not-registered-error";
import { StopIterationError } from "./exception/stop-iteration-error";
import { OrchestrationExecuteResult } from "./orchestration-execute-result";
import { Registry } from "./registry";
import { RuntimeOrchestrationContext } from "./runtime-orchestration-context";

export class OrchestrationExecutor {
  _generator?: TOrchestrator;
  _registry: Registry;
  _isSuspended: boolean;
  _suspendedEvents: pb.HistoryEvent[];

  constructor(registry: Registry) {
    this._registry = registry;
    this._generator = undefined;
    this._isSuspended = false;
    this._suspendedEvents = [];
  }

  async execute(
    instanceId: string,
    oldEvents: pb.HistoryEvent[],
    newEvents: pb.HistoryEvent[],
  ): Promise<OrchestrationExecuteResult> {
    if (!newEvents?.length) {
      throw new OrchestrationStateError("The new history event list must have at least one event in it");
    }

    const ctx = new RuntimeOrchestrationContext(instanceId);

    try {
      // Rebuild the local state by replaying the history events into the orchestrator function
      console.info(`${instanceId}: Rebuilding local state with ${oldEvents.length} history event...`);
      ctx._isReplaying = true;

      for (const oldEvent of oldEvents) {
        await this.processEvent(ctx, oldEvent);
      }

      // Get new actions by executing newly received events into the orchestrator function
      const summary = getNewEventSummary(newEvents);
      console.info(`${instanceId}: Processing ${newEvents.length} new history event(s): ${summary}`);
      ctx._isReplaying = false;

      for (const newEvent of newEvents) {
        await this.processEvent(ctx, newEvent);
      }
    } catch (e: any) {
      ctx.setFailed(e);
    }

    if (!ctx._isComplete) {
      const taskCount = Object.keys(ctx._pendingTasks).length;
      const eventCount = Object.keys(ctx._pendingEvents).length;
      console.log(`${instanceId}: Waiting for ${taskCount} task(s) and ${eventCount} event(s) to complete...`);
    } else if (
      ctx._completionStatus &&
      ctx._completionStatus !== pb.OrchestrationStatus.ORCHESTRATION_STATUS_CONTINUED_AS_NEW
    ) {
      const completionStatusStr = getOrchestrationStatusStr(ctx._completionStatus);
      console.log(`${instanceId}: Orchestration completed with status ${completionStatusStr}`);
    }

    const actions = ctx.getActions();
    console.log(`${instanceId}: Returning ${actions.length} action(s)`);

    return new OrchestrationExecuteResult(actions, ctx._customStatus);
  }

  private async processEvent(ctx: RuntimeOrchestrationContext, event: pb.HistoryEvent): Promise<void> {
    // Check if we are suspended to see if we need to buffer the event until we are resumed
    if (this._isSuspended && isSuspendable(event)) {
      console.log("Suspended, buffering event");
      this._suspendedEvents.push(event);
      return;
    }

    const eventType = event.getEventtypeCase();
    const eventTypeName = enumValueToKey(pb.HistoryEvent.EventtypeCase, eventType);

    // console.debug(`DEBUG - Processing event type ${eventTypeName} (${event.getEventtypeCase()})`);

    // Process the event type
    try {
      switch (eventType) {
        case pb.HistoryEvent.EventtypeCase.ORCHESTRATORSTARTED:
          ctx._currentUtcDatetime = event.getTimestamp()?.toDate();
          break;
        case pb.HistoryEvent.EventtypeCase.EXECUTIONSTARTED:
          {
            // TODO: Check if we already started the orchestration
            const executionStartedEvent = event.getExecutionstarted();
            const fn = this._registry.getOrchestrator(
              executionStartedEvent ? executionStartedEvent.getName() : undefined,
            );

            if (!fn) {
              throw new OrchestratorNotRegisteredError(executionStartedEvent?.getName());
            }

            // Deserialize the input, if any
            let input = undefined;

            if (executionStartedEvent?.getInput() && executionStartedEvent?.getInput()?.toString() !== "") {
              input = JSON.parse(executionStartedEvent.getInput()?.toString() || "{}");
            }

            // This does not execute the generator, it creates it
            // since we create an async iterator, we await the creation (so we can use await in the generator itself beside yield)
            const result = await fn(ctx, input);

            const isAsyncGenerator = typeof result?.[Symbol.asyncIterator] === "function";
            if (isAsyncGenerator) {
              // Start the orchestrator's generator function
              await ctx.run(result);
            } else {
              const resultType = Object.prototype.toString.call(result);
              console.log(`An orchestrator was returned that doesn't schedule any tasks (type = ${resultType})`);

              // This is an orchestrator that doesn't schedule any tasks
              ctx.setComplete(result, pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
            }
          }
          break;
        case pb.HistoryEvent.EventtypeCase.TIMERCREATED:
          // This history event confirms that the timer was successfully scheduled. Remove the timerCreated event from the pending action list so we don't schedule it again.
          {
            const timerId = event.getEventid();
            const action = ctx._pendingActions[timerId];

            // Delete it
            delete ctx._pendingActions[timerId];

            const isTimerAction = action?.getCreatetimer();

            if (!action) {
              throw getNonDeterminismError(timerId, getName(ctx.createTimer));
            } else if (!isTimerAction) {
              const expectedMethodName = getName(ctx.createTimer);
              throw getWrongActionTypeError(timerId, expectedMethodName, action);
            }
          }
          break;
        case pb.HistoryEvent.EventtypeCase.TIMERFIRED:
          {
            const timerFiredEvent = event.getTimerfired();
            const timerId = timerFiredEvent ? timerFiredEvent.getTimerid() : undefined;

            let timerTask;

            if (timerId) {
              timerTask = ctx._pendingTasks[timerId];
              delete ctx._pendingTasks[timerId];
            }

            if (!timerTask) {
              // TODO: Should this be an error? When would it ever happen?
              if (!ctx._isReplaying) {
                console.warn(`${ctx._instanceId}: Ignoring unexpected timerFired event with ID = ${timerId}`);
              }

              return;
            }

            timerTask.complete(undefined);
            await ctx.resume();
          }
          break;
        // This history event confirms that the activity execution was successfully scheduled. Remove the taskscheduled event from the pending action list so we don't schedule it again.
        case pb.HistoryEvent.EventtypeCase.TASKSCHEDULED:
          {
            const taskId = event.getEventid();
            const action = ctx._pendingActions[taskId];
            delete ctx._pendingActions[taskId];

            const isScheduleTaskAction = action?.hasScheduletask();

            if (!action) {
              throw getNonDeterminismError(taskId, getName(ctx.callActivity));
            } else if (!isScheduleTaskAction) {
              const expectedMethodName = getName(ctx.callActivity);
              throw getWrongActionTypeError(taskId, expectedMethodName, action);
            } else if (action.getScheduletask()?.getName() != event.getTaskscheduled()?.getName()) {
              throw getWrongActionNameError(
                taskId,
                getName(ctx.callActivity),
                event.getTaskscheduled()?.getName(),
                action.getScheduletask()?.getName(),
              );
            }
          }

          break;
        // This history event contains the result of a completed activity task
        case pb.HistoryEvent.EventtypeCase.TASKCOMPLETED:
          {
            const taskCompletedEvent = event.getTaskcompleted();
            const taskId = taskCompletedEvent ? taskCompletedEvent.getTaskscheduledid() : undefined;

            let activityTask;

            if (taskId) {
              activityTask = ctx._pendingTasks[taskId];
              delete ctx._pendingTasks[taskId];
            }

            if (!activityTask) {
              // TODO: Should this be an error? When would it ever happen?
              if (!ctx._isReplaying) {
                console.warn(`${ctx._instanceId}: Ignoring unexpected taskCompleted event with ID = ${taskId}`);
              }

              return;
            }

            let result;

            if (!isEmpty(event.getTaskcompleted()?.getResult())) {
              result = JSON.parse(event.getTaskcompleted()?.getResult()?.toString() || "");
            }

            activityTask.complete(result);
            await ctx.resume();
          }
          break;
        case pb.HistoryEvent.EventtypeCase.TASKFAILED:
          {
            const taskFailedEvent = event.getTaskfailed();
            const taskId = taskFailedEvent ? taskFailedEvent.getTaskscheduledid() : undefined;

            let activityTask;

            if (taskId) {
              activityTask = ctx._pendingTasks[taskId];
              delete ctx._pendingTasks[taskId];
            }

            if (!activityTask) {
              // TODO: Should this be an error? When would it ever happen?
              if (!ctx._isReplaying) {
                console.warn(`${ctx._instanceId}: Ignoring unexpected taskFailed event with ID = ${taskId}`);
              }

              return;
            }

            activityTask.fail(
              `${ctx._instanceId}: Activity task #${taskId} failed: ${event
                .getTaskfailed()
                ?.getFailuredetails()
                ?.getErrormessage()}`,
              event.getTaskfailed()?.getFailuredetails(),
            );

            await ctx.resume();
          }
          break;
        // This history event confirms that the sub-orcehstration execution was successfully scheduled. Remove the subOrchestrationInstanceCreated event from the pending action list so we don't schedule it again.
        case pb.HistoryEvent.EventtypeCase.SUBORCHESTRATIONINSTANCECREATED:
          {
            const taskId = event.getEventid();
            const action = ctx._pendingActions[taskId];
            delete ctx._pendingActions[taskId];

            const isCreateSubOrchestrationAction = action?.hasCreatesuborchestration();

            if (!action) {
              throw getNonDeterminismError(taskId, getName(ctx.callSubOrchestrator));
            } else if (!isCreateSubOrchestrationAction) {
              const expectedMethodName = getName(ctx.callSubOrchestrator);
              throw getWrongActionTypeError(taskId, expectedMethodName, action);
            } else if (
              action.getCreatesuborchestration()?.getName() != event.getSuborchestrationinstancecreated()?.getName()
            ) {
              throw getWrongActionNameError(
                taskId,
                getName(ctx.callSubOrchestrator),
                action.getCreatesuborchestration()?.getName(),
                action.getCreatesuborchestration()?.getName(),
              );
            }
          }
          break;
        case pb.HistoryEvent.EventtypeCase.SUBORCHESTRATIONINSTANCECOMPLETED:
          {
            const subOrchestrationInstanceCompletedEvent = event.getSuborchestrationinstancecompleted();
            const taskId = subOrchestrationInstanceCompletedEvent
              ? subOrchestrationInstanceCompletedEvent.getTaskscheduledid()
              : undefined;

            let subOrchTask;

            if (taskId) {
              subOrchTask = ctx._pendingTasks[taskId];
              delete ctx._pendingTasks[taskId];
            }

            let result;

            if (!isEmpty(event.getSuborchestrationinstancecompleted()?.getResult())) {
              result = JSON.parse(event.getSuborchestrationinstancecompleted()?.getResult()?.toString() || "");
            }

            if (subOrchTask) {
              subOrchTask.complete(result);
            }

            await ctx.resume();
          }
          break;
        case pb.HistoryEvent.EventtypeCase.SUBORCHESTRATIONINSTANCEFAILED:
          {
            const subOrchestrationInstanceFailedEvent = event.getSuborchestrationinstancefailed();
            const taskId = subOrchestrationInstanceFailedEvent
              ? subOrchestrationInstanceFailedEvent.getTaskscheduledid()
              : undefined;

            let subOrchTask;

            if (taskId) {
              subOrchTask = ctx._pendingTasks[taskId];
              delete ctx._pendingTasks[taskId];
            }

            if (!subOrchTask) {
              // TODO: Should this be an error? When would it ever happen?
              if (!ctx._isReplaying) {
                console.warn(
                  `${ctx._instanceId}: Ignoring unexpected subOrchestrationInstanceFailed event with ID = ${taskId}`,
                );
              }

              return;
            }

            subOrchTask.fail(
              `${ctx._instanceId}: Sub-orchestration task #${taskId} failed: ${event
                .getSuborchestrationinstancefailed()
                ?.getFailuredetails()
                ?.getErrormessage()}`,
              event.getSuborchestrationinstancefailed()?.getFailuredetails(),
            );

            await ctx.resume();
          }
          break;
        case pb.HistoryEvent.EventtypeCase.EVENTRAISED:
          {
            // Event names are case-insensitive
            const eventName = event.getEventraised()?.getName()?.toLowerCase();

            if (!ctx._isReplaying) {
              console.log(`${ctx._instanceId}: Event raised: ${eventName}`);
            }

            let taskList;

            if (eventName) {
              taskList = ctx._pendingEvents[eventName];
            }

            let decodedResult;

            if (taskList) {
              const eventTask = taskList.shift();

              if (!isEmpty(event.getEventraised()?.getInput())) {
                decodedResult = JSON.parse(event.getEventraised()?.getInput()?.toString() || "");
              }

              if (eventTask) {
                eventTask.complete(decodedResult);
              }

              if (!taskList && eventName) {
                delete ctx._pendingEvents[eventName];
              }

              await ctx.resume();
            } else {
              // Buffer the event
              let eventList: any[] | undefined = [];

              if (eventName) {
                eventList = ctx._receivedEvents[eventName];

                if (!eventList?.length) {
                  eventList = [];
                  ctx._receivedEvents[eventName] = eventList;
                }
              }

              if (!isEmpty(event.getEventraised()?.getInput())) {
                decodedResult = JSON.parse(event.getEventraised()?.getInput()?.toString() || "");
              }

              eventList?.push(decodedResult);

              if (!ctx._isReplaying) {
                console.log(
                  `${ctx._instanceId}: Event ${eventName} has been buffered as there are no tasks waiting for it.`,
                );
              }
            }
          }
          break;
        case pb.HistoryEvent.EventtypeCase.EXECUTIONSUSPENDED:
          {
            if (!this._isSuspended && !ctx._isReplaying) {
              console.log(`${ctx._instanceId}: Execution suspended`);
            }

            this._isSuspended = true;
          }
          break;
        case pb.HistoryEvent.EventtypeCase.EXECUTIONRESUMED:
          if (!this._isSuspended) {
            return;
          }

          this._isSuspended = false;

          for (const e of this._suspendedEvents) {
            await this.processEvent(ctx, e);
          }

          this._suspendedEvents = [];
          break;
        case pb.HistoryEvent.EventtypeCase.EXECUTIONTERMINATED: {
          if (!ctx._isReplaying) {
            console.log(`${ctx._instanceId}: Execution terminated`);
          }

          let encodedOutput;

          if (!isEmpty(event.getExecutionterminated()?.getInput())) {
            encodedOutput = event.getExecutionterminated()?.getInput()?.getValue();
          }

          ctx.setComplete(encodedOutput, pb.OrchestrationStatus.ORCHESTRATION_STATUS_TERMINATED, true);
          break;
        }
        default:
          console.info(`Unknown history event type: ${eventTypeName} (value: ${eventType}), skipping...`);
        // throw new OrchestrationStateError(`Unknown history event type: ${eventTypeName} (value: ${eventType})`);
      }
    } catch (e: any) {
      // StopIteration is thrown when the generator is finished and didn't return a task as its next action
      if (e instanceof StopIterationError) {
        ctx.setComplete(e.value, pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
        return;
      }

      // For the rest we don't do anything
      // Else we throw it upwards
      console.error(`Could not process the event ${eventTypeName} due to error ${e}`);
      throw e;
    }
  }
}

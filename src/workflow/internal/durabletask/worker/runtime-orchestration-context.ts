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

import { getName } from "../task";
import { OrchestrationContext } from "../task/context/orchestration-context";
import * as pb from "../proto/orchestrator_service_pb";
import * as ph from "../utils/pb-helper.util";
import { CompletableTask } from "../task/completable-task";
import { TActivity } from "../types/activity.type";
import { TOrchestrator } from "../types/orchestrator.type";
import { Task } from "../task/task";
import { StopIterationError } from "./exception/stop-iteration-error";

export class RuntimeOrchestrationContext extends OrchestrationContext {
  _generator?: Generator<Task<any>, any, any>;
  _previousTask?: Task<any>;
  _isReplaying: boolean;
  _isComplete: boolean;
  _result: any;
  _pendingActions: Record<number, pb.OrchestratorAction>;
  _pendingTasks: Record<number, CompletableTask<any>>;
  _sequenceNumber: any;
  _currentUtcDatetime: any;
  _instanceId: string;
  _completionStatus?: pb.OrchestrationStatus;
  _receivedEvents: Record<string, any[]>;
  _pendingEvents: Record<string, CompletableTask<any>[]>;
  _newInput?: any;
  _saveEvents: any;
  _customStatus: string;

  constructor(instanceId: string) {
    super();

    this._generator = undefined;
    this._isReplaying = true;
    this._isComplete = false;
    this._result = undefined;
    this._pendingActions = {};
    this._pendingTasks = {};
    this._sequenceNumber = 0;
    this._currentUtcDatetime = new Date(1000, 0, 1);
    this._instanceId = instanceId;
    this._completionStatus = undefined;
    this._receivedEvents = {};
    this._pendingEvents = {};
    this._newInput = undefined;
    this._saveEvents = false;
    this._customStatus = "";
  }

  get instanceId(): string {
    return this._instanceId;
  }

  get currentUtcDateTime(): Date {
    return this._currentUtcDatetime;
  }

  get isReplaying(): boolean {
    return this._isReplaying;
  }

  /**
   * This is the main entry point for the orchestrator. It will run the generator
   * and return the first task to be executed. It is typically executed from the
   * orchestrator executor.
   *
   * @param generator
   */
  async run(generator: Generator<Task<any>, any, any>) {
    this._generator = generator;

    // TODO: do something with this task
    // start the generator
    const { value, done } = await this._generator.next();

    // if the generator finished, complete the orchestration.
    if (done) {
      this.setComplete(value, pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED);
      return;
    }

    // TODO: check if the task is null?
    this._previousTask = value;
  }

  async resume() {
    // This is never expected unless maybe there's an issue with the history
    if (!this._generator) {
      throw new Error("The orchestrator generator is not initialized! Was the orchestration history corrupted?");
    }

    // We can resume the generator only if the previously yielded task
    // has reached a completed state. The only time this won't be the
    // case is if the user yielded on a WhenAll task and there are still
    // outstanding child tasks that need to be completed.
    if (this._previousTask) {
      if (this._previousTask.isFailed) {
        // Raise the failure as an exception to the generator. The orchestrator can then either
        // handle the exception or allow it to fail the orchestration.
        const { done, value } = await this._generator.throw(this._previousTask._exception);
        if (done) {
          throw new StopIterationError(value);
        }
        if (!(value instanceof Task)) {
          throw new Error("The orchestrator generator yielded a non-Task object");
        }
        this._previousTask = value;
        // If the new task is already complete, fall through to the isComplete handler
        if (!this._previousTask.isComplete) {
          return;
        }
      }
      if (this._previousTask.isComplete) {
        while (true) {
          // Resume the generator. This will either return a Task or raise StopIteration if it's done.
          // @todo: Should we check for possible infinite loops here?
          // python: next_task = self._generator.send(self._previous_task.get_result())

          // This returns a Promise that we will not await yet
          // the generator will return an IteratorResult with its next value
          // note that we are working with an AsyncGenerator, so we should await
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
          const { done, value }: IteratorResult<Task<any>, any> = await this._generator.next(this._previousTask._result);

          // If we are done, raise StopIteration
          if (done) {
            throw new StopIterationError(value);
          }

          if (!(value instanceof Task)) {
            throw new Error("The orchestrator generator yielded a non-Task object");
          }

          this._previousTask = value;

          // If a completed task was returned, then we can keep running the generator function.
          // TODO: What about the done from the generator?
          if (!this._previousTask.isComplete) {
            break;
          }
        }
      }
    }
  }

  setComplete(result: any, status: pb.OrchestrationStatus, isResultEncoded: boolean = false) {
    if (this._isComplete) {
      return;
    }

    this._isComplete = true;
    this._completionStatus = status;
    this._pendingActions = {}; // Clear any pending actions

    this._result = result;

    let resultJson;

    if (result) {
      resultJson = isResultEncoded ? result : JSON.stringify(result);
    }

    const action = ph.newCompleteOrchestrationAction(this.nextSequenceNumber(), status, resultJson);
    this._pendingActions[action.getId()] = action;
  }

  setFailed(e: Error) {
    // should allow orchestration to fail, even it's completed.
    // if (this._isComplete) {
    //   return;
    // }

    this._isComplete = true;
    this._completionStatus = pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED;
    this._pendingActions = {}; // Cancel any pending actions

    const action = ph.newCompleteOrchestrationAction(
      this.nextSequenceNumber(),
      pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED,
      undefined,
      ph.newFailureDetails(e),
    );
    this._pendingActions[action.getId()] = action;
  }

  setContinuedAsNew(newInput: any, saveEvents: boolean) {
    if (this._isComplete) {
      return;
    }

    this._isComplete = true;
    this._pendingActions = {}; // Clear any pending actions
    this._completionStatus = pb.OrchestrationStatus.ORCHESTRATION_STATUS_CONTINUED_AS_NEW;
    this._newInput = newInput;
    this._saveEvents = saveEvents;
  }

  getActions(): pb.OrchestratorAction[] {
    if (this._completionStatus === pb.OrchestrationStatus.ORCHESTRATION_STATUS_CONTINUED_AS_NEW) {
      // Only return the single completion actions when continuing-as-new
      let carryoverEvents: pb.HistoryEvent[] | null = null;

      if (this._saveEvents) {
        carryoverEvents = [];

        // We need to save the current sent of pending events so that they can be
        // replayed when the new instance starts
        for (const [eventName, values] of Object.entries(this._receivedEvents)) {
          for (const eventValue of values) {
            const encodedValue = eventValue ? JSON.stringify(eventValue) : undefined;
            carryoverEvents.push(ph.newEventRaisedEvent(eventName, encodedValue));
          }
        }
      }

      const action = ph.newCompleteOrchestrationAction(
        this.nextSequenceNumber(),
        pb.OrchestrationStatus.ORCHESTRATION_STATUS_CONTINUED_AS_NEW,
        this._newInput ? JSON.stringify(this._newInput) : undefined,
        undefined,
        carryoverEvents,
      );

      return [action];
    }

    return Object.values(this._pendingActions);
  }

  nextSequenceNumber(): number {
    return ++this._sequenceNumber;
  }

  /**
   * Create a timer
   *
   * @param fireAt number Amount of seconds between now and when the timer should fire
   * @param fireAt Date The date when the timer should fire
   * @returns
   */
  createTimer(fireAt: number | Date): Task<any> {
    const id = this.nextSequenceNumber();

    // If a number is passed, we use it as the number of seconds to wait
    // we use instanceof Date as number is not a native Javascript type
    if (!(fireAt instanceof Date)) {
      fireAt = new Date(Date.now() + fireAt * 1000);
    }

    const action = ph.newCreateTimerAction(id, fireAt);
    this._pendingActions[action.getId()] = action;

    const timerTask = new CompletableTask();
    this._pendingTasks[id] = timerTask;

    return timerTask;
  }

  callActivity<TInput, TOutput>(
    activity: TActivity<TInput, TOutput> | string,
    input?: TInput | undefined,
  ): Task<TOutput> {
    const id = this.nextSequenceNumber();
    const name = typeof activity === "string" ? activity : getName(activity);
    const encodedInput = input ? JSON.stringify(input) : undefined;
    const action = ph.newScheduleTaskAction(id, name, encodedInput);
    this._pendingActions[action.getId()] = action;

    const task = new CompletableTask<TOutput>();
    this._pendingTasks[id] = task;
    return task;
  }

  callSubOrchestrator<TInput, TOutput>(
    orchestrator: TOrchestrator | string,
    input?: TInput | undefined,
    instanceId?: string | undefined,
  ): Task<TOutput> {
    let name;
    if (typeof orchestrator === "string") {
      name = orchestrator;
    } else {
      name = getName(orchestrator);
    }
    const id = this.nextSequenceNumber();

    // Create a deterministic instance ID based on the parent instance ID
    // use the instanceId and apprent the id to it in hexadecimal with 4 digits (e.g. 0001)
    if (!instanceId) {
      const instanceIdSuffix = id.toString(16).padStart(4, "0");
      instanceId = `${this._instanceId}:${instanceIdSuffix}`;
    }

    const encodedInput = input ? JSON.stringify(input) : undefined;
    const action = ph.newCreateSubOrchestrationAction(id, name, instanceId, encodedInput);
    this._pendingActions[action.getId()] = action;

    const task = new CompletableTask<TOutput>();
    this._pendingTasks[id] = task;
    return task;
  }

  waitForExternalEvent<T>(name: string): Task<T> {
    // Check to see if this event has already been received, in which case we
    // can return it immediately. Otherwise, record out intent to receive an
    // event with the given name so that we can resume the generator when it
    // arrives. If there are multiple events with the same name, we return
    // them in the order they were received.
    const externalEventTask = new CompletableTask<T>();
    const eventName = name.toLocaleLowerCase();
    const eventList = this._receivedEvents[eventName];

    if (eventList?.length) {
      const eventData = eventList.shift();

      if (!eventList?.length) {
        delete this._receivedEvents[eventName];
      }

      externalEventTask.complete(eventData);
    } else {
      let taskList = this._pendingEvents[eventName];

      if (!taskList?.length) {
        taskList = [];
        this._pendingEvents[eventName] = taskList;
      }

      taskList.push(externalEventTask);
    }

    return externalEventTask;
  }

  /**
   * Orchestrations can be continued as new. This API allows an  orchestration to restart itself from scratch, optionally with a new input.
   */
  continueAsNew(newInput: any, saveEvents: boolean = false) {
    if (this._isComplete) {
      return;
    }

    this.setContinuedAsNew(newInput, saveEvents);
  }

  setCustomStatus(status: string) {
    this._customStatus = status;
  }
}

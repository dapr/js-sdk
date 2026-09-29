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
import type { WorkflowAction } from "../../../proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";
import type { OrchestrationStatus } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import type { TaskFailureDetails } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { OrchestrationStatus as OrchestrationStatusEnum } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { CompletableTask } from "../task/CompletableTask";
import { Task } from "../task/Task";
import { StopIterationError } from "../task/StopIterationError";
import type { TActivity, TOrchestrator, AnyGenerator } from "./OrchestrationContext";
import { OrchestrationContext } from "./OrchestrationContext";
import { getName } from "../task";
import { newDeterministicGuid } from "../guid/deterministicGuid";
import type { RetryPolicy } from "../../../types/workflow/RetryPolicy.type";
import type { ActivityOptions } from "../../../types/workflow/ActivityOptions.type";
import type { ChildWorkflowOptions } from "../../../types/workflow/ChildWorkflowOptions.type";
import {
  newCompleteWorkflowAction,
  newCreateTimerAction,
  newCreateChildWorkflowAction,
  newScheduleTaskAction,
  newSendEventAction,
  newEventRaisedEvent,
  newFailureDetails,
} from "../worker/protoHelpers";

export class OrchestrationRuntimeContext extends OrchestrationContext {
  private _generator?: AnyGenerator<Task<unknown>>;
  private _previousTask?: Task<unknown>;

  _isReplaying: boolean;
  _isComplete: boolean;
  _result: unknown;
  _pendingActions: Record<number, WorkflowAction>;
  _pendingTasks: Record<number, CompletableTask<unknown>>;
  private _sequenceNumber: number;
  private _currentUtcDatetime: Date;
  private readonly _instanceId: string;
  _completionStatus?: OrchestrationStatus;
  _receivedEvents: Record<string, unknown[]>;
  _pendingEvents: Record<string, CompletableTask<unknown>[]>;
  private _newInput?: unknown;
  private _saveEvents: boolean;
  _customStatus: unknown;
  private _guidCounter: number;

  constructor(instanceId: string) {
    super();
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
    this._guidCounter = 0;
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

  set currentUtcDateTime(value: Date) {
    this._currentUtcDatetime = value;
  }

  async run(generator: AnyGenerator<Task<unknown>>): Promise<void> {
    this._generator = generator;
    const { value, done } = await generator.next();

    if (done) {
      this.setComplete(value, OrchestrationStatusEnum.COMPLETED);
      return;
    }

    this._previousTask = value;
  }

  async resume(): Promise<void> {
    if (!this._generator) {
      throw new Error("The orchestrator generator is not initialized! Was the orchestration history corrupted?");
    }

    if (this._previousTask) {
      if (this._previousTask.isFailed) {
        const { done, value } = await this._generator.throw(this._previousTask.getException());
        if (done) {
          throw new StopIterationError(value);
        }
        if (!(value instanceof Task)) {
          throw new Error("The orchestrator generator yielded a non-Task object");
        }
        this._previousTask = value;
        if (!this._previousTask.isComplete) {
          return;
        }
      }
      if (this._previousTask.isComplete) {
        const MAX_ITERATIONS = 100_000;
        let iterations = 0;
        for (;;) {
          if (++iterations > MAX_ITERATIONS) {
            throw new Error(
              `Orchestrator exceeded maximum iteration limit (${MAX_ITERATIONS}). ` +
                "This likely indicates an infinite loop in the orchestrator function.",
            );
          }

          const prevResult: unknown = this._previousTask._result;
          const nextResult: IteratorResult<Task<unknown>, unknown> = await this._generator.next(prevResult);
          const { done, value } = nextResult;

          if (done) {
            throw new StopIterationError(value);
          }

          if (!(value instanceof Task)) {
            throw new Error("The orchestrator generator yielded a non-Task object");
          }

          this._previousTask = value;

          if (!this._previousTask.isComplete) {
            break;
          }
        }
      }
    }
  }

  setComplete(result: unknown, status: OrchestrationStatus, isResultEncoded = false): void {
    if (this._isComplete) return;

    this._isComplete = true;
    this._completionStatus = status;
    this._pendingActions = {};
    this._result = result;

    let resultJson: string | undefined;
    if (result != null) {
      resultJson = isResultEncoded ? (result as string) : JSON.stringify(result);
    }

    const action = newCompleteWorkflowAction(this.nextSequenceNumber(), status, resultJson);
    this._pendingActions[action.id] = action;
  }

  setFailed(e: Error): void {
    this._isComplete = true;
    this._completionStatus = OrchestrationStatusEnum.FAILED;
    this._pendingActions = {};

    const action = newCompleteWorkflowAction(
      this.nextSequenceNumber(),
      OrchestrationStatusEnum.FAILED,
      undefined,
      newFailureDetails(e),
    );
    this._pendingActions[action.id] = action;
  }

  setContinuedAsNew(newInput: unknown, saveEvents: boolean): void {
    if (this._isComplete) return;

    this._isComplete = true;
    this._pendingActions = {};
    this._completionStatus = OrchestrationStatusEnum.CONTINUED_AS_NEW;
    this._newInput = newInput;
    this._saveEvents = saveEvents;
  }

  getActions(): WorkflowAction[] {
    if (this._completionStatus === OrchestrationStatusEnum.CONTINUED_AS_NEW) {
      let carryoverEvents: HistoryEvent[] | null = null;

      if (this._saveEvents) {
        carryoverEvents = [];
        for (const [eventName, values] of Object.entries(this._receivedEvents)) {
          for (const eventValue of values) {
            const encodedValue = eventValue != null ? JSON.stringify(eventValue) : undefined;
            carryoverEvents.push(newEventRaisedEvent(eventName, encodedValue));
          }
        }
      }

      const action = newCompleteWorkflowAction(
        this.nextSequenceNumber(),
        OrchestrationStatusEnum.CONTINUED_AS_NEW,
        this._newInput != null ? JSON.stringify(this._newInput) : undefined,
        undefined,
        carryoverEvents ?? undefined,
      );
      return [action];
    }

    return Object.values(this._pendingActions);
  }

  nextSequenceNumber(): number {
    return ++this._sequenceNumber;
  }

  createTimer(fireAt: Date | number): Task<unknown> {
    const id = this.nextSequenceNumber();

    if (!(fireAt instanceof Date)) {
      fireAt = new Date(this._currentUtcDatetime.getTime() + (fireAt as number) * 1000);
    }

    const action = newCreateTimerAction(id, fireAt as Date);
    this._pendingActions[action.id] = action;

    const timerTask = new CompletableTask<unknown>();
    this._pendingTasks[id] = timerTask;
    return timerTask;
  }

  callActivity<TInput, TOutput>(
    activity: TActivity<TInput, TOutput> | string,
    input?: TInput,
    options?: ActivityOptions,
  ): Task<TOutput> {
    const name = typeof activity === "string" ? activity : getName(activity);
    const encodedInput = input != null ? JSON.stringify(input) : undefined;
    if (options?.retryPolicy) {
      return this.callWithRetry(options.retryPolicy, (id) => {
        const action = newScheduleTaskAction(id, name, encodedInput);
        this._pendingActions[action.id] = action;
      });
    }

    const id = this.nextSequenceNumber();
    const action = newScheduleTaskAction(id, name, encodedInput);
    this._pendingActions[action.id] = action;

    const task = new CompletableTask<TOutput>();
    this._pendingTasks[id] = task;
    return task;
  }

  callSubOrchestrator<TInput, TOutput>(
    orchestrator: TOrchestrator | string,
    input?: TInput,
    instanceId?: string,
    options?: ChildWorkflowOptions,
  ): Task<TOutput> {
    const name = typeof orchestrator === "string" ? orchestrator : getName(orchestrator);
    const encodedInput = input != null ? JSON.stringify(input) : undefined;
    if (options?.retryPolicy) {
      const firstInstanceId = instanceId;
      return this.callWithRetry(options.retryPolicy, (id, attempt) => {
        const childInstanceId =
          attempt === 1 && firstInstanceId
            ? firstInstanceId
            : `${this._instanceId}:${id.toString(16).padStart(4, "0")}`;
        const action = newCreateChildWorkflowAction(id, name, childInstanceId, encodedInput);
        this._pendingActions[action.id] = action;
      });
    }

    const id = this.nextSequenceNumber();
    if (!instanceId) {
      const suffix = id.toString(16).padStart(4, "0");
      instanceId = `${this._instanceId}:${suffix}`;
    }

    const action = newCreateChildWorkflowAction(id, name, instanceId, encodedInput);
    this._pendingActions[action.id] = action;

    const task = new CompletableTask<TOutput>();
    this._pendingTasks[id] = task;
    return task;
  }

  waitForExternalEvent(name: string): Task<unknown> {
    const externalEventTask = new CompletableTask<unknown>();
    const eventName = name.toLowerCase();
    const eventList = this._receivedEvents[eventName];

    if (eventList?.length) {
      const eventData = eventList.shift();
      if (!eventList.length) {
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

  continueAsNew(newInput: unknown, saveEvents = false): void {
    this.setContinuedAsNew(newInput, saveEvents);
  }

  setCustomStatus(status: unknown): void {
    this._customStatus = status;
  }

  sendEvent(instanceId: string, eventName: string, payload: unknown): void {
    const id = this.nextSequenceNumber();
    const encodedData = payload != null ? JSON.stringify(payload) : undefined;
    const action = newSendEventAction(id, instanceId, eventName, encodedData);
    this._pendingActions[action.id] = action;
  }

  newGuid(): string {
    const counter = this._guidCounter++;
    return newDeterministicGuid(this._instanceId, counter.toString());
  }

  private callWithRetry<T>(retryPolicy: RetryPolicy, scheduleAttempt: (id: number, attempt: number) => void): Task<T> {
    const policy = validateRetryPolicy(retryPolicy);
    const retryTask = new CompletableTask<T>();
    const startedAt = this._currentUtcDatetime.getTime();
    let attempt = 0;

    const runAttempt = (): void => {
      attempt++;
      const id = this.nextSequenceNumber();
      scheduleAttempt(id, attempt);
      const attemptTask = new RetryAttemptTask<T>(
        (result) => retryTask.complete(result),
        (message, details) => {
          const interval = Math.min(
            policy.firstRetryInterval * Math.pow(policy.backoffCoefficient, attempt - 1),
            policy.maxRetryInterval ?? Number.POSITIVE_INFINITY,
          );
          const retryAt = this._currentUtcDatetime.getTime() + interval * 1000;
          const timedOut = policy.retryTimeout !== undefined && retryAt - startedAt > policy.retryTimeout * 1000;

          if (attempt >= policy.maxNumberOfAttempts || details?.isNonRetriable || timedOut) {
            retryTask.fail(message, details);
            return;
          }

          const timerId = this.nextSequenceNumber();
          const fireAt = new Date(retryAt);
          const timerAction = newCreateTimerAction(timerId, fireAt);
          this._pendingActions[timerAction.id] = timerAction;
          this._pendingTasks[timerId] = new RetryDelayTask(runAttempt);
        },
      );
      this._pendingTasks[id] = attemptTask;
    };

    runAttempt();
    return retryTask;
  }
}

function validateRetryPolicy(
  retryPolicy: RetryPolicy,
): Required<Pick<RetryPolicy, "firstRetryInterval" | "maxNumberOfAttempts">> &
  Pick<RetryPolicy, "retryTimeout" | "maxRetryInterval"> & { backoffCoefficient: number } {
  if (!retryPolicy || typeof retryPolicy !== "object") {
    throw new TypeError("A retry policy must be provided");
  }

  const { firstRetryInterval, maxNumberOfAttempts } = retryPolicy;
  const backoffCoefficient = retryPolicy.backoffCoefficient ?? 1;
  const { maxRetryInterval, retryTimeout } = retryPolicy;

  if (!Number.isFinite(firstRetryInterval) || firstRetryInterval <= 0) {
    throw new RangeError("firstRetryInterval must be a finite number greater than 0 seconds");
  }
  if (!Number.isInteger(maxNumberOfAttempts) || maxNumberOfAttempts < 1) {
    throw new RangeError("maxNumberOfAttempts must be an integer greater than or equal to 1");
  }
  if (!Number.isFinite(backoffCoefficient) || backoffCoefficient < 1) {
    throw new RangeError("backoffCoefficient must be a finite number greater than or equal to 1");
  }
  if (maxRetryInterval !== undefined && (!Number.isFinite(maxRetryInterval) || maxRetryInterval <= 0)) {
    throw new RangeError("maxRetryInterval must be a finite number greater than 0 seconds");
  }
  if (retryTimeout !== undefined && (!Number.isFinite(retryTimeout) || retryTimeout <= 0)) {
    throw new RangeError("retryTimeout must be a finite number greater than 0 seconds");
  }

  return { firstRetryInterval, maxNumberOfAttempts, backoffCoefficient, maxRetryInterval, retryTimeout };
}

class RetryAttemptTask<T> extends CompletableTask<T> {
  constructor(
    private readonly _onComplete: (result: T) => void,
    private readonly _onFailure: (message: string, details?: TaskFailureDetails) => void,
  ) {
    super();
  }

  override complete(result: T): void {
    super.complete(result);
    this._onComplete(result);
  }

  override fail(message: string, details?: TaskFailureDetails): void {
    super.fail(message, details);
    this._onFailure(message, details);
  }
}

class RetryDelayTask extends CompletableTask<unknown> {
  constructor(private readonly _onComplete: () => void) {
    super();
  }

  override complete(result: unknown): void {
    super.complete(result);
    this._onComplete();
  }
}

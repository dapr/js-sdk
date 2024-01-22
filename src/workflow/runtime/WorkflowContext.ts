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

import { OrchestrationContext } from "@microsoft/durabletask-js";
import { Task } from "@microsoft/durabletask-js/task/task";
import { TWorkflowActivity } from "../../types/workflow/Activity.type";
import { TWorkflow } from "../../types/workflow/Workflow.type";
import { getFunctionName } from "../internal";
import { WhenAllTask } from "@microsoft/durabletask-js/task/when-all-task";
import { whenAll, whenAny } from "@microsoft/durabletask-js/task";
import { WhenAnyTask } from "@microsoft/durabletask-js/task/when-any-task";
import { TInput, TOutput } from "../../types/workflow/InputOutput.type";

/**
 * Used by workflow to perform actions such as scheduling tasks, durable timers, waiting for external events,
 * and for getting basic information about the current workflow.
 */
export default class WorkflowContext {
  private readonly _innerContext: OrchestrationContext;
  constructor(innerContext: OrchestrationContext) {
    if (!innerContext) {
      throw new Error("ActivityContext cannot be undefined");
    }
    this._innerContext = innerContext;
  }

  /**
   * Gets the unique ID of the current orchestration instance.
   * @returns {string} The unique ID of the current orchestration instance
   */
  public getWorkflowInstanceId(): string {
    return this._innerContext.instanceId;
  }

  /**
   * Get the current date/time as UTC
   *
   * @returns {Date} The current timestamp in a way that is safe for use by orchestrator functions
   */
  public getCurrentUtcDateTime(): Date {
    return this._innerContext.currentUtcDateTime;
  }

  /**
   * Get the value indicating whether the orchestrator is replaying from history.
   *
   * This property is useful when there is logic that needs to run only when
   * the orchestrator function is _not_ replaying. For example, certain
   * types of application logging may become too noisy when duplicated as
   * part of orchestrator function replay. The orchestrator code could check
   * to see whether the function is being replayed and then issue the log
   * statements when this value is `false`.
   *
   * @returns {boolean} `true` if the orchestrator function is replaying from history; otherwise, `false`.
   */
  public isReplaying(): boolean {
    return this._innerContext.isReplaying;
  }

  /**
   * Create a timer task that will fire at a specified time.
   *
   * @param {Date | number} fireAt The time at which the timer should fire.
   * @returns {Task} A Durable Timer task that schedules the timer to wake up the orchestrator
   */
  public createTimer(fireAt: Date | number): Task<any> {
    return this._innerContext.createTimer(fireAt);
  }

  /**
   * Schedules an activity for execution within the orchestrator.
   *
   * @param {TWorkflowActivity<TInput, TOutput> | string} activity - The activity function or its name to call.
   * @param {TInput} [input] - The JSON-serializable input value for the activity function.
   * @returns {Task<TOutput>} - A Durable Task that completes when the activity function completes.
   *
   * @typeparam TWorkflowActivity - The type of the activity function.
   * @typeparam TInput - The type of the input for the activity.
   * @typeparam TOutput - The type of the output for the activity.
   */
  public callActivity(activity: TWorkflowActivity<TInput, TOutput> | string, input?: TInput): Task<TOutput> {
    if (typeof activity === "string") {
      return this._innerContext.callActivity(activity, input);
    }
    return this._innerContext.callActivity(getFunctionName(activity), input);
  }

  /**
   * Schedule sub-orchestrator function for execution.
   *
   * @param orchestrator A reference to the orchestrator function call
   * @param input The JSON-serializable input value for the orchestrator function.
   * @param instanceId A unique ID to use for the sub-orchestration instance. If not provided, a new GUID will be used.
   *
   * @returns {Task<TOutput>} A Durable Task that completes when the sub-orchestrator function completes.
   */
  public callSubWorkflow<TInput, TOutput>(
    orchestrator: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
  ): Task<TOutput> {
    if (typeof orchestrator === "string") {
      return this._innerContext.callSubOrchestrator(orchestrator, input, instanceId);
    }
    return this._innerContext.callSubOrchestrator(getFunctionName(orchestrator), input, instanceId);
  }

  /**
   * Wait for an event to be raised with the name "name"
   *
   * @param name The name of the event to wait for
   * @returns {Task} A Durable Task that completes when the event is received
   */
  public waitForExternalEvent(name: string): Task<any> {
    return this._innerContext.waitForExternalEvent(name);
  }

  /**
   * Continue the orchestration execution as a new instance
   *
   * @param newInput {any} The new input to use for the new orchestration instance.
   * @param saveEvents {boolean} A flag indicating whether to add any unprocessed external events in the new orchestration history.
   */
  public continueAsNew(newInput: any, saveEvents: boolean): void {
    this._innerContext.continueAsNew(newInput, saveEvents);
  }

  /**
   * Returns a task that completes when all of the provided tasks complete or when one of the tasks fail
   *
   * @param tasks the tasks to wait for
   * @returns {WhenAllTask} a task that completes when all of the provided tasks complete or when one of the tasks fail
   */
  public whenAll<T>(tasks: Task<T>[]): WhenAllTask<T> {
    return whenAll(tasks);
  }

  /**
   * Returns a task that completes when any of the provided tasks complete or fail
   *
   * @param tasks the tasks to wait for
   * @returns {WhenAnyTask} a task that completes when one of the provided tasks complete or when one of the tasks fail
   */
  public whenAny(tasks: Task<any>[]): WhenAnyTask {
    return whenAny(tasks);
  }
}

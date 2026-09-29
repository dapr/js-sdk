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

import type { OrchestrationContext } from "../engine/context/OrchestrationContext";
import type { Task } from "../engine/task/Task";
import type { WhenAllTask } from "../engine/task/WhenAllTask";
import type { WhenAnyTask } from "../engine/task/WhenAnyTask";
import { whenAll, whenAny, getName } from "../engine/task";
import type { TWorkflowActivity } from "../../types/workflow/Activity.type";
import type { TWorkflow } from "../../types/workflow/Workflow.type";

export default class WorkflowContext {
  constructor(private readonly _innerContext: OrchestrationContext) {
    if (!_innerContext) {
      throw new Error("WorkflowContext cannot be undefined");
    }
  }

  public getWorkflowInstanceId(): string {
    return this._innerContext.instanceId;
  }

  public getCurrentUtcDateTime(): Date {
    return this._innerContext.currentUtcDateTime;
  }

  public isReplaying(): boolean {
    return this._innerContext.isReplaying;
  }

  public createTimer(fireAt: Date | number): Task<void> {
    return this._innerContext.createTimer(fireAt) as Task<void>;
  }

  public callActivity<T = any>(activity: TWorkflowActivity<any, any> | string, input?: any): Task<T> {
    if (typeof activity === "string") {
      return this._innerContext.callActivity(activity, input) as Task<T>;
    }
    return this._innerContext.callActivity(getName(activity), input) as Task<T>;
  }

  public callSubWorkflow<TInput = any, TOutput = any>(
    orchestrator: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
  ): Task<TOutput> {
    if (typeof orchestrator === "string") {
      return this._innerContext.callSubOrchestrator(orchestrator, input, instanceId) as Task<TOutput>;
    }
    return this._innerContext.callSubOrchestrator(getName(orchestrator), input, instanceId) as Task<TOutput>;
  }

  public callChildWorkflow<TInput = any, TOutput = any>(
    orchestrator: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
  ): Task<TOutput> {
    if (typeof orchestrator === "string") {
      return this._innerContext.callSubOrchestrator(orchestrator, input, instanceId) as Task<TOutput>;
    }
    return this._innerContext.callSubOrchestrator(getName(orchestrator), input, instanceId) as Task<TOutput>;
  }

  public waitForExternalEvent<T = any>(name: string): Task<T> {
    return this._innerContext.waitForExternalEvent(name) as Task<T>;
  }

  public continueAsNew(newInput: any, saveEvents = false): void {
    this._innerContext.continueAsNew(newInput, saveEvents);
  }

  public setCustomStatus(status: any): void {
    this._innerContext.setCustomStatus(status);
  }

  public sendEvent(instanceId: string, eventName: string, payload: any): void {
    this._innerContext.sendEvent(instanceId, eventName, payload);
  }

  public newGuid(): string {
    return this._innerContext.newGuid();
  }

  public whenAll<T>(tasks: Task<T>[]): WhenAllTask<T> {
    return whenAll(tasks);
  }

  public whenAny(tasks: Task<any>[]): WhenAnyTask {
    return whenAny(tasks);
  }
}

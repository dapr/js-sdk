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

import type { OrchestrationContext, Task, WhenAllTask, WhenAnyTask } from "../engine";
import type { CancellableTask } from "../../types/workflow/CancellableTask.type";
import type { ExternalEventOptions } from "../../types/workflow/ExternalEventOptions.type";
import { whenAll, whenAny, getName } from "../engine";
import type { TWorkflowActivity } from "../../types/workflow/Activity.type";
import type { TWorkflow } from "../../types/workflow/Workflow.type";
import type { ActivityOptions } from "../../types/workflow/ActivityOptions.type";
import type { ChildWorkflowOptions } from "../../types/workflow/ChildWorkflowOptions.type";
import type { DetachedWorkflowOptions } from "../../types/workflow/DetachedWorkflowOptions.type";
import { createPropagatedHistoryView, type PropagatedHistoryView } from "./PropagatedHistory";
import type { PayloadReference } from "../payloads/PayloadReference";
import type { Readable } from "node:stream";
import { Logger } from "../../logger/Logger";
import type { LoggerOptions } from "../../types/logger/LoggerOptions";
import type { LoggerService } from "../../types/logger/LoggerService";
import { ReplaySafeLogger } from "./ReplaySafeLogger";

export default class WorkflowContext {
  private _logger?: LoggerService;

  public hasPayloadResolver(): boolean {
    return this._innerContext.hasPayloadResolver;
  }

  /** Yield this read-only task; storage I/O is drained before workflow history advances. */
  public resolvePayload<T>(reference: PayloadReference<T>): Task<T> {
    return this._innerContext.resolvePayload(reference);
  }

  /** Yield to obtain a raw stream. Consume asynchronously and destroy it on early exit. */
  public openPayload(reference: PayloadReference): Task<Readable> {
    return this._innerContext.openPayload(reference);
  }

  constructor(private readonly _innerContext: OrchestrationContext, private readonly loggerOptions?: LoggerOptions) {
    if (!_innerContext) {
      throw new Error("WorkflowContext cannot be undefined");
    }
  }

  /** Logs application messages only during non-replay execution. */
  public get logger(): LoggerService {
    this._logger ??= new ReplaySafeLogger(
      new Logger("Workflow", `${this.getWorkflowName()}, ${this.getWorkflowInstanceId()}`, this.loggerOptions),
      () => this.isReplaying(),
    );
    return this._logger;
  }

  public getWorkflowInstanceId(): string {
    return this._innerContext.instanceId;
  }

  public getWorkflowName(): string {
    return this._innerContext.name;
  }

  public getPropagatedHistory(): PropagatedHistoryView | undefined {
    return createPropagatedHistoryView(this._innerContext.propagatedHistory);
  }

  public getCurrentUtcDateTime(): Date {
    return this._innerContext.currentUtcDateTime;
  }

  public isReplaying(): boolean {
    return this._innerContext.isReplaying;
  }

  public createTimer(fireAt: Date | number): CancellableTask<void> {
    return this._innerContext.createTimer(fireAt);
  }

  public callActivity<T = any>(
    activity: TWorkflowActivity<any, any> | string,
    input?: any,
    options?: ActivityOptions,
  ): Task<T> {
    if (typeof activity === "string") {
      return this._innerContext.callActivity(activity, input, options) as Task<T>;
    }
    return this._innerContext.callActivity(getName(activity), input, options) as Task<T>;
  }

  public callSubWorkflow<TInput = any, TOutput = any>(
    orchestrator: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
    options?: ChildWorkflowOptions,
  ): Task<TOutput> {
    if (typeof orchestrator === "string") {
      return this._innerContext.callSubOrchestrator(orchestrator, input, instanceId, options) as Task<TOutput>;
    }
    return this._innerContext.callSubOrchestrator(getName(orchestrator), input, instanceId, options) as Task<TOutput>;
  }

  public callChildWorkflow<TInput = any, TOutput = any>(
    orchestrator: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
    options?: ChildWorkflowOptions,
  ): Task<TOutput> {
    if (typeof orchestrator === "string") {
      return this._innerContext.callSubOrchestrator(orchestrator, input, instanceId, options) as Task<TOutput>;
    }
    return this._innerContext.callSubOrchestrator(getName(orchestrator), input, instanceId, options) as Task<TOutput>;
  }

  /**
   * Schedules an independent workflow (Dapr 1.19+). The completed task contains its
   * instance ID, not its output; completion and failure do not flow back to this workflow.
   */
  public scheduleNewDetachedWorkflow<TInput = unknown>(
    workflow: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
    startAt?: Date,
    options?: DetachedWorkflowOptions,
  ): Task<string> {
    return this._innerContext.scheduleNewDetachedWorkflow(
      typeof workflow === "string" ? workflow : getName(workflow),
      input,
      instanceId,
      startAt,
      options,
    );
  }

  public waitForExternalEvent<T = any>(name: string, options?: ExternalEventOptions): CancellableTask<T> {
    return this._innerContext.waitForExternalEvent(name, options) as CancellableTask<T>;
  }

  public continueAsNew(newInput: any, saveEvents = true): void {
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

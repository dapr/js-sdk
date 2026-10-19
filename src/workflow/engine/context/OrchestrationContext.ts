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

import type { Task } from "../task";
import type { CancellableTask } from "../../../types/workflow/CancellableTask.type";
import type { ExternalEventOptions } from "../../../types/workflow/ExternalEventOptions.type";
import type { ActivityContext } from "./ActivityContext";
import type { ActivityOptions } from "../../../types/workflow/ActivityOptions.type";
import type { ChildWorkflowOptions } from "../../../types/workflow/ChildWorkflowOptions.type";
import type { DetachedWorkflowOptions } from "../../../types/workflow/DetachedWorkflowOptions.type";
import type { PropagatedHistory } from "../../runtime/PropagatedHistory";
import type { Readable } from "node:stream";
import type { PayloadReference } from "../../payloads/PayloadReference";
import { PayloadNotResolvableError } from "../../payloads/PayloadErrors";

export type AnyGenerator<T> = AsyncGenerator<T, unknown, unknown> | Generator<T, unknown, unknown>;
export type TOrchestrator = (context: OrchestrationContext, input: unknown) => AnyGenerator<Task<unknown>> | unknown;
export type TActivity<TInput, TOutput> = (context: ActivityContext, input: TInput) => TOutput | Promise<TOutput>;

export abstract class OrchestrationContext {
  get hasPayloadResolver(): boolean {
    return false;
  }

  resolvePayload<T>(_reference: PayloadReference<T>): Task<T> {
    throw new PayloadNotResolvableError();
  }

  openPayload(_reference: PayloadReference): Task<Readable> {
    throw new PayloadNotResolvableError();
  }

  get name(): string {
    throw new Error("This orchestration context does not provide a workflow name");
  }

  get propagatedHistory(): PropagatedHistory | undefined {
    return undefined;
  }

  abstract get instanceId(): string;
  abstract get currentUtcDateTime(): Date;
  abstract get isReplaying(): boolean;

  abstract createTimer(fireAt: Date | number): CancellableTask<void>;
  abstract callActivity<TInput, TOutput>(
    activity: TActivity<TInput, TOutput> | string,
    input?: TInput,
    options?: ActivityOptions,
  ): Task<TOutput>;
  abstract callSubOrchestrator<TInput, TOutput>(
    orchestrator: TOrchestrator | string,
    input?: TInput,
    instanceId?: string,
    options?: ChildWorkflowOptions,
  ): Task<TOutput>;
  scheduleNewDetachedWorkflow<TInput>(
    _workflow: TOrchestrator | string,
    _input?: TInput,
    _instanceId?: string,
    _startAt?: Date,
    _options?: DetachedWorkflowOptions,
  ): Task<string> {
    throw new Error("This orchestration context does not support detached workflows");
  }
  abstract waitForExternalEvent(name: string, options?: ExternalEventOptions): CancellableTask<unknown>;
  abstract continueAsNew(newInput: unknown, saveEvents: boolean): void;
  abstract setCustomStatus(status: unknown): void;
  abstract sendEvent(instanceId: string, eventName: string, payload: unknown): void;
  abstract newGuid(): string;
}

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

import type { Task } from "../task/Task";
import type { ActivityContext } from "./ActivityContext";
import type { ActivityOptions } from "../../../types/workflow/ActivityOptions.type";
import type { ChildWorkflowOptions } from "../../../types/workflow/ChildWorkflowOptions.type";

export type AnyGenerator<T> = AsyncGenerator<T, unknown, unknown> | Generator<T, unknown, unknown>;
export type TOrchestrator = (context: OrchestrationContext, input: unknown) => AnyGenerator<Task<unknown>> | unknown;
export type TActivity<TInput, TOutput> = (context: ActivityContext, input: TInput) => TOutput | Promise<TOutput>;

export abstract class OrchestrationContext {
  abstract get instanceId(): string;
  abstract get currentUtcDateTime(): Date;
  abstract get isReplaying(): boolean;

  abstract createTimer(fireAt: Date | number): Task<unknown>;
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
  abstract waitForExternalEvent(name: string): Task<unknown>;
  abstract continueAsNew(newInput: unknown, saveEvents: boolean): void;
  abstract setCustomStatus(status: unknown): void;
  abstract sendEvent(instanceId: string, eventName: string, payload: unknown): void;
  abstract newGuid(): string;
}

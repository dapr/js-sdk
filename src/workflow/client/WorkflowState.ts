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

import type { OrchestrationState } from "../engine";
import { WorkflowFailureDetails } from "./WorkflowFailureDetails";
import { WorkflowRuntimeStatus, fromOrchestrationStatus } from "../runtime/WorkflowRuntimeStatus";
import { IDaprSerializer } from "../../serialization/IDaprSerializer";
import { JsonSerializer } from "../../serialization/JsonSerializer";
import { PayloadReference } from "../payloads/PayloadReference";
import { WorkflowPayloadHandler } from "../payloads/WorkflowPayloadHandler";
import { PayloadNotResolvableError, PayloadRehydrationLimitError } from "../payloads/PayloadErrors";

export class WorkflowState {
  private readonly _state: OrchestrationState;
  private readonly _failureDetails?: WorkflowFailureDetails;
  private readonly prepared = new Map<string, string | Error>();

  static async prepare(
    state: OrchestrationState,
    serializer?: IDaprSerializer,
    handler?: WorkflowPayloadHandler,
    signal?: AbortSignal,
  ): Promise<WorkflowState> {
    const result = new WorkflowState(state, serializer);
    if (!handler) return result;
    for (const field of ["serializedInput", "serializedOutput", "serializedCustomStatus"] as const) {
      const reference = PayloadReference.parse(state[field]);
      if (!reference) continue;
      try {
        result.prepared.set(field, await handler.resolveSerialized(reference, signal));
      } catch (error) {
        if (!(error instanceof PayloadRehydrationLimitError) && !(error instanceof PayloadNotResolvableError))
          throw error;
        result.prepared.set(field, error);
      }
    }
    return result;
  }

  constructor(state: OrchestrationState, private readonly serializer: IDaprSerializer = new JsonSerializer()) {
    if (!state) {
      throw new Error("WorkflowState cannot be null");
    }
    this._state = state;

    if (state.failureDetails) {
      this._failureDetails = new WorkflowFailureDetails(state.failureDetails);
    }
  }

  get name(): string {
    return this._state.name;
  }

  /** A returned state represents an existing instance, regardless of its runtime status. */
  get exists(): boolean {
    return true;
  }

  get instanceId(): string {
    return this._state.instanceId;
  }

  get runtimeStatus(): WorkflowRuntimeStatus {
    return fromOrchestrationStatus(this._state.runtimeStatus);
  }

  get createdAt(): Date {
    return this._state.createdAt;
  }

  get lastUpdatedAt(): Date {
    return this._state.lastUpdatedAt;
  }

  get serializedInput(): string | undefined {
    return this.preparedString("serializedInput");
  }

  get serializedOutput(): string | undefined {
    return this.preparedString("serializedOutput");
  }

  getInput<T = unknown>(): T | undefined {
    this.throwPreparationError("serializedInput");
    const data = this.serializedInput;
    return data === undefined || data === "" ? undefined : this.serializer.deserialize<T>(data);
  }

  getOutput<T = unknown>(): T | undefined {
    this.throwPreparationError("serializedOutput");
    const data = this.serializedOutput;
    return data === undefined || data === "" ? undefined : this.serializer.deserialize<T>(data);
  }

  getCustomStatus<T = unknown>(): T | undefined {
    this.throwPreparationError("serializedCustomStatus");
    const data = this.customStatus;
    return data === undefined || data === "" ? undefined : this.serializer.deserialize<T>(data);
  }

  get workflowFailureDetails(): WorkflowFailureDetails | undefined {
    return this._failureDetails;
  }

  get customStatus(): string | undefined {
    return this.preparedString("serializedCustomStatus");
  }

  getInputReference<T = unknown>(): PayloadReference<T> | undefined {
    return PayloadReference.parse<T>(this._state.serializedInput);
  }

  getOutputReference<T = unknown>(): PayloadReference<T> | undefined {
    return PayloadReference.parse<T>(this._state.serializedOutput);
  }

  getCustomStatusReference<T = unknown>(): PayloadReference<T> | undefined {
    return PayloadReference.parse<T>(this._state.serializedCustomStatus);
  }

  private preparedString(field: "serializedInput" | "serializedOutput" | "serializedCustomStatus"): string | undefined {
    const value = this.prepared.get(field);
    return typeof value === "string" ? value : this._state[field];
  }

  private throwPreparationError(field: string): void {
    const value = this.prepared.get(field);
    if (value instanceof Error) throw value;
  }
}

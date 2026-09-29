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

import type { OrchestrationState } from "../engine/transport/TaskHubClient";
import { WorkflowFailureDetails } from "./WorkflowFailureDetails";
import { WorkflowRuntimeStatus, fromOrchestrationStatus } from "../runtime/WorkflowRuntimeStatus";

export class WorkflowState {
  private readonly _state: OrchestrationState;
  private readonly _failureDetails?: WorkflowFailureDetails;

  constructor(state: OrchestrationState) {
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
    return this._state.serializedInput;
  }

  get serializedOutput(): string | undefined {
    return this._state.serializedOutput;
  }

  get workflowFailureDetails(): WorkflowFailureDetails | undefined {
    return this._failureDetails;
  }

  get customStatus(): string | undefined {
    const cs = this._state.serializedCustomStatus;
    return cs;
  }
}

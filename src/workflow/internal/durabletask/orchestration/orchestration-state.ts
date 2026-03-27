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

import { FailureDetails } from "../task/failure-details";
import { OrchestrationStatus } from "./enum/orchestration-status.enum";
import { OrchestrationFailedError } from "./exception/orchestration-failed-error";

export class OrchestrationState {
  instanceId: string;
  name: string;
  runtimeStatus: OrchestrationStatus;
  createdAt: Date;
  lastUpdatedAt: Date;
  serializedInput?: string;
  serializedOutput?: string;
  serializedCustomStatus?: string;
  failureDetails?: FailureDetails;

  constructor(
    instanceId: string,
    name: string,
    runtimeStatus: OrchestrationStatus,
    createdAt: Date,
    lastUpdatedAt: Date,
    serializedInput?: string,
    serializedOutput?: string,
    serializedCustomStatus?: string,
    failureDetails?: FailureDetails,
  ) {
    this.instanceId = instanceId;
    this.name = name;
    this.runtimeStatus = runtimeStatus;
    this.createdAt = createdAt;
    this.lastUpdatedAt = lastUpdatedAt;
    this.serializedInput = serializedInput;
    this.serializedOutput = serializedOutput;
    this.serializedCustomStatus = serializedCustomStatus;
    this.failureDetails = failureDetails;
  }

  raiseIfFailed(): void {
    if (this.failureDetails) {
      throw new OrchestrationFailedError(
        `Orchestration '${this.instanceId}' failed: ${this.failureDetails.message}`,
        this.failureDetails,
      );
    }
  }
}

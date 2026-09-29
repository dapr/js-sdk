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

import { OrchestrationStatus } from "../../proto/dapr/proto/durabletask/v1/orchestration_pb";

export enum WorkflowRuntimeStatus {
  RUNNING = OrchestrationStatus.RUNNING,
  COMPLETED = OrchestrationStatus.COMPLETED,
  CONTINUED_AS_NEW = OrchestrationStatus.CONTINUED_AS_NEW,
  FAILED = OrchestrationStatus.FAILED,
  CANCELED = OrchestrationStatus.CANCELED,
  TERMINATED = OrchestrationStatus.TERMINATED,
  PENDING = OrchestrationStatus.PENDING,
  SUSPENDED = OrchestrationStatus.SUSPENDED,
  STALLED = OrchestrationStatus.STALLED,
}

export function fromOrchestrationStatus(val: OrchestrationStatus): WorkflowRuntimeStatus {
  return val as unknown as WorkflowRuntimeStatus;
}

export function toOrchestrationStatus(val: WorkflowRuntimeStatus): OrchestrationStatus {
  return val as unknown as OrchestrationStatus;
}

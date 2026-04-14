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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as pb from "../../proto/orchestrator_service_pb";

export function fromProtobuf(val: pb.OrchestrationStatus): OrchestrationStatus {
  const values = Object.values(OrchestrationStatus);
  const valIdx = values.findIndex((v) => v === (val as number));

  // Return the entry of the OrchestrationStatus enum at index
  const entries = Object.entries(OrchestrationStatus);
  return entries[valIdx][1] as OrchestrationStatus;
}

export function toProtobuf(val: OrchestrationStatus): pb.OrchestrationStatus {
  const values = Object.values(pb.OrchestrationStatus);
  const valIdx = values.findIndex((v) => v === (val as number));

  // Return the entry of the OrchestrationStatus enum at index
  const entries = Object.entries(pb.OrchestrationStatus);
  return entries[valIdx][1] as pb.OrchestrationStatus;
}

export enum OrchestrationStatus {
  RUNNING = pb.OrchestrationStatus.ORCHESTRATION_STATUS_RUNNING,
  COMPLETED = pb.OrchestrationStatus.ORCHESTRATION_STATUS_COMPLETED,
  FAILED = pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED,
  TERMINATED = pb.OrchestrationStatus.ORCHESTRATION_STATUS_TERMINATED,
  CONTINUED_AS_NEW = pb.OrchestrationStatus.ORCHESTRATION_STATUS_CONTINUED_AS_NEW,
  PENDING = pb.OrchestrationStatus.ORCHESTRATION_STATUS_PENDING,
  SUSPENDED = pb.OrchestrationStatus.ORCHESTRATION_STATUS_SUSPENDED,
}

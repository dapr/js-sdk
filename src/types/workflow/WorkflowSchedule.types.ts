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

import { WorkflowScheduleState as ProtoWorkflowScheduleState } from "../../proto/dapr/proto/durabletask/v1/workflow_schedule_pb";
import type { WorkflowFailureDetails } from "../../workflow/client/WorkflowFailureDetails";
import type { WorkflowRuntimeStatus } from "../../workflow/runtime/WorkflowRuntimeStatus";

export interface CreateWorkflowScheduleOptions {
  /** Input every run is given, serialized with the client's serializer (JSON by default). */
  input?: unknown;
  /** Already serialized input every run is given, sent as is. Cannot be combined with input. */
  serializedInput?: string;
  /** Time of the first run. Defaults to the first time the schedule matches after it is created. */
  dueTime?: Date;
  /** No run starts after this time; the schedule then completes. */
  expirationTime?: Date;
  /** Number of runs after which the schedule completes. At least 1. */
  repeats?: number;
  /** App ID that hosts the workflow each run starts. Defaults to the app that owns the schedule. */
  targetAppId?: string;
  /** Namespace of targetAppId. Requires targetAppId. */
  targetAppNamespace?: string;
  /** Replace an existing schedule of the same name. Without it, a taken name fails with ALREADY_EXISTS. */
  overwrite?: boolean;
  /**
   * By default a schedule catches up durably: every time it missed while the app was down starts its own run, one
   * after another, as with Dapr jobs and actor reminders. When true, it starts one run for the missed times and
   * carries on from the next time after now.
   */
  skipMissed?: boolean;
}

export interface ListWorkflowSchedulesOptions {
  /** Maximum number of schedules to return. */
  pageSize?: number;
  /** Token returned by the previous page. */
  continuationToken?: string;
}

export interface WorkflowSchedulePage {
  schedules: WorkflowSchedule[];
  /** Set when there are more schedules to list. */
  continuationToken?: string;
}

export interface WorkflowSchedule {
  /** 1 to 30 letters, digits or '-'. */
  name: string;
  workflowName: string;
  /** Schedule in Dapr Jobs API syntax, see DaprWorkflowClient.createWorkflowSchedule. */
  schedule: string;
  serializedInput?: string;
  dueTime?: Date;
  expirationTime?: Date;
  repeats?: number;
  targetAppId?: string;
  targetAppNamespace?: string;
  /** See CreateWorkflowScheduleOptions.skipMissed. False means missed times each start a run. */
  skipMissed: boolean;
  /** Filled by the runtime on get and list. */
  status?: WorkflowScheduleStatus;
}

export enum WorkflowScheduleState {
  /** Waiting for its next run. */
  ACTIVE = ProtoWorkflowScheduleState.ACTIVE,
  /** No runs left, because of repeats or expirationTime. */
  COMPLETED = ProtoWorkflowScheduleState.COMPLETED,
  /** Stopped with an error, given in failureMessage. */
  FAILED = ProtoWorkflowScheduleState.FAILED,
}

export interface WorkflowScheduleStatus {
  state: WorkflowScheduleState;
  createdAt?: Date;
  /** When the next run starts, unless it is triggered sooner. Absent once the schedule is not active. */
  nextRunTime?: Date;
  /** Fire time of the last run, or when it was triggered. */
  lastRunTime?: Date;
  runCount: number;
  /** Absent before the first run. */
  lastRun?: WorkflowScheduleRun;
  /** Why the schedule failed, when state is FAILED. */
  failureMessage?: string;
}

/** One run of a schedule. Only instanceId is set when the run's instance cannot be read, for example once purged. */
export interface WorkflowScheduleRun {
  instanceId: string;
  runtimeStatus?: WorkflowRuntimeStatus;
  createdAt?: Date;
  lastUpdatedAt?: Date;
  serializedOutput?: string;
  failureDetails?: WorkflowFailureDetails;
}

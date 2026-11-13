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

import { TaskHubClient } from "../engine";
import { Code, ConnectError } from "@connectrpc/connect";
import { WorkflowState } from "./WorkflowState";
import { generateEndpoint, getDaprApiToken, getFunctionName } from "../internal";
import type { TWorkflow } from "../../types/workflow/Workflow.type";
import type { WorkflowClientOptions } from "../../types/workflow/WorkflowClientOption";
import type { HistoryEvent } from "../../proto/dapr/proto/durabletask/v1/history_events_pb";
import type {
  RerunWorkflowFromEventOptions,
  WorkflowInstanceIdPage,
} from "../../types/workflow/WorkflowManagement.types";
import type {
  CreateWorkflowScheduleOptions,
  ListWorkflowSchedulesOptions,
  WorkflowSchedule,
  WorkflowSchedulePage,
} from "../../types/workflow/WorkflowSchedule.types";

export default class DaprWorkflowClient {
  private readonly _innerClient: TaskHubClient;

  constructor(options: Partial<WorkflowClientOptions> = {}) {
    const grpcEndpoint = generateEndpoint(options);
    const daprApiToken = getDaprApiToken(options);
    this._innerClient = new TaskHubClient(
      `${grpcEndpoint.hostname}:${grpcEndpoint.port}`,
      daprApiToken,
      grpcEndpoint.tls,
      128 * 1024 * 1024,
      options.grpcOptions,
      options.serializer ?? options.payloads?.serializer,
      options.payloads,
    );
  }

  public async scheduleNewWorkflow(
    workflow: TWorkflow | string,
    input?: unknown,
    instanceId?: string,
    startAt?: Date,
    signal?: AbortSignal,
  ): Promise<string> {
    if (typeof workflow === "string") {
      return await this._innerClient.scheduleNewOrchestration(workflow, input, instanceId, startAt, signal);
    }
    return await this._innerClient.scheduleNewOrchestration(
      getFunctionName(workflow),
      input,
      instanceId,
      startAt,
      signal,
    );
  }

  /**
   * Creates a schedule that starts the workflow repeatedly. Each run is a new, detached workflow instance with the
   * ID "<name>_<owner>_<fire time as 20060102T150405Z UTC>", where <owner> is a 6-character tag of the app that owns
   * the schedule, so all runs of a schedule are the instances whose ID starts with "<name>_<owner>_" (see the
   * instanceIdPrefix of listWorkflowInstanceIds).
   *
   * @param name 1 to 30 letters, digits or '-'.
   * @param schedule Dapr Jobs API syntax: a 6-field cron expression with seconds ("0 30 9 * * MON"),
   *   "@every <duration>" (at least 1s), or "@yearly", "@monthly", "@weekly", "@daily", "@hourly". A
   *   "CRON_TZ=<zone> " prefix sets the time zone of a cron expression, which is UTC otherwise.
   *
   * Times missed while the app was down are caught up durably: each starts its own run, one after another. Set
   * options.skipMissed to start one run for them instead and carry on from the next time after now.
   *
   * Runtime errors are propagated as ConnectError: InvalidArgument for an invalid schedule, AlreadyExists when the
   * name is taken and overwrite is not set, Unimplemented when the runtime does not support schedules.
   */
  public async createWorkflowSchedule(
    name: string,
    workflow: TWorkflow | string,
    schedule: string,
    options: CreateWorkflowScheduleOptions = {},
  ): Promise<void> {
    if (options.input !== undefined && options.serializedInput !== undefined) {
      throw new TypeError("input and serializedInput cannot both be set");
    }
    if (options.repeats !== undefined) assertUint32("repeats", options.repeats, 1);
    const workflowName = typeof workflow === "string" ? workflow : getFunctionName(workflow);
    await this._innerClient.createWorkflowSchedule(name, workflowName, schedule, options);
  }

  /**
   * Gets a schedule with its status, including how its last run went.
   * A missing schedule is propagated as a ConnectError with Code.NotFound.
   */
  public async getWorkflowSchedule(name: string): Promise<WorkflowSchedule> {
    return await this._innerClient.getWorkflowSchedule(name);
  }

  /**
   * Lists a page of the app's schedules with their status.
   */
  public async listWorkflowSchedules(options: ListWorkflowSchedulesOptions = {}): Promise<WorkflowSchedulePage> {
    if (options.pageSize !== undefined) assertUint32("pageSize", options.pageSize, 1);
    return await this._innerClient.listWorkflowSchedules(options);
  }

  /**
   * Stops and removes a schedule. Runs it already started are not affected.
   * A missing schedule is propagated as a ConnectError with Code.NotFound.
   */
  public async deleteWorkflowSchedule(name: string): Promise<void> {
    await this._innerClient.deleteWorkflowSchedule(name);
  }

  /**
   * Starts a run of the schedule now, without moving its next scheduled run, and returns the run's instance ID
   * ("<name>_<owner>_<time>_manual"). The run counts towards repeats. Triggers within the same millisecond start one
   * run.
   * Runtime errors are propagated as ConnectError: NotFound for a missing schedule, FailedPrecondition for a
   * completed schedule or when no workflow worker is connected for the app.
   */
  public async triggerWorkflowSchedule(name: string): Promise<string> {
    return await this._innerClient.triggerWorkflowSchedule(name);
  }

  public async terminateWorkflow(workflowInstanceId: string, output?: unknown, signal?: AbortSignal): Promise<void> {
    await this._innerClient.terminateOrchestration(workflowInstanceId, output, signal);
  }

  /**
   * Gets a snapshot of the current workflow state, or undefined if the instance does not exist.
   * Compare runtimeStatus with WorkflowRuntimeStatus members, not hard-coded numbers or strings.
   */
  public async getWorkflowState(
    workflowInstanceId: string,
    getInputsAndOutputs: boolean,
    signal?: AbortSignal,
  ): Promise<WorkflowState | undefined> {
    try {
      const state = await this._innerClient.getOrchestrationState(workflowInstanceId, getInputsAndOutputs, signal);
      if (state !== undefined) {
        return await WorkflowState.prepare(
          state,
          this._innerClient.serializer,
          this._innerClient.payloadHandler,
          signal,
        );
      }
    } catch (error) {
      if (!signal?.aborted && isWorkflowInstanceNotFound(error)) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Lists workflow instance IDs, optionally requesting a page using a continuation token.
   * instanceIdPrefix limits the result to the instances whose ID starts with it, for example "<schedule name>_".
   */
  public async listWorkflowInstanceIds(
    continuationToken?: string,
    pageSize?: number,
    instanceIdPrefix?: string,
  ): Promise<WorkflowInstanceIdPage> {
    if (pageSize !== undefined) assertUint32("pageSize", pageSize, 1);

    return await this._innerClient.listWorkflowInstanceIds(continuationToken, pageSize, instanceIdPrefix);
  }

  /**
   * Gets the complete execution history for a workflow instance.
   * Runtime errors, including missing instances, are propagated to the caller.
   */
  public async getWorkflowHistory(workflowInstanceId: string): Promise<HistoryEvent[]> {
    return await this._innerClient.getWorkflowHistory(workflowInstanceId);
  }

  /**
   * Creates a new workflow instance by rerunning from an event in an existing instance's history.
   * Replacement input applies to the activity targeted by the event, not the workflow's original input.
   * Runtime errors, including missing instances and nonexistent events, are propagated to the caller.
   */
  public async rerunWorkflowFromEvent(
    sourceInstanceId: string,
    eventId: number,
    options: RerunWorkflowFromEventOptions = {},
  ): Promise<string> {
    assertUint32("eventId", eventId, 0);
    if (options.newInstanceId !== undefined && options.newInstanceId.length === 0) {
      throw new TypeError("newInstanceId must not be empty");
    }

    return await this._innerClient.rerunWorkflowFromEvent(sourceInstanceId, eventId, options);
  }

  public async waitForWorkflowStart(
    workflowInstanceId: string,
    fetchPayloads = true,
    timeoutInSeconds = 60,
    signal?: AbortSignal,
  ): Promise<WorkflowState | undefined> {
    const state = await this._innerClient.waitForOrchestrationStart(
      workflowInstanceId,
      fetchPayloads,
      timeoutInSeconds,
      signal,
    );
    if (state !== undefined) {
      return await WorkflowState.prepare(state, this._innerClient.serializer, this._innerClient.payloadHandler, signal);
    }
  }

  public async waitForWorkflowCompletion(
    workflowInstanceId: string,
    fetchPayloads = true,
    timeoutInSeconds = 60,
    signal?: AbortSignal,
  ): Promise<WorkflowState | undefined> {
    const state = await this._innerClient.waitForOrchestrationCompletion(
      workflowInstanceId,
      fetchPayloads,
      timeoutInSeconds,
      signal,
    );
    if (state !== undefined) {
      return await WorkflowState.prepare(state, this._innerClient.serializer, this._innerClient.payloadHandler, signal);
    }
  }

  public async raiseEvent(
    workflowInstanceId: string,
    eventName: string,
    eventPayload?: unknown,
    signal?: AbortSignal,
  ): Promise<void> {
    await this._innerClient.raiseOrchestrationEvent(workflowInstanceId, eventName, eventPayload, signal);
  }

  public async purgeWorkflow(workflowInstanceId: string, signal?: AbortSignal): Promise<boolean> {
    const purgeResult = await this._innerClient.purgeOrchestration(workflowInstanceId, signal);
    if (purgeResult !== undefined) {
      return purgeResult.deletedInstanceCount > 0;
    }
    return false;
  }

  public async suspendWorkflow(workflowInstanceId: string, reason?: string, signal?: AbortSignal): Promise<void> {
    await this._innerClient.suspendOrchestration(workflowInstanceId, reason, signal);
  }

  public async resumeWorkflow(workflowInstanceId: string, reason?: string, signal?: AbortSignal): Promise<void> {
    await this._innerClient.resumeOrchestration(workflowInstanceId, reason, signal);
  }

  public async stop(): Promise<void> {
    await this._innerClient.stop();
  }
}

function isWorkflowInstanceNotFound(error: unknown): boolean {
  if (!(error instanceof ConnectError)) {
    return false;
  }

  return (
    error.code === Code.NotFound || (error.code === Code.Unknown && /no such instance exists/i.test(error.message))
  );
}

function assertUint32(name: string, value: number, min: number): void {
  if (!Number.isInteger(value) || value < min || value > 0xffffffff) {
    throw new RangeError(`${name} must be an integer between ${min} and 4294967295`);
  }
}

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

import { TaskHubClient } from "../engine/transport/TaskHubClient";
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
    );
  }

  public async scheduleNewWorkflow(
    workflow: TWorkflow | string,
    input?: unknown,
    instanceId?: string,
    startAt?: Date,
  ): Promise<string> {
    if (typeof workflow === "string") {
      return await this._innerClient.scheduleNewOrchestration(workflow, input, instanceId, startAt);
    }
    return await this._innerClient.scheduleNewOrchestration(getFunctionName(workflow), input, instanceId, startAt);
  }

  public async terminateWorkflow(workflowInstanceId: string, output?: unknown): Promise<void> {
    await this._innerClient.terminateOrchestration(workflowInstanceId, output);
  }

  /**
   * Gets a snapshot of the current workflow state, or undefined if the instance does not exist.
   * Compare runtimeStatus with WorkflowRuntimeStatus members, not hard-coded numbers or strings.
   */
  public async getWorkflowState(
    workflowInstanceId: string,
    getInputsAndOutputs: boolean,
  ): Promise<WorkflowState | undefined> {
    try {
      const state = await this._innerClient.getOrchestrationState(workflowInstanceId, getInputsAndOutputs);
      if (state !== undefined) {
        return new WorkflowState(state);
      }
    } catch (error) {
      if (isWorkflowInstanceNotFound(error)) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Lists workflow instance IDs, optionally requesting a page using a continuation token.
   */
  public async listWorkflowInstanceIds(continuationToken?: string, pageSize?: number): Promise<WorkflowInstanceIdPage> {
    if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 0xffffffff)) {
      throw new RangeError("pageSize must be an integer between 1 and 4294967295");
    }

    return await this._innerClient.listWorkflowInstanceIds(continuationToken, pageSize);
  }

  /**
   * Gets the complete execution history for a workflow instance.
   */
  public async getWorkflowHistory(workflowInstanceId: string): Promise<HistoryEvent[]> {
    return await this._innerClient.getWorkflowHistory(workflowInstanceId);
  }

  /**
   * Creates a new workflow instance by rerunning from an event in an existing instance's history.
   */
  public async rerunWorkflowFromEvent(
    sourceInstanceId: string,
    eventId: number,
    options: RerunWorkflowFromEventOptions = {},
  ): Promise<string> {
    if (!Number.isInteger(eventId) || eventId < 0 || eventId > 0xffffffff) {
      throw new RangeError("eventId must be an integer between 0 and 4294967295");
    }
    if (options.newInstanceId !== undefined && options.newInstanceId.length === 0) {
      throw new TypeError("newInstanceId must not be empty");
    }

    return await this._innerClient.rerunWorkflowFromEvent(sourceInstanceId, eventId, options);
  }

  public async waitForWorkflowStart(
    workflowInstanceId: string,
    fetchPayloads = true,
    timeoutInSeconds = 60,
  ): Promise<WorkflowState | undefined> {
    const state = await this._innerClient.waitForOrchestrationStart(
      workflowInstanceId,
      fetchPayloads,
      timeoutInSeconds,
    );
    if (state !== undefined) {
      return new WorkflowState(state);
    }
  }

  public async waitForWorkflowCompletion(
    workflowInstanceId: string,
    fetchPayloads = true,
    timeoutInSeconds = 60,
  ): Promise<WorkflowState | undefined> {
    const state = await this._innerClient.waitForOrchestrationCompletion(
      workflowInstanceId,
      fetchPayloads,
      timeoutInSeconds,
    );
    if (state !== undefined) {
      return new WorkflowState(state);
    }
  }

  public async raiseEvent(workflowInstanceId: string, eventName: string, eventPayload?: unknown): Promise<void> {
    await this._innerClient.raiseOrchestrationEvent(workflowInstanceId, eventName, eventPayload);
  }

  public async purgeWorkflow(workflowInstanceId: string): Promise<boolean> {
    const purgeResult = await this._innerClient.purgeOrchestration(workflowInstanceId);
    if (purgeResult !== undefined) {
      return purgeResult.deletedInstanceCount > 0;
    }
    return false;
  }

  public async suspendWorkflow(workflowInstanceId: string, reason?: string): Promise<void> {
    await this._innerClient.suspendOrchestration(workflowInstanceId, reason);
  }

  public async resumeWorkflow(workflowInstanceId: string, reason?: string): Promise<void> {
    await this._innerClient.resumeOrchestration(workflowInstanceId, reason);
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

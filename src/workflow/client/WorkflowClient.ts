/*
Copyright 2024 The Dapr Authors
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

import { TaskHubGrpcClient } from "kaibocai-durabletask-js";
import * as grpc from "@grpc/grpc-js";
import { WorkflowState } from "./WorkflowState";
import { generateInterceptors } from "../internal/ApiTokenClientInterceptor";
import { TWorkflow } from "../../types/workflow/Workflow.type";
import { getFunctionName } from "../internal";

export default class WorkflowClient {
  private readonly _innerClient: TaskHubGrpcClient;

  /**
   * Initializes a new instance of the DaprWorkflowClient.
   * @param {string | undefined} hostAddress - The address of the Dapr runtime hosting the workflow services.
   * @param {grpc.ChannelOptions | undefined} options - Additional options for configuring the gRPC channel.
   */
  constructor(hostAddress?: string, options?: grpc.ChannelOptions) {
    this._innerClient = this.buildInnerClient(hostAddress, options);
  }

  private buildInnerClient(hostAddress = "127.0.0.1:50001", options: grpc.ChannelOptions = {}): TaskHubGrpcClient {
    const innerOptions = {
      ...options,
      interceptors: [generateInterceptors(), ...(options?.interceptors ?? [])],
    };
    return new TaskHubGrpcClient(hostAddress, innerOptions);
  }

  /**
   * Schedules a new workflow using the DurableTask client.
   *
   * @param {TWorkflow | string} workflow - The Workflow or the name of the workflow to be scheduled.
   * @param {any} [input] - The input to be provided to the scheduled workflow.
   * @param {string} [instanceId] - An optional unique identifier for the workflow instance.
   * @param {Date} [startAt] - An optional date and time at which the workflow should start.
   * @return {Promise<string>} A Promise resolving to the unique ID of the scheduled workflow instance.
   */
  public async scheduleNewWorkflow(
    workflow: TWorkflow | string,
    input?: any,
    instanceId?: string,
    startAt?: Date,
  ): Promise<string> {
    if (typeof workflow === "string") {
      return await this._innerClient.scheduleNewOrchestration(workflow, input, instanceId, startAt);
    }
    return await this._innerClient.scheduleNewOrchestration(getFunctionName(workflow), input, instanceId, startAt);
  }

  /**
   * Terminates the workflow associated with the provided instance id.
   *
   * @param {string} workflowInstanceId - Workflow instance id to terminate.
   * @param {any} output - The optional output to set for the terminated workflow instance.
   */
  public async terminateWorkflow(workflowInstanceId: string, output: any) {
    await this._innerClient.terminateOrchestration(workflowInstanceId, output);
  }

  /**
   * Fetches workflow instance metadata from the configured durable store.
   *
   * @param {string} workflowInstanceId - The unique identifier of the workflow instance to fetch.
   * @param {boolean} getInputsAndOutputs - Indicates whether to fetch the workflow instance's
   *                                       inputs, outputs, and custom status (true) or omit them (false).
   * @returns {Promise<WorkflowState | undefined>} A Promise that resolves to a metadata record describing
   *                                              the workflow instance and its execution status, or undefined
   *                                              if the instance is not found.
   */
  public async getWorkflowState(
    workflowInstanceId: string,
    getInputsAndOutputs: boolean,
  ): Promise<WorkflowState | undefined> {
    const state = await this._innerClient.getOrchestrationState(workflowInstanceId, getInputsAndOutputs);
    if (state !== undefined) {
      return new WorkflowState(state);
    }
  }

  /**
   * Waits for a workflow to start running and returns a {@link WorkflowState} object
   * containing metadata about the started instance, and optionally, its input, output,
   * and custom status payloads.
   *
   * A "started" workflow instance refers to any instance not in the Pending state.
   *
   * If a workflow instance is already running when this method is called, it returns immediately.
   *
   * @param {string} workflowInstanceId - The unique identifier of the workflow instance to wait for.
   * @param {boolean} fetchPayloads - Indicates whether to fetch the workflow instance's
   *                                  inputs, outputs (true) or omit them (false).
   * @param {number} timeout - The amount of time, in seconds, to wait for the workflow instance to start.
   * @returns {Promise<WorkflowState | undefined>} A Promise that resolves to the workflow instance metadata
   *                                               or undefined if no such instance is found.
   */
  public async waitForWorkflowStart(
    workflowInstanceId: string,
    fetchPayloads?: boolean,
    timeout?: number,
  ): Promise<WorkflowState | undefined> {
    const state = await this._innerClient.waitForOrchestrationStart(workflowInstanceId, fetchPayloads, timeout);
    if (state !== undefined) {
      return new WorkflowState(state);
    }
  }

  /**
   * Waits for a workflow to complete running and returns a {@link WorkflowState} object
   * containing metadata about the completed instance, and optionally, its input, output,
   * and custom status payloads.
   *
   * A "completed" workflow instance refers to any instance in one of the terminal states.
   * For example, the Completed, Failed, or Terminated states.
   *
   * If a workflow instance is already running when this method is called, it returns immediately.
   *
   * @param {string} workflowInstanceId - The unique identifier of the workflow instance to wait for.
   * @param {boolean} fetchPayloads - Indicates whether to fetch the workflow instance's
   *                                  inputs, outputs (true) or omit them (false).
   * @param {number} timeout - The amount of time, in seconds, to wait for the workflow instance to start.
   * @returns {Promise<WorkflowState | undefined>} A Promise that resolves to the workflow instance metadata
   *                                               or undefined if no such instance is found.
   */
  public async waitForWorkflowCompletion(
    workflowInstanceId: string,
    fetchPayloads = true,
    timeout: number,
  ): Promise<WorkflowState | undefined> {
    const state = await this._innerClient.waitForOrchestrationCompletion(workflowInstanceId, fetchPayloads, timeout);
    if (state != undefined) {
      return new WorkflowState(state);
    }
  }

  /**
   * Sends an event notification message to an awaiting workflow instance.
   *
   * This method triggers the specified event in a running workflow instance,
   * allowing the workflow to respond to the event if it has defined event handlers.
   *
   * @param {string} workflowInstanceId - The unique identifier of the workflow instance that will handle the event.
   * @param {string} eventName - The name of the event. Event names are case-insensitive.
   * @param {any} [eventPayload] - An optional serializable data payload to include with the event.
   */
  public async raiseEvent(workflowInstanceId: string, eventName: string, eventPayload?: any) {
    this._innerClient.raiseOrchestrationEvent(workflowInstanceId, eventName, eventPayload);
  }

  /**
   * Purges the workflow instance state from the workflow state store.
   *
   * This method removes the persisted state associated with a workflow instance from the state store.
   *
   * @param {string} workflowInstanceId - The unique identifier of the workflow instance to purge.
   * @return {Promise<boolean>} A Promise that resolves to true if the workflow state was found and purged successfully, otherwise false.
   */
  public async purgeWorkflow(workflowInstanceId: string): Promise<boolean> {
    const purgeResult = await this._innerClient.purgeOrchestration(workflowInstanceId);
    if (purgeResult !== undefined) {
      return purgeResult.deletedInstanceCount > 0;
    }
    return false;
  }

  /**
   * Closes the inner DurableTask client and shutdown the GRPC channel.
   */
  public async stop() {
    await this._innerClient.stop();
  }
}

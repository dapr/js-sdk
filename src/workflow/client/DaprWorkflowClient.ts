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

import { TaskHubGrpcClient } from "../internal/durabletask";
import { WorkflowState } from "./WorkflowState";
import { generateApiTokenClientInterceptors, generateEndpoint, getDaprApiToken } from "../internal/index";
import { TWorkflow } from "../../types/workflow/Workflow.type";
import { getFunctionName } from "../internal";
import { WorkflowClientOptions } from "../../types/workflow/WorkflowClientOption";
import { GrpcEndpoint } from "../../network/GrpcEndpoint";

/**
 * Client for managing Dapr workflow instances.
 *
 * Provides operations for the complete workflow instance lifecycle: scheduling new workflows,
 * querying their status, waiting for completion, raising external events, and terminating instances.
 *
 * This class communicates with the Dapr sidecar's workflow engine (TaskHub) via gRPC.
 * All operations are asynchronous and require the Dapr sidecar to be running.
 *
 * @example
 * ```typescript
 * const client = new DaprWorkflowClient();
 *
 * // Start a workflow
 * const instanceId = await client.scheduleNewWorkflow(
 *   "orderWorkflow",
 *   { orderId: "123", amount: 99.99 }
 * );
 *
 * // Wait for completion
 * const state = await client.waitForWorkflowCompletion(instanceId);
 * console.log("Workflow completed:", state?.runtimeStatus);
 *
 * // Raise an event to a running workflow
 * await client.raiseEvent(instanceId, "paymentApproved", { transactionId: "tx-456" });
 *
 * // Stop the client
 * await client.stop();
 * ```
 *
 * @see {@link WorkflowState} for workflow instance metadata
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/}
 */
export default class DaprWorkflowClient {
  private readonly _innerClient: TaskHubGrpcClient;

  /**
   * Creates a new DaprWorkflowClient instance.
   *
   * Establishes a gRPC connection to the Dapr sidecar's workflow engine.
   * Configuration is loaded from options or environment variables (DAPR_HOST, DAPR_GRPC_PORT, etc).
   *
   * @param options - Configuration options for sidecar connection
   *
   * @example
   * ```typescript
   * // Use defaults (localhost:50001)
   * const client = new DaprWorkflowClient();
   *
   * // Custom configuration
   * const client = new DaprWorkflowClient({
   *   daprHost: "dapr-sidecar",
   *   daprPort: "50001",
   *   daprApiToken: process.env.DAPR_API_TOKEN
   * });
   * ```
   *
   * @see {@link WorkflowClientOptions}
   */
  constructor(options: Partial<WorkflowClientOptions> = {}) {
    const grpcEndpoint = generateEndpoint(options);
    options.daprApiToken = getDaprApiToken(options);
    this._innerClient = this.buildInnerClient(grpcEndpoint, options);
  }

  private buildInnerClient(grpcEndpoint: GrpcEndpoint, options: Partial<WorkflowClientOptions>): TaskHubGrpcClient {
    let innerOptions = options?.grpcOptions;
    if (options.daprApiToken !== undefined && options.daprApiToken !== "") {
      innerOptions = {
        ...innerOptions,
        interceptors: [generateApiTokenClientInterceptors(options), ...(innerOptions?.interceptors ?? [])],
      };
    }
    return new TaskHubGrpcClient(grpcEndpoint.endpoint, innerOptions, grpcEndpoint.tls);
  }

  /**
   * Schedules a new workflow instance for execution.
   *
   * Creates a new workflow instance with the provided input and adds it to the scheduler queue.
   * The workflow will be executed by the TaskHub when capacity is available. This method returns
   * immediately after scheduling; it does not wait for the workflow to start or complete.
   *
   * @param workflow - The workflow function or name to schedule
   * @param input - JSON-serializable input value for the workflow (optional)
   * @param instanceId - Unique identifier for this workflow instance. If not provided, a GUID is generated
   * @param startAt - Date and time at which to start the workflow (if not provided, starts immediately)
   *
   * @returns Promise resolving to the instance ID of the newly scheduled workflow
   *
   * @throws Rejects if the workflow name is invalid or scheduling fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * // Schedule workflow with generated instance ID
   * const instanceId = await client.scheduleNewWorkflow(
   *   "orderWorkflow",
   *   { orderId: "123", customerId: "cust-456" }
   * );
   * console.log("Scheduled workflow:", instanceId);
   *
   * // Schedule with specific instance ID
   * await client.scheduleNewWorkflow(
   *   "orderWorkflow",
   *   { orderId: "789" },
   *   "order-789-instance"
   * );
   *
   * // Schedule to start at a future time
   * const startTime = new Date(Date.now() + 3600000); // 1 hour from now
   * await client.scheduleNewWorkflow(
   *   "reportWorkflow",
   *   {},
   *   undefined,
   *   startTime
   * );
   * ```
   *
   * @see {@link waitForWorkflowStart}
   * @see {@link waitForWorkflowCompletion}
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
   * Terminates a running workflow instance.
   *
   * Stops execution of the workflow and transitions it to the Terminated state.
   * Any pending activities or timers are canceled. An optional output value can be
   * provided to capture termination context or final state.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to terminate
   * @param output - Optional value to set as the workflow's output (must be JSON-serializable)
   *
   * @returns Promise resolving when the termination is processed
   *
   * @throws Rejects if the workflow instance is not found or termination fails
   *
   * @example
   * ```typescript
   * // Terminate a workflow with no output
   * await client.terminateWorkflow("order-123");
   *
   * // Terminate with output
   * await client.terminateWorkflow("order-123", {
   *   reason: "Customer requested cancellation",
   *   cancelledAt: new Date()
   * });
   * ```
   *
   * @see {@link getWorkflowState}
   * @see {@link WorkflowRuntimeStatus.Terminated}
   */
  public async terminateWorkflow(workflowInstanceId: string, output: any) {
    await this._innerClient.terminateOrchestration(workflowInstanceId, output);
  }

  /**
   * Retrieves the current state of a workflow instance.
   *
   * Fetches metadata about a workflow instance from the state store, including its
   * identity, current status, timestamps, and optionally its input/output and custom status.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to query
   * @param getInputsAndOutputs - If true, includes serialized input, output, and custom status in the response.
   *                              If false, only includes metadata (name, status, timestamps)
   *
   * @returns Promise resolving to a WorkflowState object, or undefined if the instance is not found
   *
   * @throws Rejects if the query fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * // Get metadata only
   * const state = await client.getWorkflowState("order-123", false);
   * if (state) {
   *   console.log("Status:", state.runtimeStatus);
   *   console.log("Created at:", state.createdAt);
   * }
   *
   * // Get full details including input/output
   * const fullState = await client.getWorkflowState("order-123", true);
   * if (fullState) {
   *   console.log("Input:", fullState.serializedInput);
   *   console.log("Output:", fullState.serializedOutput);
   *   console.log("Custom status:", fullState.customStatus);
   * }
   * ```
   *
   * @see {@link WorkflowState}
   * @see {@link waitForWorkflowCompletion}
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
   * Waits for a workflow instance to start execution.
   *
   * Blocks until the workflow transitions from Pending state to any other state (Running, Completed, Failed, etc).
   * Returns immediately if the workflow has already started. This is useful to ensure a workflow has begun
   * processing before proceeding with subsequent operations.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to wait for
   * @param fetchPayloads - If true, includes serialized input and output in the response (default: true)
   * @param timeoutInSeconds - Maximum time to wait, in seconds (default: 60)
   *
   * @returns Promise resolving to WorkflowState when the workflow starts, or undefined if timeout is exceeded
   *
   * @throws Rejects if the workflow is not found or the wait operation fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * const instanceId = await client.scheduleNewWorkflow("orderWorkflow", { orderId: "123" });
   *
   * // Wait for the workflow to start (up to 30 seconds)
   * const state = await client.waitForWorkflowStart(instanceId, true, 30);
   * if (state) {
   *   console.log("Workflow started! Status:", state.runtimeStatus);
   * } else {
   *   console.log("Timeout waiting for workflow to start");
   * }
   * ```
   *
   * @see {@link scheduleNewWorkflow}
   * @see {@link waitForWorkflowCompletion}
   * @see {@link WorkflowRuntimeStatus.Running}
   */
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

  /**
   * Waits for a workflow instance to complete.
   *
   * Blocks until the workflow reaches a terminal state (Completed, Failed, Terminated, or ContinuedAsNew).
   * Returns immediately if the workflow has already completed. This is the primary pattern for synchronous
   * workflow orchestration: start a workflow, wait for completion, then retrieve results.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to wait for
   * @param fetchPayloads - If true, includes serialized input, output, and custom status in the response (default: true)
   * @param timeoutInSeconds - Maximum time to wait, in seconds (default: 300, i.e., 5 minutes)
   *
   * @returns Promise resolving to WorkflowState containing final state and results, or undefined if timeout is exceeded
   *
   * @throws Rejects if the workflow is not found or the wait operation fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * // Start a long-running workflow
   * const instanceId = await client.scheduleNewWorkflow(
   *   "processOrderWorkflow",
   *   { orderId: "ORDER-123", amount: 9999 }
   * );
   *
   * // Wait for completion (up to 5 minutes)
   * const result = await client.waitForWorkflowCompletion(instanceId, true, 300);
   *
   * if (result) {
   *   console.log("Workflow status:", result.runtimeStatus);
   *   console.log("Result output:", result.output);
   *
   *   if (result.runtimeStatus === "COMPLETED") {
   *     console.log("Order processed successfully!");
   *   } else if (result.runtimeStatus === "FAILED") {
   *     console.log("Order processing failed:", result.failureDetails?.errorMessage);
   *   }
   * } else {
   *   console.log("Workflow did not complete within 5 minutes");
   * }
   * ```
   *
   * @see {@link scheduleNewWorkflow}
   * @see {@link waitForWorkflowStart}
   * @see {@link WorkflowRuntimeStatus}
   */
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

  /**
   * Sends an external event to a workflow instance.
   *
   * Delivers an event notification to a running workflow that is waiting for external events via
   * `context.waitForExternalEvent()`. Events are delivered reliably and in the order they were sent.
   * Event names are case-insensitive. If the workflow is not currently waiting for the event,
   * the event is queued until the workflow explicitly waits for it.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to send the event to
   * @param eventName - The name of the event (case-insensitive). Should match the name used in waitForExternalEvent()
   * @param eventPayload - Optional JSON-serializable data to accompany the event
   *
   * @returns Promise resolving when the event is delivered to the workflow
   *
   * @throws Rejects if the workflow is not found or the event delivery fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * // Start a workflow that waits for approval
   * const instanceId = await client.scheduleNewWorkflow("approvalWorkflow", {
   *   requestId: "REQ-123",
   *   amount: 5000
   * });
   *
   * // Later, send approval event
   * await client.raiseEvent(instanceId, "approval", {
   *   approvedBy: "manager@company.com",
   *   timestamp: new Date(),
   *   notes: "Approved for budget Q1"
   * });
   *
   * // Event names are case-insensitive; these are equivalent:
   * await client.raiseEvent(instanceId, "PaymentReceived", { amount: 100 });
   * await client.raiseEvent(instanceId, "paymentreceived", { amount: 200 });
   * ```
   *
   * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/howto-manage-workflows/#raise-event}
   */
  public async raiseEvent(workflowInstanceId: string, eventName: string, eventPayload?: any) {
    await this._innerClient.raiseOrchestrationEvent(workflowInstanceId, eventName, eventPayload);
  }

  /**
   * Permanently removes workflow instance state from the state store.
   *
   * Deletes all persisted state associated with a workflow instance, including its history,
   * input, output, and custom status. This operation is idempotent; calling it on a non-existent
   * instance returns false without error. Use this to reclaim storage space for long-completed workflows.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to purge
   *
   * @returns Promise resolving to true if a workflow was found and deleted, false if the instance did not exist
   *
   * @throws Rejects if the purge operation fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * // Clean up old workflows (retention period has passed)
   * const deleted = await client.purgeWorkflow("order-2023-01-15");
   * if (deleted) {
   *   console.log("Workflow state purged successfully");
   * } else {
   *   console.log("Workflow not found or already purged");
   * }
   *
   * // Purge is idempotent - safe to call multiple times
   * await client.purgeWorkflow("order-2023-01-15"); // Returns false on second call
   * ```
   *
   * @see {@link scheduleNewWorkflow}
   * @see {@link getWorkflowState}
   */
  public async purgeWorkflow(workflowInstanceId: string): Promise<boolean> {
    const purgeResult = await this._innerClient.purgeOrchestration(workflowInstanceId);
    if (purgeResult !== undefined) {
      return purgeResult.deletedInstanceCount > 0;
    }
    return false;
  }

  /**
   * Suspends a running workflow instance.
   *
   * Pauses execution of a workflow without terminating it. The workflow will halt processing
   * of scheduled activities and timers. It can be resumed later with `resumeWorkflow()` to
   * continue from where it paused. This is useful for implementing workflow throttling,
   * rate limiting, or administrative pause operations.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to suspend
   *
   * @returns Promise resolving when the suspension is processed
   *
   * @throws Rejects if the workflow is not found or suspension fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * // Start a long-running workflow
   * const instanceId = await client.scheduleNewWorkflow("processingWorkflow", {});
   *
   * // Later, pause the workflow for maintenance
   * await client.suspendWorkflow(instanceId);
   * console.log("Workflow paused");
   *
   * // Resume after maintenance window
   * await client.resumeWorkflow(instanceId);
   * console.log("Workflow resumed");
   * ```
   *
   * @see {@link resumeWorkflow}
   * @see {@link terminateWorkflow}
   * @see {@link WorkflowRuntimeStatus.Suspended}
   */
  public async suspendWorkflow(workflowInstanceId: string): Promise<void> {
    return await this._innerClient.suspendOrchestration(workflowInstanceId);
  }

  /**
   * Resumes a suspended workflow instance.
   *
   * Transitions a suspended workflow back to the Running state, allowing it to resume processing
   * scheduled activities and timers. The workflow continues execution deterministically from where
   * it was suspended. Can only be called on workflows that are currently in the Suspended state.
   *
   * @param workflowInstanceId - The unique identifier of the workflow instance to resume
   *
   * @returns Promise resolving when the resumption is processed
   *
   * @throws Rejects if the workflow is not found, not suspended, or resumption fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * // Workflow must be suspended first
   * const instanceId = await client.scheduleNewWorkflow("processingWorkflow", {});
   * await client.suspendWorkflow(instanceId);
   *
   * // Resume execution
   * await client.resumeWorkflow(instanceId);
   * console.log("Workflow resumed and running");
   *
   * // Wait for completion
   * const state = await client.waitForWorkflowCompletion(instanceId);
   * console.log("Final status:", state?.runtimeStatus);
   * ```
   *
   * @see {@link suspendWorkflow}
   * @see {@link waitForWorkflowCompletion}
   * @see {@link WorkflowRuntimeStatus.Running}
   */
  public async resumeWorkflow(workflowInstanceId: string): Promise<void> {
    return await this._innerClient.resumeOrchestration(workflowInstanceId);
  }

  /**
   * Gracefully shuts down the workflow client.
   *
   * Closes the gRPC channel to the Dapr sidecar and releases associated resources.
   * Call this method before application shutdown to ensure clean resource cleanup.
   * Subsequent method calls will fail with connection errors after stop() is called.
   *
   * @returns Promise resolving when the client has fully shut down
   *
   * @throws Rejects if shutdown fails
   *
   * @example
   * ```typescript
   * const client = new DaprWorkflowClient();
   *
   * try {
   *   // Use the client to manage workflows
   *   const instanceId = await client.scheduleNewWorkflow("myWorkflow", {});
   *   const result = await client.waitForWorkflowCompletion(instanceId);
   *   console.log("Workflow completed:", result);
   * } finally {
   *   // Always stop the client before exit
   *   await client.stop();
   *   console.log("Client shutdown complete");
   * }
   * ```
   */
  public async stop() {
    await this._innerClient.stop();
  }
}

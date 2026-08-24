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

import { ActivityContext, OrchestrationContext, TaskHubGrpcWorker } from "../internal/durabletask";
import { TWorkflow } from "../../types/workflow/Workflow.type";
import { TWorkflowActivity } from "../../types/workflow/Activity.type";
import { TInput, TOutput } from "../../types/workflow/InputOutput.type";
import WorkflowActivityContext from "./WorkflowActivityContext";
import WorkflowContext from "./WorkflowContext";
import { generateApiTokenClientInterceptors, generateEndpoint, getDaprApiToken } from "../internal/index";
import { getFunctionName } from "../internal";
import { WorkflowClientOptions } from "../../types/workflow/WorkflowClientOption";
import { GrpcEndpoint } from "../../network/GrpcEndpoint";

/**
 * Runtime for hosting and executing workflow definitions and activity functions.
 *
 * Manages the registration of workflow orchestrators and activity functions, then starts
 * a worker that connects to the Dapr sidecar to receive and execute work items. The runtime
 * uses the gRPC TaskHub protocol to coordinate with the sidecar's workflow engine.
 *
 * Typical usage: register workflows and activities, then call `start()` to begin processing.
 * The start() call blocks until `stop()` is invoked (e.g., on application shutdown).
 *
 * Multiple workflows and activities can be registered with the same runtime instance.
 * Workflows may invoke activities, sub-workflows, and other orchestration primitives.
 *
 * @example
 * ```typescript
 * const runtime = new WorkflowRuntime();
 *
 * // Register workflows
 * runtime.registerWorkflow(orderWorkflow);
 * runtime.registerWorkflow(approvalWorkflow);
 *
 * // Register activities
 * runtime.registerActivity(processPayment);
 * runtime.registerActivity(sendNotification);
 *
 * // Start the worker and begin processing
 * await runtime.start();
 * ```
 *
 * @see {@link WorkflowContext}
 * @see {@link WorkflowActivityContext}
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/}
 */
export default class WorkflowRuntime {
  private worker: TaskHubGrpcWorker;

  /**
   * Creates a new WorkflowRuntime instance.
   *
   * Establishes a gRPC connection to the Dapr sidecar's workflow engine (TaskHub).
   * Configuration is loaded from options or environment variables (DAPR_HOST, DAPR_GRPC_PORT, etc).
   * Workflows and activities must be registered before calling `start()`.
   *
   * @param options - Configuration options for sidecar connection and gRPC tuning
   *
   * @example
   * ```typescript
   * // Using defaults (localhost:50001)
   * const runtime = new WorkflowRuntime();
   *
   * // With custom configuration
   * const runtime = new WorkflowRuntime({
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
    this.worker = this.buildInnerWorker(grpcEndpoint, options);
  }

  private buildInnerWorker(grpcEndpoint: GrpcEndpoint, options: Partial<WorkflowClientOptions>): TaskHubGrpcWorker {
    let innerOptions = options?.grpcOptions;
    if (options.daprApiToken !== undefined && options.daprApiToken !== "") {
      innerOptions = {
        ...innerOptions,
        interceptors: [generateApiTokenClientInterceptors(options), ...(innerOptions?.interceptors ?? [])],
      };
    }
    return new TaskHubGrpcWorker(grpcEndpoint.endpoint, innerOptions, grpcEndpoint.tls);
  }

  /**
   * Registers a workflow orchestrator function.
   *
   * The workflow is registered under its function name (derived from the function object).
   * When a workflow with this name is scheduled, the registered function will be invoked
   * to execute the orchestration logic.
   *
   * The registered function receives a WorkflowContext for orchestration primitives
   * (activities, timers, child workflows, external events) and input data.
   *
   * Workflows must be deterministic—for a given input, the same sequence of operations
   * must be issued each time the function executes (including on replay). Non-deterministic
   * operations (random numbers, timestamps, concurrency decisions) should use WorkflowContext
   * methods instead of direct calls.
   *
   * @param workflow - The workflow orchestrator function to register
   * @returns This WorkflowRuntime instance (for method chaining)
   *
   * @example
   * ```typescript
   * async function* orderWorkflow(ctx: WorkflowContext, order: Order) {
   *   const payment = yield ctx.callActivity(processPayment, order.amount);
   *   const notification = yield ctx.callActivity(sendConfirmation, order.email);
   *   return { orderId: order.id, status: "completed" };
   * }
   *
   * runtime.registerWorkflow(orderWorkflow);
   * ```
   *
   * @see {@link WorkflowContext}
   * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/}
   */
  public registerWorkflow(workflow: TWorkflow): WorkflowRuntime {
    const name = getFunctionName(workflow);
    const workflowWrapper = (ctx: OrchestrationContext, input: any): any => {
      const workflowContext = new WorkflowContext(ctx);
      return workflow(workflowContext, input);
    };
    this.worker.addNamedOrchestrator(name, workflowWrapper);
    return this;
  }

  /**
   * Registers a workflow orchestrator function with an explicit name.
   *
   * Similar to `registerWorkflow()`, but allows overriding the function's name.
   * Useful when the same orchestrator logic needs multiple registrations under different names,
   * or when the function name doesn't reflect the orchestration role.
   *
   * @param name - The name to register the workflow under (used when scheduling workflows)
   * @param workflow - The workflow orchestrator function
   * @returns This WorkflowRuntime instance (for method chaining)
   *
   * @example
   * ```typescript
   * function* genericWorkflow(ctx: WorkflowContext, input: any) {
   *   // Generic orchestration logic
   * }
   *
   * // Register the same function under different names
   * runtime.registerWorkflowWithName("orderWorkflow", genericWorkflow);
   * runtime.registerWorkflowWithName("paymentWorkflow", genericWorkflow);
   * ```
   */
  public registerWorkflowWithName(name: string, workflow: TWorkflow): WorkflowRuntime {
    const workflowWrapper = (ctx: OrchestrationContext, input: any): any => {
      const workflowContext = new WorkflowContext(ctx);
      return workflow(workflowContext, input);
    };
    this.worker.addNamedOrchestrator(name, workflowWrapper);
    return this;
  }

  /**
   * Registers an activity function.
   *
   * The activity is registered under its function name (derived from the function object).
   * Activities are scheduled by workflows via `context.callActivity()`. Each activity
   * invocation executes exactly once (no replay), making it safe to perform I/O operations
   * such as database queries, network calls, or file I/O.
   *
   * Activities may fail and be retried by the workflow orchestrator. Each retry is a fresh
   * invocation (not replayed), so activities should be idempotent or use activity context
   * metadata to detect retries if needed.
   *
   * @param fn - The activity function to register. Receives WorkflowActivityContext and input.
   * @returns This WorkflowRuntime instance (for method chaining)
   *
   * @example
   * ```typescript
   * async function processPayment(ctx: WorkflowActivityContext, amount: number) {
   *   const workflowId = ctx.getWorkflowInstanceId();
   *   console.log(`Processing payment ${amount} for workflow ${workflowId}`);
   *
   *   // Safe to perform I/O here
   *   const result = await paymentGateway.charge(amount);
   *   return result;
   * }
   *
   * runtime.registerActivity(processPayment);
   * ```
   *
   * @see {@link WorkflowActivityContext}
   */
  public registerActivity(fn: TWorkflowActivity<TInput, TOutput>): WorkflowRuntime {
    const name = getFunctionName(fn);
    const activityWrapper = (ctx: ActivityContext, intput: TInput): TOutput => {
      const wfActivityContext = new WorkflowActivityContext(ctx);
      return fn(wfActivityContext, intput);
    };
    this.worker.addNamedActivity(name, activityWrapper);
    return this;
  }

  /**
   * Registers an activity function with an explicit name.
   *
   * Similar to `registerActivity()`, but allows overriding the function's name.
   * Useful for reusing activity logic under different names, or when function names
   * don't clearly reflect their workflow role.
   *
   * @param name - The name to register the activity under (used when scheduling activities)
   * @param fn - The activity function to register
   * @returns This WorkflowRuntime instance (for method chaining)
   *
   * @example
   * ```typescript
   * async function genericHttpCall(ctx: WorkflowActivityContext, url: string) {
   *   // Generic HTTP activity logic
   *   return fetch(url).then(r => r.json());
   * }
   *
   * // Register under semantic names
   * runtime.registerActivityWithName("getCustomerData", genericHttpCall);
   * runtime.registerActivityWithName("getInventory", genericHttpCall);
   * ```
   */
  public registerActivityWithName(name: string, fn: TWorkflowActivity<TInput, TOutput>): WorkflowRuntime {
    const activityWrapper = (ctx: ActivityContext, intput: TInput): any => {
      const wfActivityContext = new WorkflowActivityContext(ctx);
      return fn(wfActivityContext, intput);
    };

    this.worker.addNamedActivity(name, activityWrapper);
    return this;
  }

  /**
   * Starts the workflow runtime and begins processing work items.
   *
   * Connects to the Dapr sidecar and begins polling for workflow orchestrations and activities
   * to execute. This call blocks until `stop()` is invoked. All workflows and activities must
   * be registered before calling `start()`.
   *
   * Workflows are executed deterministically with replay from history. Activities are executed
   * exactly once per invocation and may perform I/O.
   *
   * @returns Promise that resolves when the worker has started and is ready to process work items
   *
   * @throws Rejects if connection to sidecar fails or worker startup fails
   *
   * @example
   * ```typescript
   * const runtime = new WorkflowRuntime();
   * runtime.registerWorkflow(myWorkflow);
   * runtime.registerActivity(myActivity);
   *
   * // Start processing (blocks until stop() is called)
   * await runtime.start();
   * ```
   */
  public async start() {
    await this.worker.start();
  }

  /**
   * Stops the workflow runtime gracefully.
   *
   * Ceases accepting new work items and waits for any in-progress orchestrations and activities
   * to complete. Pending work items are not lost; they remain in the TaskHub and will be
   * picked up by another runtime worker or when this runtime restarts.
   *
   * Call this during application shutdown (e.g., on SIGTERM signal) to ensure clean shutdown.
   *
   * @returns Promise that resolves when the worker has stopped and all resources are released
   *
   * @throws Rejects if the shutdown process fails
   *
   * @example
   * ```typescript
   * const runtime = new WorkflowRuntime();
   * // ... register workflows and activities ...
   *
   * const server = startHttpServer();
   *
   * process.on("SIGTERM", async () => {
   *   console.log("Shutting down...");
   *   await runtime.stop();
   *   await server.close();
   *   process.exit(0);
   * });
   *
   * await runtime.start();
   * ```
   */
  public async stop() {
    await this.worker.stop();
  }
}

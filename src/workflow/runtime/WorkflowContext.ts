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

import { OrchestrationContext } from "../internal/durabletask";
import { Task } from "../internal/durabletask/task/task";
import { TWorkflowActivity } from "../../types/workflow/Activity.type";
import { TWorkflow } from "../../types/workflow/Workflow.type";
import { getFunctionName } from "../internal";
import { WhenAllTask } from "../internal/durabletask/task/when-all-task";
import { whenAll, whenAny } from "../internal/durabletask/task";
import { WhenAnyTask } from "../internal/durabletask/task/when-any-task";
import { TInput, TOutput } from "../../types/workflow/InputOutput.type";

/**
 * Provides orchestration primitives for workflow functions.
 *
 * Used exclusively within orchestrator (workflow) functions to schedule durable activities,
 * child workflows, timers, and external events. All operations return Tasks that must be
 * yielded to enable replay-safe, deterministic orchestration execution.
 *
 * CRITICAL: Orchestrator code must be deterministic. For a given input and history,
 * the same sequence of `yield` operations must be issued each time the function executes
 * (including during replay from history). Non-deterministic operations (random numbers,
 * Date.now(), if decisions based on non-yielded values) violate this requirement and will
 * cause incorrect orchestration behavior.
 *
 * Use WorkflowContext methods for all I/O, timing, and concurrency—never make direct calls.
 * For I/O operations (network, database), use activities. For durable waiting, use timers.
 * For parallelism, use `whenAll()` or `whenAny()`.
 *
 * @example
 * ```typescript
 * // Complete workflow example demonstrating orchestration primitives
 * async function* approvalWorkflow(ctx: WorkflowContext, input: ApprovalRequest) {
 *   // Get current time deterministically
 *   const startTime = ctx.getCurrentUtcDateTime();
 *
 *   // Schedule an activity
 *   const approval = yield ctx.callActivity(getApproval, input);
 *
 *   // Set custom status for monitoring
 *   ctx.setCustomStatus("Approval received");
 *
 *   // Wait for external event
 *   const finalDecision = yield ctx.waitForExternalEvent("finalDecision");
 *
 *   // Create a timer
 *   const timeout = new Date(startTime.getTime() + 3600000);
 *   const timerTask = ctx.createTimer(timeout);
 *
 *   // Schedule multiple activities in parallel
 *   const notificationTask = ctx.callActivity(sendNotification, finalDecision);
 *   const loggingTask = ctx.callActivity(logApproval, finalDecision);
 *   yield ctx.whenAll([notificationTask, loggingTask]);
 *
 *   return { approved: finalDecision.approved, startedAt: startTime };
 * }
 * ```
 *
 * @see {@link WorkflowActivityContext}
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/}
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/}
 */
export default class WorkflowContext {
  private readonly _innerContext: OrchestrationContext;
  constructor(innerContext: OrchestrationContext) {
    if (!innerContext) {
      throw new Error("ActivityContext cannot be undefined");
    }
    this._innerContext = innerContext;
  }

  /**
   * Gets the unique identifier of the current workflow instance.
   *
   * Allows workflows to reference their own instance ID for logging, correlation,
   * or passing to activities for use in side effects.
   *
   * @returns The unique instance identifier assigned when the workflow was scheduled
   *
   * @example
   * ```typescript
   * async function* myWorkflow(ctx: WorkflowContext) {
   *   const id = ctx.getWorkflowInstanceId();
   *   yield ctx.callActivity(logWorkflowStart, { id });
   * }
   * ```
   */
  public getWorkflowInstanceId(): string {
    return this._innerContext.instanceId;
  }

  /**
   * Gets the current date and time in UTC in a replay-safe manner.
   *
   * Returns the same timestamp for all replays of the same orchestration history point.
   * Use this for all time operations in orchestrators—never use Date.now() or new Date()
   * directly, as these produce non-deterministic values during replay.
   *
   * @returns The current UTC timestamp (deterministic across replays)
   *
   * @example
   * ```typescript
   * async function* invoiceWorkflow(ctx: WorkflowContext, invoice: Invoice) {
   *   const processedAt = ctx.getCurrentUtcDateTime();
   *
   *   // Deterministically create a timer 30 days in the future
   *   const dueDate = new Date(processedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
   *   yield ctx.createTimer(dueDate);
   *
   *   yield ctx.callActivity(sendReminder, { invoiceId: invoice.id, dueDate });
   * }
   * ```
   */
  public getCurrentUtcDateTime(): Date {
    return this._innerContext.currentUtcDateTime;
  }

  /**
   * Indicates whether the orchestrator is currently replaying from history.
   *
   * Returns true when the orchestrator is re-executing previously recorded operations
   * from the workflow's history. Useful for avoiding duplicate side effects in activities
   * or logging; code that should run once can check this flag.
   *
   * However, most application logic should treat replay as transparent and not depend
   * on this flag—the framework handles determinism and idempotency.
   *
   * @returns true if replaying from history; false if this is live execution
   *
   * @example
   * ```typescript
   * async function* reportWorkflow(ctx: WorkflowContext) {
   *   const timestamp = ctx.getCurrentUtcDateTime();
   *
   *   // This executes on both live execution and replay
   *   const data = yield ctx.callActivity(fetchData, { date: timestamp });
   *
   *   // This condition is replay-safe (based on yielded value)
   *   if (data.requiresApproval) {
   *     yield ctx.callActivity(requestApproval, data);
   *   }
   *
   *   // Logging non-replayed events (recommended)
   *   if (!ctx.isReplaying()) {
   *     console.log("Workflow completed for date:", timestamp);
   *   }
   * }
   * ```
   */
  public isReplaying(): boolean {
    return this._innerContext.isReplaying;
  }

  /**
   * Creates a durable timer that fires at the specified time.
   *
   * Schedules an asynchronous timer that completes at a given UTC timestamp. The workflow
   * is durably suspended until the timer fires or the workflow terminates. Timers are
   * reliable—they survive orchestrator replays and sidecar restarts.
   *
   * The timer duration is calculated from `getCurrentUtcDateTime()`, ensuring replay-safe,
   * deterministic timer semantics. Always use this method instead of setTimeout() for
   * durable waiting in orchestrators.
   *
   * @param fireAt - The UTC Date/time when the timer should fire, or a timestamp in milliseconds
   * @returns A Task that completes when the timer fires
   *
   * @example
   * ```typescript
   * async function* delayedApprovalWorkflow(ctx: WorkflowContext, request: Request) {
   *   const now = ctx.getCurrentUtcDateTime();
   *
   *   // Create a timer for 1 hour from now
   *   const fireAt = new Date(now.getTime() + 3600000);
   *   const timerTask = ctx.createTimer(fireAt);
   *
   *   // Create a task for waiting for external approval
   *   const approvalTask = ctx.waitForExternalEvent("approval");
   *
   *   // Wait for either the timer to fire or approval to arrive, whichever comes first
   *   const result = yield ctx.whenAny([timerTask, approvalTask]);
   *
   *   if (result === timerTask) {
   *     yield ctx.callActivity(handleTimeout, request);
   *   } else {
   *     yield ctx.callActivity(processApproval, result);
   *   }
   * }
   * ```
   *
   * @see {@link createTimer}
   * @see {@link whenAny}
   */
  public createTimer(fireAt: Date | number): Task<any> {
    return this._innerContext.createTimer(fireAt);
  }

  /**
   * Schedules an activity function for execution by the workflow runtime.
   *
   * Activities are the mechanism for performing I/O operations (network calls, database
   * queries, sending emails, etc.) from within a workflow. Each activity invocation:
   * - Executes exactly once per scheduling (no replay)
   * - Receives a WorkflowActivityContext with metadata about the workflow
   * - May safely perform side effects and I/O
   * - May be retried by the orchestrator if it fails
   * - Must be JSON-serializable for input/output
   *
   * Activities are not replayed; only the results are replayed. This makes them safe
   * for I/O but requires their results to be deterministic (same input yields same output).
   *
   * @param activity - The activity function to invoke, or its registered name
   * @param input - JSON-serializable input value for the activity (optional)
   * @returns A Task that completes with the activity's return value
   *
   * @example
   * ```typescript
   * async function processPayment(ctx: WorkflowActivityContext, amount: number) {
   *   return await paymentGateway.charge(amount);
   * }
   *
   * async function* orderWorkflow(ctx: WorkflowContext, order: Order) {
   *   // Call activity by reference
   *   const payment = yield ctx.callActivity(processPayment, order.total);
   *
   *   if (payment.success) {
   *     // Call activity by name
   *     const confirmation = yield ctx.callActivity("sendConfirmation", order.id);
   *   }
   *
   *   return { orderId: order.id, paymentId: payment.id };
   * }
   * ```
   *
   * @see {@link WorkflowActivityContext}
   * @see {@link whenAll} for parallel activities
   */
  public callActivity(activity: TWorkflowActivity<TInput, TOutput> | string, input?: TInput): Task<TOutput> {
    if (typeof activity === "string") {
      return this._innerContext.callActivity(activity, input);
    }
    return this._innerContext.callActivity(getFunctionName(activity), input);
  }

  /**
   * Schedules a child workflow for execution.
   *
   * Invokes another workflow as a sub-orchestration, enabling workflow composition and
   * hierarchical organization. The parent workflow is suspended until the child completes.
   * Child workflows execute as separate instances with their own IDs and state stores,
   * but share the same sidecar connection and TaskHub.
   *
   * Useful for:
   * - Decomposing large workflows into reusable sub-workflows
   * - Implementing workflow templates
   * - Parallel sub-orchestrations via `whenAll()`
   * - Delegating specific concerns to dedicated sub-workflows
   *
   * @param orchestrator - The child workflow function to invoke, or its registered name
   * @param input - JSON-serializable input for the child workflow (optional)
   * @param instanceId - Unique ID for the child instance. If not provided, a GUID is generated
   * @returns A Task that completes with the child workflow's return value
   *
   * @example
   * ```typescript
   * async function* processOrderWorkflow(ctx: WorkflowContext, order: Order) {
   *   // Call child workflow by reference
   *   const paymentResult = yield ctx.callChildWorkflow(paymentWorkflow, { orderId: order.id });
   *
   *   // Call child workflow by name with specific instance ID
   *   const shippingResult = yield ctx.callChildWorkflow(
   *     "shippingWorkflow",
   *     { orderId: order.id },
   *     `shipping-${order.id}`
   *   );
   *
   *   return { paymentId: paymentResult.id, trackingId: shippingResult.tracking };
   * }
   * ```
   *
   * @see {@link callActivity}
   * @see {@link whenAll} for parallel sub-workflows
   */
  public callChildWorkflow<TInput, TOutput>(
    orchestrator: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
  ): Task<TOutput> {
    if (typeof orchestrator === "string") {
      return this._innerContext.callSubOrchestrator(orchestrator, input, instanceId);
    }
    return this._innerContext.callSubOrchestrator(getFunctionName(orchestrator), input, instanceId);
  }

  /**
   * Deprecated: Use {@link callChildWorkflow} instead.
   *
   * Schedules a sub-orchestrator function for execution (legacy name for callChildWorkflow).
   *
   * @param orchestrator A reference to the orchestrator function call
   * @param input The JSON-serializable input value for the orchestrator function.
   * @param instanceId A unique ID to use for the sub-orchestration instance. If not provided, a new GUID will be used.
   *
   * @returns {Task<TOutput>} A Durable Task that completes when the sub-orchestrator function completes.
   *
   * @deprecated Use callChildWorkflow instead
   */
  public callSubWorkflow<TInput, TOutput>(
    orchestrator: TWorkflow | string,
    input?: TInput,
    instanceId?: string,
  ): Task<TOutput> {
    if (typeof orchestrator === "string") {
      return this._innerContext.callSubOrchestrator(orchestrator, input, instanceId);
    }
    return this._innerContext.callSubOrchestrator(getFunctionName(orchestrator), input, instanceId);
  }

  /**
   * Waits for an external event to be delivered to the workflow instance.
   *
   * Suspends workflow execution until an event with the specified name is raised
   * (via `client.raiseEvent()`). Events are durable—if an event is raised while the
   * workflow is not waiting for it, the event is queued until the workflow explicitly
   * waits for it. Event names are case-insensitive.
   *
   * Useful for human-in-the-loop workflows, approval processes, or any external signaling.
   * Multiple waiters for the same event receive the same payload.
   *
   * @param name - The name of the event to wait for (case-insensitive)
   * @returns A Task that completes with the event payload when the event is received
   *
   * @example
   * ```typescript
   * async function* approvalWorkflow(ctx: WorkflowContext, request: ApprovalRequest) {
   *   ctx.setCustomStatus("Awaiting approval");
   *
   *   // Wait for external approval event (raised via client.raiseEvent())
   *   const decision = yield ctx.waitForExternalEvent("approval");
   *
   *   if (decision.approved) {
   *     yield ctx.callActivity(processApproval, request);
   *   } else {
   *     yield ctx.callActivity(rejectRequest, request);
   *   }
   *
   *   return { status: decision.approved ? "approved" : "rejected" };
   * }
   *
   * // Client code:
   * // await client.raiseEvent(instanceId, "approval", { approved: true });
   * ```
   *
   * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/howto-manage-workflows/#raise-event}
   */
  public waitForExternalEvent(name: string): Task<any> {
    return this._innerContext.waitForExternalEvent(name);
  }

  /**
   * Continues the workflow as a new instance with different input (the "eternal workflow" pattern).
   *
   * Truncates the workflow's execution history and restarts the orchestration function
   * with new input. Useful for long-lived workflows that need periodic history cleanup
   * or workflows that loop indefinitely with fresh state.
   *
   * When continueAsNew() is called, a new workflow instance ID is generated, and the
   * orchestrator function is invoked again with the new input. All previous history is
   * truncated (unless saveEvents=true). The original instance transitions to
   * CONTINUED_AS_NEW status.
   *
   * @param newInput - The new input value for the restarted workflow
   * @param saveEvents - If true, unprocessed external events are forwarded to the new instance (default: false)
   *
   * @example
   * ```typescript
   * async function* eternityWorkflow(ctx: WorkflowContext, config: WorkflowConfig) {
   *   let iteration = 0;
   *
   *   while (true) {
   *     iteration++;
   *     ctx.setCustomStatus(`Iteration ${iteration}`);
   *
   *     // Process work
   *     yield ctx.callActivity(processWork, config);
   *
   *     // After many iterations, restart to truncate history
   *     if (iteration >= 1000) {
   *       // Start a new instance with the same config, preserving pending events
   *       ctx.continueAsNew(config, true);
   *     }
   *   }
   * }
   * ```
   *
   * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/#eternal-workflows}
   */
  public continueAsNew(newInput: any, saveEvents: boolean): void {
    this._innerContext.continueAsNew(newInput, saveEvents);
  }

  /**
   * Sets a custom status string for monitoring and observability.
   *
   * Updates the workflow instance's custom status field, which is queryable via
   * `client.getWorkflowState()` or `client.waitForWorkflowCompletion()`. Useful for
   * reporting progress, current step, or internal workflow state without modifying
   * the workflow's output or failure information.
   *
   * The status must be JSON-serializable.
   *
   * @param status - A JSON-serializable status value (typically a string or object)
   *
   * @example
   * ```typescript
   * async function* longRunningWorkflow(ctx: WorkflowContext, data: Data) {
   *   ctx.setCustomStatus("Starting");
   *
   *   ctx.setCustomStatus("Processing step 1");
   *   yield ctx.callActivity(processStep1, data);
   *
   *   ctx.setCustomStatus("Processing step 2");
   *   yield ctx.callActivity(processStep2, data);
   *
   *   ctx.setCustomStatus("Finalizing");
   *   const result = yield ctx.callActivity(finalize, data);
   *
   *   return result;
   * }
   *
   * // Client code:
   * // const state = await client.getWorkflowState(instanceId, true);
   * // console.log(state.customStatus); // => "Processing step 2"
   * ```
   */
  public setCustomStatus(status: string): void {
    this._innerContext.setCustomStatus(status);
  }

  /**
   * Waits for all provided tasks to complete.
   *
   * Schedules tasks in parallel (fan-out) and suspends until all tasks complete or
   * one fails. If any task fails, the entire operation fails immediately with that
   * exception; remaining tasks are canceled. If all tasks succeed, returns an array
   * of results in the same order as the input tasks.
   *
   * Enables efficient parallel processing of multiple activities or sub-workflows
   * within a single orchestration execution.
   *
   * @param tasks - Array of Tasks to wait for
   * @returns A WhenAllTask that completes when all tasks complete successfully
   *
   * @example
   * ```typescript
   * async function* parallelWorkflow(ctx: WorkflowContext, order: Order) {
   *   // Fan-out: schedule multiple activities in parallel
   *   const chargeTask = ctx.callActivity(chargePayment, order.total);
   *   const reserveTask = ctx.callActivity(reserveInventory, order.items);
   *   const notifyTask = ctx.callActivity(notifyWarehouse, order.id);
   *
   *   // Fan-in: wait for all to complete
   *   const [charge, reserve, notification] = yield ctx.whenAll([
   *     chargeTask,
   *     reserveTask,
   *     notifyTask
   *   ]);
   *
   *   if (!charge.success || !reserve.success) {
   *     // One failed—the whole operation failed
   *     throw new Error("Order processing failed");
   *   }
   *
   *   return { orderId: order.id, charged: charge.amount };
   * }
   * ```
   *
   * @see {@link whenAny}
   */
  public whenAll<T>(tasks: Task<T>[]): WhenAllTask<T> {
    return whenAll(tasks);
  }

  /**
   * Waits for any of the provided tasks to complete.
   *
   * Schedules tasks in parallel and suspends until the first task completes (successfully
   * or with failure). Returns the index of the completing task or throws its exception.
   * Remaining tasks continue in the background but the orchestrator does not wait for them.
   *
   * Useful for race conditions, timeouts (using timers), or implementing "first-to-succeed"
   * semantics like trying multiple payment methods and proceeding with the first to succeed.
   *
   * @param tasks - Array of Tasks to wait for (typically includes at least one timer for timeouts)
   * @returns A WhenAnyTask that completes when any task completes or fails
   *
   * @example
   * ```typescript
   * async function* timeoutWorkflow(ctx: WorkflowContext, request: Request) {
   *   const now = ctx.getCurrentUtcDateTime();
   *   const deadline = new Date(now.getTime() + 60000); // 1 minute timeout
   *
   *   const approvalTask = ctx.waitForExternalEvent("approval");
   *   const timeoutTask = ctx.createTimer(deadline);
   *
   *   // Wait for either approval or timeout
   *   const result = yield ctx.whenAny([approvalTask, timeoutTask]);
   *
   *   if (result === approvalTask) {
   *     yield ctx.callActivity(processApproval, request);
   *   } else {
   *     // Timeout fired
   *     yield ctx.callActivity(handleTimeout, request);
   *   }
   * }
   * ```
   *
   * @see {@link whenAll}
   * @see {@link createTimer}
   */
  public whenAny(tasks: Task<any>[]): WhenAnyTask {
    return whenAny(tasks);
  }
}

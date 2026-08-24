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

import WorkflowContext from "../../workflow/runtime/WorkflowContext";
import { Task } from "../../workflow/internal/durabletask/task/task";
import { TOutput } from "./InputOutput.type";

/**
 * Workflow (orchestrator) function signature for implementing durable orchestrations.
 *
 * Workflows are deterministic orchestration functions that coordinate activities, child workflows,
 * timers, and external events. They execute with replay semantics for durability and fault tolerance.
 *
 * Workflows can be implemented as generator functions (recommended) or synchronous functions:
 *
 * **Generator Pattern (Recommended):**
 * Use `yield` to suspend execution at durable checkpoints. Allows pausing orchestration
 * at activity/timer/event calls, enabling replay-safe execution with durable state.
 *
 * **Synchronous Pattern:**
 * For simple synchronous workflows that don't use async orchestration primitives.
 * Useful for immediate returns without durable tasks.
 *
 * @param context - The {@link WorkflowContext} providing orchestration primitives
 * @param input - The input parameter passed to the workflow (JSON-deserialized)
 *
 * @returns Either:
 * - A Generator yielding Tasks for durable orchestration primitives
 * - A direct value for immediate synchronous workflows
 * - A Promise for async workflows (converted to Tasks internally)
 *
 * @example
 * ```typescript
 * // Generator-based orchestrator with activities and child workflow
 * const orderWorkflow: TWorkflow = function* (ctx: WorkflowContext, input: OrderInput) {
 *   const workflowId = ctx.getWorkflowInstanceId();
 *   ctx.setCustomStatus("Processing order");
 *
 *   // Call activity and wait for result
 *   const paymentResult: PaymentResult = yield ctx.callActivity(
 *     processPayment,
 *     { orderId: input.orderId, amount: input.total }
 *   );
 *
 *   if (!paymentResult.success) {
 *     return { success: false, error: "Payment failed" };
 *   }
 *
 *   // Parallel activity execution with fan-out/fan-in
 *   const tasks = [
 *     ctx.callActivity(sendConfirmationEmail, input.email),
 *     ctx.callActivity(updateInventory, input.items),
 *     ctx.callActivity(logTransaction, paymentResult)
 *   ];
 *   yield ctx.whenAll(tasks);
 *
 *   // Child workflow for order fulfillment
 *   const fulfillmentResult = yield ctx.callChildWorkflow(
 *     fulfillmentWorkflow,
 *     { orderId: input.orderId }
 *   );
 *
 *   return {
 *     success: true,
 *     orderId: input.orderId,
 *     transactionId: paymentResult.transactionId,
 *     fulfillmentStatus: fulfillmentResult.status
 *   };
 * };
 *
 * // Synchronous workflow for simple logic
 * const approvalWorkflow: TWorkflow = (ctx, input) => {
 *   return { approved: input.amount < 100 };
 * };
 * ```
 *
 * **Replay Semantics:**
 * Workflows are replayed from history when they resume after suspending at durable checkpoints.
 * Use {@link WorkflowContext.isReplaying} to conditionally execute non-deterministic logic
 * like logging or randomization.
 *
 * @see {@link WorkflowContext} for orchestration methods
 * @see {@link TWorkflowActivity} for activity functions
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/} Workflow patterns
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/} Dapr Workflow documentation
 */
export type TWorkflow = (context: WorkflowContext, input: any) => Generator<Task<any>, any, any> | TOutput;

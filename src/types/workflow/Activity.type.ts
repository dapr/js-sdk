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

import WorkflowActivityContext from "../../workflow/runtime/WorkflowActivityContext";

/**
 * Activity function signature for implementing workflow activities.
 *
 * Activities are units of work scheduled by workflows. Unlike orchestrator functions,
 * activities execute synchronously without replay semantics and can perform I/O operations,
 * interact with external systems, and use non-deterministic logic.
 *
 * @typeParam TInput - The input parameter type for the activity
 * @typeParam TOutput - The return value type for the activity
 *
 * @param context - The {@link WorkflowActivityContext} providing access to workflow instance metadata
 * @param input - The input value passed from the workflow orchestrator
 *
 * @returns The activity result value (must be JSON-serializable)
 *
 * @example
 * ```typescript
 * // Simple activity that processes a payment
 * const processPayment: TWorkflowActivity<PaymentInput, PaymentResult> = (ctx, input) => {
 *   const workflowId = ctx.getWorkflowInstanceId();
 *   const activityId = ctx.getWorkflowActivityId();
 *
 *   console.log(`Processing payment ${input.orderId} (workflow: ${workflowId})`);
 *   // Call external service, database, etc.
 *   return { success: true, transactionId: "tx-123" };
 * };
 * ```
 *
 * @see {@link TWorkflow} for workflow orchestrator signature
 * @see {@link https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/#activities}
 */
export type TWorkflowActivity<TInput, TOutput> = (context: WorkflowActivityContext, input: TInput) => TOutput;

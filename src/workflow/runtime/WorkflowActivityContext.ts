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

import { ActivityContext } from "../internal/durabletask";

/**
 * Execution context for workflow activities.
 *
 * Provides metadata about the activity's execution context within a workflow, including
 * the associated workflow instance and activity execution identifier. Unlike orchestrators,
 * activities execute exactly once per invocation (no replay) and may safely perform I/O
 * operations (network calls, database queries, side effects).
 *
 * Activities should be deterministic within a single execution but need not be deterministic
 * across retries—the workflow context handles idempotency and retry logic.
 *
 * @example
 * ```typescript
 * // Activity function receiving WorkflowActivityContext
 * async function sendNotification(ctx: WorkflowActivityContext, email: string) {
 *   const workflowId = ctx.getWorkflowInstanceId();
 *   const activityId = ctx.getWorkflowActivityId();
 *
 *   console.log(`Activity ${activityId} running for workflow ${workflowId}`);
 *
 *   // Safe to perform I/O here (network, database, etc.)
 *   await sendEmail(email, `Notification for workflow ${workflowId}`);
 * }
 * ```
 */
export default class WorkflowActivityContext {
  private readonly _innerContext: ActivityContext;
  constructor(innerContext: ActivityContext) {
    if (!innerContext) {
      throw new Error("ActivityContext cannot be undefined");
    }
    this._innerContext = innerContext;
  }

  /**
   * Gets the unique identifier of the workflow instance that invoked this activity.
   *
   * Useful for correlating activity execution with workflow state, logging, or auditing.
   * Multiple activities within the same workflow invocation will return the same instance ID.
   *
   * @returns The unique identifier (orchestrationId) of the parent workflow instance
   *
   * @example
   * ```typescript
   * async function logActivity(ctx: WorkflowActivityContext, action: string) {
   *   const workflowId = ctx.getWorkflowInstanceId();
   *   console.log(`Workflow ${workflowId}: ${action}`);
   * }
   * ```
   */
  public getWorkflowInstanceId(): string {
    return this._innerContext.orchestrationId;
  }

  /**
   * Gets the unique identifier for this specific activity execution within the workflow.
   *
   * Each activity invocation within a workflow gets a unique task ID. If an activity is
   * retried due to failure, each attempt receives a different task ID. Useful for distinguishing
   * between multiple activity invocations within the same workflow.
   *
   * @returns The task ID (activityId) uniquely identifying this activity execution
   *
   * @example
   * ```typescript
   * async function processOrder(ctx: WorkflowActivityContext, orderId: string) {
   *   const taskId = ctx.getWorkflowActivityId();
   *   console.log(`Processing order ${orderId} as activity task ${taskId}`);
   * }
   * ```
   */
  public getWorkflowActivityId(): number {
    return this._innerContext.taskId;
  }
}

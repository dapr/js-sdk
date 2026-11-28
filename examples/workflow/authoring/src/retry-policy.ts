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

import {
  DaprWorkflowClient,
  RetryPolicy,
  TWorkflow,
  WorkflowActivityContext,
  WorkflowContext,
  WorkflowRuntime,
} from "@dapr/dapr";

// Retry policy example: configure automatic retries for transient failures in
// workflow activities and child workflows using Dapr's RetryPolicy options.

const attemptCounts = new Map<string, number>();

const flakyPaymentActivity = async (_: WorkflowActivityContext, orderId: string): Promise<string> => {
  const attempt = (attemptCounts.get(orderId) ?? 0) + 1;
  attemptCounts.set(orderId, attempt);
  console.log(`Processing payment for ${orderId} (attempt ${attempt})...`);

  // Fail on the first two attempts to demonstrate automatic retry recovery.
  if (attempt < 3) {
    throw new Error(`Transient payment gateway timeout on attempt ${attempt}`);
  }

  return `Payment confirmed for ${orderId} on attempt ${attempt}`;
};

const verifyChildTask = async (_: WorkflowActivityContext, input: string): Promise<string> => {
  const key = `child:${input}`;
  const attempt = (attemptCounts.get(key) ?? 0) + 1;
  attemptCounts.set(key, attempt);
  console.log(`Running child verification for ${input} (attempt ${attempt})...`);

  if (attempt < 2) {
    throw new Error("Temporary verification service error");
  }

  return `Verified ${input} on attempt ${attempt}`;
};

const childVerificationWorkflow: TWorkflow = async function* (ctx: WorkflowContext, orderId: string): any {
  const verified = yield ctx.callActivity(verifyChildTask, orderId);
  return verified;
};

// RetryPolicy parameters (durations are in seconds):
// - firstRetryInterval: delay before the first retry attempt (required).
// - maxNumberOfAttempts: total attempts including the initial invocation (required).
// - backoffCoefficient: exponential multiplier applied after each failed retry (optional, >= 1).
// - maxRetryInterval: upper bound on delay between consecutive retries (optional).
// - retryTimeout: overall timeout budget across all retry attempts (optional).
const activityRetryPolicy: RetryPolicy = {
  firstRetryInterval: 1,
  maxNumberOfAttempts: 4,
  backoffCoefficient: 2,
  maxRetryInterval: 5,
  retryTimeout: 30,
};

const childWorkflowRetryPolicy: RetryPolicy = {
  firstRetryInterval: 1,
  maxNumberOfAttempts: 3,
  backoffCoefficient: 1.5,
  maxRetryInterval: 4,
  retryTimeout: 20,
};

const orderRetryWorkflow: TWorkflow = async function* (ctx: WorkflowContext, orderId: string): any {
  // Retry transient activity errors automatically according to activityRetryPolicy.
  const paymentResult = yield ctx.callActivity(flakyPaymentActivity, orderId, {
    retryPolicy: activityRetryPolicy,
  });

  // Child workflows also accept a RetryPolicy via ChildWorkflowOptions (4th argument).
  const verificationResult = yield ctx.callChildWorkflow(childVerificationWorkflow, orderId, undefined, {
    retryPolicy: childWorkflowRetryPolicy,
  });

  return `${paymentResult}; ${verificationResult}`;
};

async function start() {
  const daprHost = "localhost";
  const daprPort = "50001";
  const workflowClient = new DaprWorkflowClient({
    daprHost,
    daprPort,
  });
  const workflowRuntime = new WorkflowRuntime({
    daprHost,
    daprPort,
  });

  workflowRuntime
    .registerWorkflow(orderRetryWorkflow)
    .registerWorkflow(childVerificationWorkflow)
    .registerActivity(flakyPaymentActivity)
    .registerActivity(verifyChildTask);

  try {
    await workflowRuntime.start();
    console.log("Workflow runtime started successfully");
  } catch (error) {
    console.error("Error starting workflow runtime:", error);
  }

  try {
    const id = await workflowClient.scheduleNewWorkflow(orderRetryWorkflow, "order-1001");
    console.log(`Orchestration scheduled with ID: ${id}`);

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    console.log(`Orchestration completed! Result: ${state?.serializedOutput}`);
  } catch (error) {
    console.error("Error scheduling or waiting for orchestration:", error);
  }

  await workflowRuntime.stop();
  await workflowClient.stop();

  process.exit(0);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

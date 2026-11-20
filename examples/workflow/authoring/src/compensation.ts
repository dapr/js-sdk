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

// Compensation (saga) pattern: each step that succeeds registers an "undo" step.
// If a later step fails, the registered undo steps run in reverse order, so the
// trip is never left half booked.

const bookFlight = async (_: WorkflowActivityContext) => {
  console.log("Booking flight...");
  return "Flight booked: FL-1234";
};

const bookHotel = async (_: WorkflowActivityContext) => {
  console.log("Booking hotel...");
  return "Hotel booked: HT-5678";
};

const bookCar = async (_: WorkflowActivityContext): Promise<string> => {
  console.log("Booking car...");
  // Simulate a failure so the workflow has to compensate the earlier bookings.
  throw new Error("Car rental service is unavailable");
};

const cancelFlight = async (_: WorkflowActivityContext) => {
  console.log("Cancelling flight...");
  return "Flight cancelled: FL-1234";
};

const cancelHotel = async (_: WorkflowActivityContext) => {
  console.log("Cancelling hotel...");
  return "Hotel cancelled: HT-5678";
};

const cancelCar = async (_: WorkflowActivityContext) => {
  console.log("Cancelling car...");
  return "Car cancelled";
};

// Compensations should succeed eventually, so retry them a few times.
const compensationRetryPolicy: RetryPolicy = {
  firstRetryInterval: 1, // seconds
  maxNumberOfAttempts: 3,
};

type Compensation = (ctx: WorkflowActivityContext) => Promise<string>;

const bookTrip: TWorkflow = async function* (ctx: WorkflowContext): any {
  const compensations: Compensation[] = [];

  try {
    const flight = yield ctx.callActivity(bookFlight);
    compensations.push(cancelFlight);

    const hotel = yield ctx.callActivity(bookHotel);
    compensations.push(cancelHotel);

    const car = yield ctx.callActivity(bookCar);
    compensations.push(cancelCar);

    return `Trip booked: ${flight}, ${hotel}, ${car}`;
  } catch (error: any) {
    // A failed activity is raised at its `yield`, so it can be caught like any other error.
    ctx.logger.error(`Booking failed: ${error?.message}. Running compensations...`);

    // Undo the completed steps in reverse order.
    for (const compensation of compensations.reverse()) {
      try {
        const result = yield ctx.callActivity(compensation, undefined, { retryPolicy: compensationRetryPolicy });
        ctx.logger.info(result);
      } catch (compensationError: any) {
        // Keep compensating the remaining steps even if one of them fails.
        ctx.logger.error(`Compensation failed: ${compensationError?.message}`);
      }
    }

    return "Trip booking failed, compensation applied";
  }
};

async function start() {
  // Update the gRPC client and worker to use a local address and port
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
    .registerWorkflow(bookTrip)
    .registerActivity(bookFlight)
    .registerActivity(bookHotel)
    .registerActivity(bookCar)
    .registerActivity(cancelFlight)
    .registerActivity(cancelHotel)
    .registerActivity(cancelCar);

  // Wrap the worker startup in a try-catch block to handle any errors during startup
  try {
    await workflowRuntime.start();
    console.log("Workflow runtime started successfully");
  } catch (error) {
    console.error("Error starting workflow runtime:", error);
  }

  // Schedule a new orchestration
  try {
    const id = await workflowClient.scheduleNewWorkflow(bookTrip);
    console.log(`Orchestration scheduled with ID: ${id}`);

    // Wait for orchestration completion
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    console.log(`Orchestration completed! Result: ${state?.serializedOutput}`);
  } catch (error) {
    console.error("Error scheduling or waiting for orchestration:", error);
  }

  await workflowRuntime.stop();
  await workflowClient.stop();

  // stop the dapr side car
  process.exit(0);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

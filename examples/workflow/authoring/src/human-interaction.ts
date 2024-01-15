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

import {
  Task,
  DaprWorkflowClient,
  WorkflowActivityContext,
  WorkflowContext,
  WorkflowRuntime,
  TWorkflow,
} from "@dapr/dapr";
import * as readlineSync from "readline-sync";

// Wrap the entire code in an immediately-invoked async function
async function start() {
  class Order {
    cost: number;
    product: string;
    quantity: number;
    constructor(cost: number, product: string, quantity: number) {
      this.cost = cost;
      this.product = product;
      this.quantity = quantity;
    }
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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

  // Activity function that sends an approval request to the manager
  const sendApprovalRequest = async (_: WorkflowActivityContext, order: Order) => {
    // Simulate some work that takes an amount of time
    await sleep(3000);
    console.log(`Sending approval request for order: ${order.product}`);
  };

  // Activity function that places an order
  const placeOrder = async (_: WorkflowActivityContext, order: Order) => {
    console.log(`Placing order: ${order.product}`);
  };

  // Orchestrator function that represents a purchase order workflow
  const purchaseOrderWorkflow: TWorkflow = async function* (ctx: WorkflowContext, order: Order): any {
    // Orders under $1000 are auto-approved
    if (order.cost < 1000) {
      return "Auto-approved";
    }

    // Orders of $1000 or more require manager approval
    yield ctx.callActivity(sendApprovalRequest, order);

    // Approvals must be received within 24 hours or they will be cancled.
    const tasks: Task<any>[] = [];
    const approvalEvent = ctx.waitForExternalEvent("approval_received");
    const timeoutEvent = ctx.createTimer(24 * 60 * 60);
    tasks.push(approvalEvent);
    tasks.push(timeoutEvent);
    const winner = ctx.whenAny(tasks);

    if (winner == timeoutEvent) {
      return "Cancelled";
    }

    yield ctx.callActivity(placeOrder, order);
    const approvalDetails = approvalEvent.getResult();
    return `Approved by ${approvalDetails.approver}`;
  };

  workflowRuntime
    .registerWorkflow(purchaseOrderWorkflow)
    .registerActivity(sendApprovalRequest)
    .registerActivity(placeOrder);

  // Wrap the worker startup in a try-catch block to handle any errors during startup
  try {
    await workflowRuntime.start();
    console.log("Worker started successfully");
  } catch (error) {
    console.error("Error starting worker:", error);
  }

  // Schedule a new orchestration
  try {
    const cost = readlineSync.questionInt("Cost of your order:");
    const approver = readlineSync.question("Approver of your order:");
    const timeout = readlineSync.questionInt("Timeout for your order in seconds:");
    const order = new Order(cost, "MyProduct", 1);
    const id = await workflowClient.scheduleNewWorkflow(purchaseOrderWorkflow, order);
    console.log(`Orchestration scheduled with ID: ${id}`);

    // prompt for approval asynchronously
    promptForApproval(approver, workflowClient, id);

    // Wait for orchestration completion
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, timeout + 2);

    console.log(`Orchestration completed! Result: ${state?.serializedOutput}`);
  } catch (error) {
    console.error("Error scheduling or waiting for orchestration:", error);
  }

  // stop worker and client
  await workflowRuntime.stop();
  await workflowClient.stop();

  // stop the dapr side car
  process.exit(0);
}

async function promptForApproval(approver: string, workflowClient: DaprWorkflowClient, id: string) {
  if (readlineSync.keyInYN("Press [Y] to approve the order... Y/yes, N/no")) {
    const approvalEvent = { approver: approver };
    await workflowClient.raiseEvent(id, "approval_received", approvalEvent);
  } else {
    return "Order rejected";
  }
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

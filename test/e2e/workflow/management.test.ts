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

import { WorkflowHarness } from "@dapr/testcontainer-node";
import { randomUUID } from "node:crypto";
import {
  CommunicationProtocolEnum,
  DaprClient,
  WorkflowRuntime,
  WorkflowContext,
  WorkflowActivityContext,
  type TWorkflow,
} from "../../../src";
import { WorkflowGetResponseType } from "../../../src/types/workflow/WorkflowGetResponse.type";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

type Order = { item: string; quantity: number };
type Approval = { approved: boolean; approver: string };

const workflowName = "orderApprovalWorkflow";
const approvalEvent = "approval";

// Exercises the HTTP workflow management API (client.workflow) against a real sidecar.
// The sidecar reports runtime statuses as upper-case strings, e.g. "RUNNING".
describe("workflow management (HTTP)", () => {
  let workflowHarness: WorkflowHarness;
  let client: DaprClient;
  let workflowRuntime: WorkflowRuntime;

  const summarize = async (_ctx: WorkflowActivityContext, input: { order: Order; approval: Approval }) => ({
    item: input.order.item,
    quantity: input.order.quantity,
    approvedBy: input.approval.approver,
  });

  const orderApprovalWorkflow: TWorkflow = async function* (ctx: WorkflowContext, order: Order): any {
    const approval: Approval = yield ctx.waitForExternalEvent(approvalEvent);
    return yield ctx.callActivity(summarize, { order, approval });
  };

  beforeAll(async () => {
    workflowHarness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE });
    workflowHarness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
    await workflowHarness.start();

    client = new DaprClient({
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getHttpPort().toString(),
    });
  }, 180 * 1000);

  beforeEach(async () => {
    // The management API only schedules work; a local worker has to execute it.
    workflowRuntime = new WorkflowRuntime({
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getGrpcPort().toString(),
    });
    workflowRuntime.registerWorkflowByName(workflowName, orderApprovalWorkflow).registerActivity(summarize);
    await workflowRuntime.start();
  });

  afterEach(async () => {
    await workflowRuntime.stop();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await client?.stop();
      await workflowHarness?.stop();
    });
  }, 60_000);

  const waitForStatus = async (instanceId: string, expected: string): Promise<WorkflowGetResponseType> => {
    const deadline = Date.now() + 20_000;
    let last: string | undefined;
    while (Date.now() < deadline) {
      const state = await client.workflow.getWorkflowState(instanceId);
      last = state.runtimeStatus;
      if (last === expected) {
        return state;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Workflow ${instanceId} did not reach ${expected} before timeout (last status: ${last})`);
  };

  const order: Order = { item: "Paperclips", quantity: 4 };
  const approval: Approval = { approved: true, approver: "admin" };
  const expectedOutput = { item: "Paperclips", quantity: 4, approvedBy: "admin" };

  it("should schedule a workflow with an explicit instance ID and get its state", async () => {
    const instanceId = `order-${randomUUID()}`;
    const returnedId = await client.workflow.scheduleNewWorkflow(workflowName, order, instanceId);
    expect(returnedId).toEqual(instanceId);

    const state = await waitForStatus(instanceId, "RUNNING");
    expect(state.instanceID).toEqual(instanceId);
    expect(state.workflowName).toEqual(workflowName);
    expect(state.createdAt).toBeInstanceOf(Date);
    expect(state.lastUpdatedAt).toBeInstanceOf(Date);
    expect(state.lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(state.createdAt.getTime());
    expect(JSON.parse(state.properties["dapr.workflow.input"])).toEqual(order);

    await client.workflow.terminate(instanceId);
    await waitForStatus(instanceId, "TERMINATED");
  }, 60_000);

  it("should generate an instance ID when none is provided", async () => {
    const instanceId = await client.workflow.scheduleNewWorkflow(workflowName, order);
    expect(instanceId).toBeTruthy();

    const state = await waitForStatus(instanceId, "RUNNING");
    expect(state.instanceID).toEqual(instanceId);

    await client.workflow.terminate(instanceId);
    await waitForStatus(instanceId, "TERMINATED");
  }, 60_000);

  it("should complete a workflow when an event is raised", async () => {
    const instanceId = await client.workflow.scheduleNewWorkflow(workflowName, order);
    await waitForStatus(instanceId, "RUNNING");

    await client.workflow.raiseEvent(instanceId, approvalEvent, approval);

    const state = await waitForStatus(instanceId, "COMPLETED");
    expect(JSON.parse(state.properties["dapr.workflow.output"])).toEqual(expectedOutput);
  }, 60_000);

  it("should pause and resume a workflow", async () => {
    const instanceId = await client.workflow.scheduleNewWorkflow(workflowName, order);
    await waitForStatus(instanceId, "RUNNING");

    await client.workflow.pause(instanceId);
    await waitForStatus(instanceId, "SUSPENDED");

    await client.workflow.resume(instanceId);
    await waitForStatus(instanceId, "RUNNING");

    // A resumed workflow keeps processing events through to completion.
    await client.workflow.raiseEvent(instanceId, approvalEvent, approval);
    const state = await waitForStatus(instanceId, "COMPLETED");
    expect(JSON.parse(state.properties["dapr.workflow.output"])).toEqual(expectedOutput);
  }, 60_000);

  it("should terminate a running workflow", async () => {
    const instanceId = await client.workflow.scheduleNewWorkflow(workflowName, order);
    await waitForStatus(instanceId, "RUNNING");

    await client.workflow.terminate(instanceId);
    const state = await waitForStatus(instanceId, "TERMINATED");
    expect(state.instanceID).toEqual(instanceId);
    expect(state.workflowName).toEqual(workflowName);
  }, 60_000);

  it("should purge a completed workflow", async () => {
    const instanceId = await client.workflow.scheduleNewWorkflow(workflowName, order);
    await waitForStatus(instanceId, "RUNNING");
    await client.workflow.raiseEvent(instanceId, approvalEvent, approval);
    await waitForStatus(instanceId, "COMPLETED");

    await client.workflow.purge(instanceId);
    await expect(client.workflow.getWorkflowState(instanceId)).rejects.toThrow();
  }, 60_000);

  it("should purge a terminated workflow", async () => {
    const instanceId = await client.workflow.scheduleNewWorkflow(workflowName, order);
    await waitForStatus(instanceId, "RUNNING");
    await client.workflow.terminate(instanceId);
    await waitForStatus(instanceId, "TERMINATED");

    await client.workflow.purge(instanceId);
    await expect(client.workflow.getWorkflowState(instanceId)).rejects.toThrow();
  }, 60_000);

  it("should reject getting the state of an unknown workflow instance", async () => {
    await expect(client.workflow.getWorkflowState(`missing-${randomUUID()}`)).rejects.toThrow();
  }, 60_000);

  it("should support the deprecated start, get and raise aliases", async () => {
    const instanceId = `order-${randomUUID()}`;
    expect(await client.workflow.start(workflowName, order, instanceId)).toEqual(instanceId);
    await waitForStatus(instanceId, "RUNNING");

    const running = await client.workflow.get(instanceId);
    expect(running.instanceID).toEqual(instanceId);
    expect(running.workflowName).toEqual(workflowName);

    await client.workflow.raise(instanceId, approvalEvent, approval);
    await waitForStatus(instanceId, "COMPLETED");

    const completed = await client.workflow.get(instanceId);
    expect(JSON.parse(completed.properties["dapr.workflow.output"])).toEqual(expectedOutput);
  }, 60_000);
});

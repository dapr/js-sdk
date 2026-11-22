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

import { createRouterTransport } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { TaskHubSidecarService } from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import { DaprWorkflowClient } from "../../../src";

jest.mock("@connectrpc/connect-node", () => ({ createGrpcTransport: jest.fn() }));

// A fake sidecar that answers every operation that can be staged. `staged` undefined
// leaves the field unset, as a sidecar without staged operations does.
// Returns the names of the workflows the sidecar was asked to start.
function useSidecar(staged: boolean | undefined): string[] {
  const started: string[] = [];
  const flag = staged === undefined ? {} : { staged };
  const transport = createRouterTransport((router) => {
    router.service(TaskHubSidecarService, {
      startInstance: (req) => {
        started.push(req.name);
        return { instanceId: req.instanceId, ...flag };
      },
      raiseEvent: () => ({ ...flag }),
      terminateInstance: () => ({ ...flag }),
      suspendInstance: () => ({ ...flag }),
      resumeInstance: () => ({ ...flag }),
      rerunWorkflowFromEvent: (req) => ({ newInstanceID: req.newInstanceID, ...flag }),
    });
  });
  jest.mocked(createGrpcTransport).mockReturnValue(transport);
  return started;
}

describe("workflow client staged operations", () => {
  describe.each([
    { name: "staged", staged: true, expected: true },
    { name: "not staged", staged: false, expected: false },
    { name: "older sidecar", staged: undefined, expected: false },
  ])("$name", ({ staged, expected }) => {
    let client: DaprWorkflowClient;

    beforeEach(() => {
      useSidecar(staged);
      client = new DaprWorkflowClient();
    });

    it("reports staged on start", async () => {
      await expect(client.scheduleNewWorkflowWithResult("workflow", { a: 1 }, "instance-1")).resolves.toEqual({
        instanceId: "instance-1",
        staged: expected,
      });
    });

    it("reports staged on raise event", async () => {
      await expect(client.raiseEventWithResult("instance-1", "event", { a: 1 })).resolves.toEqual({
        staged: expected,
      });
    });

    it("reports staged on terminate", async () => {
      await expect(client.terminateWorkflowWithResult("instance-1", "output")).resolves.toEqual({ staged: expected });
    });

    it("reports staged on suspend", async () => {
      await expect(client.suspendWorkflowWithResult("instance-1", "reason")).resolves.toEqual({ staged: expected });
    });

    it("reports staged on resume", async () => {
      await expect(client.resumeWorkflowWithResult("instance-1", "reason")).resolves.toEqual({ staged: expected });
    });

    it("reports staged on rerun", async () => {
      await expect(
        client.rerunWorkflowFromEventWithResult("instance-1", 3, { newInstanceId: "instance-2" }),
      ).resolves.toEqual({ newInstanceId: "instance-2", staged: expected });
    });

    it("keeps the existing methods' return values", async () => {
      await expect(client.scheduleNewWorkflow("workflow", undefined, "instance-1")).resolves.toBe("instance-1");
      await expect(client.raiseEvent("instance-1", "event")).resolves.toBeUndefined();
      await expect(client.terminateWorkflow("instance-1")).resolves.toBeUndefined();
      await expect(client.suspendWorkflow("instance-1")).resolves.toBeUndefined();
      await expect(client.resumeWorkflow("instance-1")).resolves.toBeUndefined();
      await expect(client.rerunWorkflowFromEvent("instance-1", 3, { newInstanceId: "instance-2" })).resolves.toBe(
        "instance-2",
      );
    });
  });

  it("resolves a workflow function to its name on start", async () => {
    const started = useSidecar(true);
    const client = new DaprWorkflowClient();
    async function orderWorkflow(): Promise<void> {}

    await expect(client.scheduleNewWorkflowWithResult(orderWorkflow, undefined, "instance-1")).resolves.toEqual({
      instanceId: "instance-1",
      staged: true,
    });
    expect(started).toEqual(["orderWorkflow"]);
  });

  it("validates rerun arguments before sending a request", async () => {
    useSidecar(true);
    const client = new DaprWorkflowClient();

    await expect(client.rerunWorkflowFromEventWithResult("instance-1", -1)).rejects.toThrow(RangeError);
    await expect(client.rerunWorkflowFromEventWithResult("instance-1", 1, { newInstanceId: "" })).rejects.toThrow(
      TypeError,
    );
  });
});

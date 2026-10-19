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

import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { create } from "@bufbuild/protobuf";
import { TaskFailureDetailsSchema } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { OrchestrationState } from "../../../src/workflow/engine";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import { Code, ConnectError } from "@connectrpc/connect";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { type HistoryEvent, type TWorkflow, WorkflowRuntimeStatus } from "../../../src";

const mockScheduleNewOrchestration = jest.fn();
const mockGetOrchestrationState = jest.fn();
const mockListWorkflowInstanceIds = jest.fn();
const mockGetWorkflowHistory = jest.fn();
const mockRerunWorkflowFromEvent = jest.fn();
const mockWaitForOrchestrationStart = jest.fn();
const mockWaitForOrchestrationCompletion = jest.fn();
const mockTerminateOrchestration = jest.fn();
const mockRaiseOrchestrationEvent = jest.fn();
const mockPurgeOrchestration = jest.fn();
const mockSuspendOrchestration = jest.fn();
const mockResumeOrchestration = jest.fn();
const mockClientStop = jest.fn();

jest.mock("../../../src/workflow/engine/transport/TaskHubClient", () => {
  const actual = jest.requireActual("../../../src/workflow/engine/transport/TaskHubClient");
  return {
    ...actual,
    TaskHubClient: jest.fn().mockImplementation(() => ({
      scheduleNewOrchestration: mockScheduleNewOrchestration,
      getOrchestrationState: mockGetOrchestrationState,
      listWorkflowInstanceIds: mockListWorkflowInstanceIds,
      getWorkflowHistory: mockGetWorkflowHistory,
      rerunWorkflowFromEvent: mockRerunWorkflowFromEvent,
      waitForOrchestrationStart: mockWaitForOrchestrationStart,
      waitForOrchestrationCompletion: mockWaitForOrchestrationCompletion,
      terminateOrchestration: mockTerminateOrchestration,
      raiseOrchestrationEvent: mockRaiseOrchestrationEvent,
      purgeOrchestration: mockPurgeOrchestration,
      suspendOrchestration: mockSuspendOrchestration,
      resumeOrchestration: mockResumeOrchestration,
      stop: mockClientStop,
    })),
  };
});

import DaprWorkflowClient from "../../../src/workflow/client/DaprWorkflowClient";

describe("DaprWorkflowClient", () => {
  let client: DaprWorkflowClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new DaprWorkflowClient();
  });

  describe("scheduleNewWorkflow", () => {
    it("should schedule a workflow by function reference", async () => {
      mockScheduleNewOrchestration.mockResolvedValue("instance-123");

      const myWorkflow: TWorkflow = async (_ctx: WorkflowContext, _input: any) => "result";
      const id = await client.scheduleNewWorkflow(myWorkflow, "input-data", "my-id");

      expect(mockScheduleNewOrchestration).toHaveBeenCalledWith("myWorkflow", "input-data", "my-id", undefined);
      expect(id).toBe("instance-123");
    });

    it("should schedule a workflow by string name", async () => {
      mockScheduleNewOrchestration.mockResolvedValue("instance-456");

      const id = await client.scheduleNewWorkflow("remoteWorkflow", "input", "id-1", new Date("2025-01-01"));

      expect(mockScheduleNewOrchestration).toHaveBeenCalledWith(
        "remoteWorkflow",
        "input",
        "id-1",
        new Date("2025-01-01"),
      );
      expect(id).toBe("instance-456");
    });

    it("should schedule a workflow without optional parameters", async () => {
      mockScheduleNewOrchestration.mockResolvedValue("auto-id");

      const id = await client.scheduleNewWorkflow("myWorkflow");

      expect(mockScheduleNewOrchestration).toHaveBeenCalledWith("myWorkflow", undefined, undefined, undefined);
      expect(id).toBe("auto-id");
    });
  });

  describe("getWorkflowState", () => {
    it("should return WorkflowState when instance is found", async () => {
      const now = new Date();
      const orchState = new OrchestrationState(
        "instance-1",
        "myWorkflow",
        OrchestrationStatus.COMPLETED,
        now,
        now,
        '"input"',
        '"output"',
        '"custom"',
      );
      mockGetOrchestrationState.mockResolvedValue(orchState);

      const state = await client.getWorkflowState("instance-1", true);

      expect(mockGetOrchestrationState).toHaveBeenCalledWith("instance-1", true);
      expect(state).toBeDefined();
      expect(state?.instanceId).toBe("instance-1");
      expect(state?.name).toBe("myWorkflow");
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.serializedInput).toBe('"input"');
      expect(state?.serializedOutput).toBe('"output"');
      expect(state?.customStatus).toBe('"custom"');
    });

    it("should return undefined when instance is not found", async () => {
      mockGetOrchestrationState.mockResolvedValue(undefined);

      const state = await client.getWorkflowState("nonexistent", true);

      expect(state).toBeUndefined();
    });

    it("should return undefined for a not-found RPC error", async () => {
      mockGetOrchestrationState.mockRejectedValue(new ConnectError("instance not found", Code.NotFound));

      await expect(client.getWorkflowState("nonexistent", true)).resolves.toBeUndefined();
    });

    it("should return undefined for the legacy Dapr missing-instance error", async () => {
      mockGetOrchestrationState.mockRejectedValue(new ConnectError("no such instance exists", Code.Unknown));

      await expect(client.getWorkflowState("nonexistent", true)).resolves.toBeUndefined();
    });

    it("should propagate unrelated RPC errors", async () => {
      mockGetOrchestrationState.mockRejectedValue(new ConnectError("sidecar unavailable", Code.Unavailable));

      await expect(client.getWorkflowState("instance-1", true)).rejects.toThrow("sidecar unavailable");
    });

    it("should include failure details for failed workflows", async () => {
      const now = new Date();
      const failureDetails = create(TaskFailureDetailsSchema, {
        errorMessage: "Something went wrong",
        errorType: "Error",
        stackTrace: "stack trace here",
      });
      const orchState = new OrchestrationState(
        "instance-failed",
        "failingWorkflow",
        OrchestrationStatus.FAILED,
        now,
        now,
        undefined,
        undefined,
        undefined,
        failureDetails,
      );
      mockGetOrchestrationState.mockResolvedValue(orchState);

      const state = await client.getWorkflowState("instance-failed", true);

      expect(state).toBeDefined();
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.FAILED);
      expect(state?.workflowFailureDetails).toBeDefined();
      expect(state?.workflowFailureDetails?.getErrorMessage()).toBe("Something went wrong");
      expect(state?.workflowFailureDetails?.getErrorType()).toBe("Error");
      expect(state?.workflowFailureDetails?.getStackTrace()).toBe("stack trace here");
    });
  });

  describe("listWorkflowInstanceIds", () => {
    it("should return the requested page", async () => {
      const page = { instanceIds: ["instance-1"], continuationToken: "next-page" };
      mockListWorkflowInstanceIds.mockResolvedValue(page);

      await expect(client.listWorkflowInstanceIds("previous-page", 10)).resolves.toEqual(page);
      expect(mockListWorkflowInstanceIds).toHaveBeenCalledWith("previous-page", 10);
    });

    it("should allow listing without pagination options", async () => {
      mockListWorkflowInstanceIds.mockResolvedValue({ instanceIds: [] });

      await expect(client.listWorkflowInstanceIds()).resolves.toEqual({ instanceIds: [] });
      expect(mockListWorkflowInstanceIds).toHaveBeenCalledWith(undefined, undefined);
    });

    it.each([0, -1, 1.5, 0x1_0000_0000])("should reject invalid page size %s", async (pageSize) => {
      await expect(client.listWorkflowInstanceIds(undefined, pageSize)).rejects.toThrow(RangeError);
      expect(mockListWorkflowInstanceIds).not.toHaveBeenCalled();
    });
  });

  describe("getWorkflowHistory", () => {
    it("should return the workflow's execution history", async () => {
      const history: HistoryEvent[] = [
        create(HistoryEventSchema, { eventId: 1 }),
        create(HistoryEventSchema, { eventId: 2 }),
      ];
      mockGetWorkflowHistory.mockResolvedValue(history);

      await expect(client.getWorkflowHistory("instance-1")).resolves.toBe(history);
      expect(mockGetWorkflowHistory).toHaveBeenCalledWith("instance-1");
    });

    it.each([Code.NotFound, Code.Unknown, Code.Unavailable])("should propagate RPC error code %s", async (code) => {
      const error = new ConnectError("history retrieval failed", code);
      mockGetWorkflowHistory.mockRejectedValueOnce(error);

      await expect(client.getWorkflowHistory("missing-instance")).rejects.toBe(error);
    });
  });

  describe("rerunWorkflowFromEvent", () => {
    it("should return the new instance ID and forward options", async () => {
      mockRerunWorkflowFromEvent.mockResolvedValue("rerun-instance");
      const options = { newInstanceId: "rerun-instance", input: { retry: true }, overwriteInput: true };

      await expect(client.rerunWorkflowFromEvent("source-instance", 3, options)).resolves.toBe("rerun-instance");
      expect(mockRerunWorkflowFromEvent).toHaveBeenCalledWith("source-instance", 3, options);
    });

    it("should accept the first event ID", async () => {
      mockRerunWorkflowFromEvent.mockResolvedValue("new-instance");

      await expect(client.rerunWorkflowFromEvent("source-instance", 0)).resolves.toBe("new-instance");
    });

    it.each([-1, 1.5, 0x1_0000_0000, NaN, Infinity, -Infinity])(
      "should reject invalid event ID %s",
      async (eventId) => {
        await expect(client.rerunWorkflowFromEvent("source-instance", eventId)).rejects.toThrow(RangeError);
        expect(mockRerunWorkflowFromEvent).not.toHaveBeenCalled();
      },
    );

    it("should forward the maximum uint32 event ID for runtime validation", async () => {
      mockRerunWorkflowFromEvent.mockResolvedValueOnce("new-instance");

      await expect(client.rerunWorkflowFromEvent("source-instance", 0xffffffff)).resolves.toBe("new-instance");
      expect(mockRerunWorkflowFromEvent).toHaveBeenCalledWith("source-instance", 0xffffffff, {});
    });

    it.each([
      [Code.NotFound, "source instance not found"],
      [Code.InvalidArgument, "event does not exist"],
      [Code.Unknown, "no such instance exists"],
      [Code.Unavailable, "sidecar unavailable"],
    ])("should propagate rerun RPC error %s: %s", async (code, message) => {
      const error = new ConnectError(message, code);
      mockRerunWorkflowFromEvent.mockRejectedValueOnce(error);

      await expect(client.rerunWorkflowFromEvent("source-instance", 42)).rejects.toBe(error);
    });

    it("should reject an empty new instance ID", async () => {
      await expect(client.rerunWorkflowFromEvent("source-instance", 1, { newInstanceId: "" })).rejects.toThrow(
        TypeError,
      );
      expect(mockRerunWorkflowFromEvent).not.toHaveBeenCalled();
    });
  });

  describe("waitForWorkflowStart", () => {
    it("should return WorkflowState when workflow starts", async () => {
      const now = new Date();
      const orchState = new OrchestrationState("instance-1", "myWorkflow", OrchestrationStatus.RUNNING, now, now);
      mockWaitForOrchestrationStart.mockResolvedValue(orchState);

      const state = await client.waitForWorkflowStart("instance-1", true, 30);

      expect(mockWaitForOrchestrationStart).toHaveBeenCalledWith("instance-1", true, 30);
      expect(state).toBeDefined();
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.RUNNING);
    });

    it("should return undefined when instance is not found", async () => {
      mockWaitForOrchestrationStart.mockResolvedValue(undefined);

      const state = await client.waitForWorkflowStart("nonexistent");

      expect(state).toBeUndefined();
    });
  });

  describe("waitForWorkflowCompletion", () => {
    it("should return WorkflowState when workflow completes", async () => {
      const now = new Date();
      const orchState = new OrchestrationState(
        "instance-1",
        "myWorkflow",
        OrchestrationStatus.COMPLETED,
        now,
        now,
        undefined,
        '"done"',
      );
      mockWaitForOrchestrationCompletion.mockResolvedValue(orchState);

      const state = await client.waitForWorkflowCompletion("instance-1", true, 60);

      expect(mockWaitForOrchestrationCompletion).toHaveBeenCalledWith("instance-1", true, 60);
      expect(state).toBeDefined();
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.serializedOutput).toBe('"done"');
    });

    it("should return undefined when instance is not found", async () => {
      mockWaitForOrchestrationCompletion.mockResolvedValue(undefined);

      const state = await client.waitForWorkflowCompletion("nonexistent");

      expect(state).toBeUndefined();
    });
  });

  describe("terminateWorkflow", () => {
    it("should terminate the workflow with output", async () => {
      mockTerminateOrchestration.mockResolvedValue(undefined);

      await client.terminateWorkflow("instance-1", "termination reason");

      expect(mockTerminateOrchestration).toHaveBeenCalledWith("instance-1", "termination reason");
    });
  });

  describe("raiseEvent", () => {
    it("should raise an event with payload", async () => {
      mockRaiseOrchestrationEvent.mockResolvedValue(undefined);

      await client.raiseEvent("instance-1", "myEvent", { key: "value" });

      expect(mockRaiseOrchestrationEvent).toHaveBeenCalledWith("instance-1", "myEvent", { key: "value" });
    });

    it("should raise an event without payload", async () => {
      mockRaiseOrchestrationEvent.mockResolvedValue(undefined);

      await client.raiseEvent("instance-1", "myEvent");

      expect(mockRaiseOrchestrationEvent).toHaveBeenCalledWith("instance-1", "myEvent", undefined);
    });
  });

  describe("purgeWorkflow", () => {
    it("should return true when workflow is purged", async () => {
      mockPurgeOrchestration.mockResolvedValue({ deletedInstanceCount: 1 });

      const result = await client.purgeWorkflow("instance-1");

      expect(mockPurgeOrchestration).toHaveBeenCalledWith("instance-1");
      expect(result).toBe(true);
    });

    it("should return false when workflow is not found", async () => {
      mockPurgeOrchestration.mockResolvedValue({ deletedInstanceCount: 0 });

      const result = await client.purgeWorkflow("nonexistent");

      expect(result).toBe(false);
    });

    it("should return false when purge result is undefined", async () => {
      mockPurgeOrchestration.mockResolvedValue(undefined);

      const result = await client.purgeWorkflow("instance-1");

      expect(result).toBe(false);
    });
  });

  describe("suspendWorkflow", () => {
    it("should suspend the workflow", async () => {
      mockSuspendOrchestration.mockResolvedValue(undefined);

      await client.suspendWorkflow("instance-1");

      expect(mockSuspendOrchestration).toHaveBeenCalledWith("instance-1", undefined);
    });
  });

  describe("resumeWorkflow", () => {
    it("should resume the workflow", async () => {
      mockResumeOrchestration.mockResolvedValue(undefined);

      await client.resumeWorkflow("instance-1");

      expect(mockResumeOrchestration).toHaveBeenCalledWith("instance-1", undefined);
    });
  });

  describe("stop", () => {
    it("should stop the inner client", async () => {
      mockClientStop.mockResolvedValue(undefined);

      await client.stop();

      expect(mockClientStop).toHaveBeenCalledTimes(1);
    });
  });
});

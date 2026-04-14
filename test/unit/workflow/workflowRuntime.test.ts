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

import { TWorkflow } from "../../../src/types/workflow/Workflow.type";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";

// Mock the durabletask-js module
const mockAddNamedOrchestrator = jest.fn().mockReturnValue("test");
const mockAddNamedActivity = jest.fn().mockReturnValue("test");
const mockStart = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn().mockResolvedValue(undefined);

jest.mock("../../../src/workflow/internal/durabletask", () => ({
  TaskHubGrpcWorker: jest.fn().mockImplementation(() => ({
    addNamedOrchestrator: mockAddNamedOrchestrator,
    addNamedActivity: mockAddNamedActivity,
    start: mockStart,
    stop: mockStop,
  })),
  OrchestrationContext: jest.fn(),
  ActivityContext: jest.fn(),
}));

import WorkflowRuntime from "../../../src/workflow/runtime/WorkflowRuntime";

describe("WorkflowRuntime", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerWorkflow", () => {
    it("should register a workflow with its function name", () => {
      const runtime = new WorkflowRuntime();

      const myWorkflow: TWorkflow = async (_ctx: WorkflowContext, _input: any) => {
        return "result";
      };

      const result = runtime.registerWorkflow(myWorkflow);

      expect(mockAddNamedOrchestrator).toHaveBeenCalledTimes(1);
      expect(mockAddNamedOrchestrator).toHaveBeenCalledWith("myWorkflow", expect.any(Function));
      expect(result).toBe(runtime); // returns this for chaining
    });

    it("should wrap the workflow function with WorkflowContext", () => {
      const runtime = new WorkflowRuntime();
      let receivedContext: any = null;

      const myWorkflow: TWorkflow = async (ctx: WorkflowContext, input: any) => {
        receivedContext = ctx;
        return input;
      };

      runtime.registerWorkflow(myWorkflow);

      // Get the wrapper function that was registered
      const wrapper = mockAddNamedOrchestrator.mock.calls[0][1];

      // Create a mock OrchestrationContext
      const mockOrchCtx = {
        instanceId: "test-id",
        currentUtcDateTime: new Date(),
        isReplaying: false,
      };

      wrapper(mockOrchCtx, "test-input");

      expect(receivedContext).toBeInstanceOf(WorkflowContext);
    });
  });

  describe("registerWorkflowWithName", () => {
    it("should register a workflow with a custom name", () => {
      const runtime = new WorkflowRuntime();

      const myWorkflow: TWorkflow = async (_ctx: WorkflowContext, _input: any) => {
        return "result";
      };

      const result = runtime.registerWorkflowWithName("customName", myWorkflow);

      expect(mockAddNamedOrchestrator).toHaveBeenCalledTimes(1);
      expect(mockAddNamedOrchestrator).toHaveBeenCalledWith("customName", expect.any(Function));
      expect(result).toBe(runtime);
    });
  });

  describe("registerActivity", () => {
    it("should register an activity with its function name", () => {
      const runtime = new WorkflowRuntime();

      const myActivity = async (_ctx: WorkflowActivityContext, input: number) => {
        return input + 1;
      };

      const result = runtime.registerActivity(myActivity);

      expect(mockAddNamedActivity).toHaveBeenCalledTimes(1);
      expect(mockAddNamedActivity).toHaveBeenCalledWith("myActivity", expect.any(Function));
      expect(result).toBe(runtime);
    });

    it("should wrap the activity function with WorkflowActivityContext", () => {
      const runtime = new WorkflowRuntime();
      let receivedContext: any = null;

      const myActivity = async (ctx: WorkflowActivityContext, input: number) => {
        receivedContext = ctx;
        return input + 1;
      };

      runtime.registerActivity(myActivity);

      // Get the wrapper function that was registered
      const wrapper = mockAddNamedActivity.mock.calls[0][1];

      // Create a mock ActivityContext
      const mockActCtx = {
        orchestrationId: "test-orch-id",
        taskId: 42,
      };

      wrapper(mockActCtx, 5);

      expect(receivedContext).toBeInstanceOf(WorkflowActivityContext);
    });

    it("should propagate errors from the activity function", async () => {
      const runtime = new WorkflowRuntime();

      const failingActivity = async (_ctx: WorkflowActivityContext, _input: any) => {
        throw new Error("Activity failed!");
      };

      runtime.registerActivity(failingActivity);

      const wrapper = mockAddNamedActivity.mock.calls[0][1];
      const mockActCtx = {
        orchestrationId: "test-orch-id",
        taskId: 1,
      };

      await expect(wrapper(mockActCtx, null)).rejects.toThrow("Activity failed!");
    });
  });

  describe("registerActivityWithName", () => {
    it("should register an activity with a custom name", () => {
      const runtime = new WorkflowRuntime();

      const myActivity = async (_ctx: WorkflowActivityContext, input: number) => {
        return input + 1;
      };

      const result = runtime.registerActivityWithName("customActivity", myActivity);

      expect(mockAddNamedActivity).toHaveBeenCalledTimes(1);
      expect(mockAddNamedActivity).toHaveBeenCalledWith("customActivity", expect.any(Function));
      expect(result).toBe(runtime);
    });
  });

  describe("chaining", () => {
    it("should support method chaining for registering multiple workflows and activities", () => {
      const runtime = new WorkflowRuntime();

      const workflow1: TWorkflow = async (_ctx: WorkflowContext, _input: any) => "r1";
      const workflow2: TWorkflow = async (_ctx: WorkflowContext, _input: any) => "r2";
      const activity1 = async (_ctx: WorkflowActivityContext, input: number) => input + 1;

      runtime.registerWorkflow(workflow1).registerWorkflow(workflow2).registerActivity(activity1);

      expect(mockAddNamedOrchestrator).toHaveBeenCalledTimes(2);
      expect(mockAddNamedActivity).toHaveBeenCalledTimes(1);
    });
  });

  describe("start", () => {
    it("should start the inner worker", async () => {
      const runtime = new WorkflowRuntime();
      await runtime.start();

      expect(mockStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("stop", () => {
    it("should stop the inner worker", async () => {
      const runtime = new WorkflowRuntime();
      await runtime.stop();

      expect(mockStop).toHaveBeenCalledTimes(1);
    });
  });
});

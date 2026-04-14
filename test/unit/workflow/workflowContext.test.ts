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

import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";
import { Task } from "../../../src/workflow/internal/durabletask/task/task";

describe("WorkflowContext", () => {
  let mockInnerContext: any;
  let ctx: WorkflowContext;

  beforeEach(() => {
    mockInnerContext = {
      instanceId: "test-instance-id",
      currentUtcDateTime: new Date("2025-01-01T00:00:00Z"),
      isReplaying: false,
      createTimer: jest.fn().mockReturnValue({ isCompleted: false } as Partial<Task<any>>),
      callActivity: jest.fn().mockReturnValue({ isCompleted: false } as Partial<Task<any>>),
      callSubOrchestrator: jest.fn().mockReturnValue({ isCompleted: false } as Partial<Task<any>>),
      waitForExternalEvent: jest.fn().mockReturnValue({ isCompleted: false } as Partial<Task<any>>),
      continueAsNew: jest.fn(),
      setCustomStatus: jest.fn(),
    };
    ctx = new WorkflowContext(mockInnerContext);
  });

  describe("constructor", () => {
    it("should throw if innerContext is undefined", () => {
      expect(() => new WorkflowContext(undefined as any)).toThrow("ActivityContext cannot be undefined");
    });

    it("should throw if innerContext is null", () => {
      expect(() => new WorkflowContext(null as any)).toThrow("ActivityContext cannot be undefined");
    });
  });

  describe("getWorkflowInstanceId", () => {
    it("should return the instance ID from inner context", () => {
      expect(ctx.getWorkflowInstanceId()).toBe("test-instance-id");
    });
  });

  describe("getCurrentUtcDateTime", () => {
    it("should return the current UTC date/time from inner context", () => {
      expect(ctx.getCurrentUtcDateTime()).toEqual(new Date("2025-01-01T00:00:00Z"));
    });
  });

  describe("isReplaying", () => {
    it("should return false when not replaying", () => {
      expect(ctx.isReplaying()).toBe(false);
    });

    it("should return true when replaying", () => {
      mockInnerContext.isReplaying = true;
      expect(ctx.isReplaying()).toBe(true);
    });
  });

  describe("createTimer", () => {
    it("should delegate to inner context with a Date", () => {
      const fireAt = new Date("2025-06-01T12:00:00Z");
      ctx.createTimer(fireAt);

      expect(mockInnerContext.createTimer).toHaveBeenCalledWith(fireAt);
    });

    it("should delegate to inner context with a number (seconds)", () => {
      ctx.createTimer(30);

      expect(mockInnerContext.createTimer).toHaveBeenCalledWith(30);
    });
  });

  describe("callActivity", () => {
    it("should call activity by function reference", () => {
      const myActivity = async (_ctx: WorkflowActivityContext, input: number) => input + 1;

      ctx.callActivity(myActivity, 5);

      expect(mockInnerContext.callActivity).toHaveBeenCalledWith("myActivity", 5);
    });

    it("should call activity by string name", () => {
      ctx.callActivity("remoteActivity", "input-data");

      expect(mockInnerContext.callActivity).toHaveBeenCalledWith("remoteActivity", "input-data");
    });

    it("should call activity without input", () => {
      const myActivity = async (_ctx: WorkflowActivityContext) => "done";

      ctx.callActivity(myActivity);

      expect(mockInnerContext.callActivity).toHaveBeenCalledWith("myActivity", undefined);
    });
  });

  describe("callChildWorkflow", () => {
    it("should call child workflow by function reference", () => {
      // eslint-disable-next-line require-yield
      const childWorkflow = async function* (_ctx: WorkflowContext): any {
        return "child-result";
      };

      ctx.callChildWorkflow(childWorkflow, "input", "child-id");

      expect(mockInnerContext.callSubOrchestrator).toHaveBeenCalledWith("childWorkflow", "input", "child-id");
    });

    it("should call child workflow by string name", () => {
      ctx.callChildWorkflow("remoteWorkflow", "input", "child-id");

      expect(mockInnerContext.callSubOrchestrator).toHaveBeenCalledWith("remoteWorkflow", "input", "child-id");
    });

    it("should call child workflow without optional params", () => {
      // eslint-disable-next-line require-yield
      const childWorkflow = async function* (_ctx: WorkflowContext): any {
        return "result";
      };

      ctx.callChildWorkflow(childWorkflow);

      expect(mockInnerContext.callSubOrchestrator).toHaveBeenCalledWith("childWorkflow", undefined, undefined);
    });
  });

  describe("callSubWorkflow (deprecated)", () => {
    it("should delegate to callSubOrchestrator by function reference", () => {
      // eslint-disable-next-line require-yield
      const subWorkflow = async function* (_ctx: WorkflowContext): any {
        return "sub-result";
      };

      ctx.callSubWorkflow(subWorkflow, "input", "sub-id");

      expect(mockInnerContext.callSubOrchestrator).toHaveBeenCalledWith("subWorkflow", "input", "sub-id");
    });

    it("should delegate to callSubOrchestrator by string name", () => {
      ctx.callSubWorkflow("remoteOrchestrator", "input");

      expect(mockInnerContext.callSubOrchestrator).toHaveBeenCalledWith("remoteOrchestrator", "input", undefined);
    });
  });

  describe("waitForExternalEvent", () => {
    it("should delegate to inner context", () => {
      ctx.waitForExternalEvent("myEvent");

      expect(mockInnerContext.waitForExternalEvent).toHaveBeenCalledWith("myEvent");
    });
  });

  describe("continueAsNew", () => {
    it("should delegate to inner context", () => {
      ctx.continueAsNew({ newData: true }, false);

      expect(mockInnerContext.continueAsNew).toHaveBeenCalledWith({ newData: true }, false);
    });

    it("should support saving events", () => {
      ctx.continueAsNew("new-input", true);

      expect(mockInnerContext.continueAsNew).toHaveBeenCalledWith("new-input", true);
    });
  });

  describe("setCustomStatus", () => {
    it("should delegate to inner context", () => {
      ctx.setCustomStatus("processing step 2");

      expect(mockInnerContext.setCustomStatus).toHaveBeenCalledWith("processing step 2");
    });
  });

  describe("whenAll", () => {
    it("should compose multiple tasks", () => {
      const task1 = { isCompleted: false } as unknown as Task<number>;
      const task2 = { isCompleted: false } as unknown as Task<number>;

      const result = ctx.whenAll([task1, task2]);

      expect(result).toBeDefined();
    });
  });

  describe("whenAny", () => {
    it("should compose multiple tasks", () => {
      const task1 = { isCompleted: false } as unknown as Task<number>;
      const task2 = { isCompleted: false } as unknown as Task<string>;

      const result = ctx.whenAny([task1, task2]);

      expect(result).toBeDefined();
    });
  });
});

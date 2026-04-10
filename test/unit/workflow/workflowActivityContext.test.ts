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

import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";

describe("WorkflowActivityContext", () => {
  describe("constructor", () => {
    it("should throw if innerContext is undefined", () => {
      expect(() => new WorkflowActivityContext(undefined as any)).toThrow("ActivityContext cannot be undefined");
    });

    it("should throw if innerContext is null", () => {
      expect(() => new WorkflowActivityContext(null as any)).toThrow("ActivityContext cannot be undefined");
    });

    it("should create successfully with a valid context", () => {
      const mockContext = {
        orchestrationId: "orch-123",
        taskId: 7,
      };

      const ctx = new WorkflowActivityContext(mockContext as any);
      expect(ctx).toBeDefined();
    });
  });

  describe("getWorkflowInstanceId", () => {
    it("should return the orchestration ID from inner context", () => {
      const mockContext = {
        orchestrationId: "workflow-instance-abc",
        taskId: 1,
      };

      const ctx = new WorkflowActivityContext(mockContext as any);
      expect(ctx.getWorkflowInstanceId()).toBe("workflow-instance-abc");
    });
  });

  describe("getWorkflowActivityId", () => {
    it("should return the task ID from inner context", () => {
      const mockContext = {
        orchestrationId: "orch-123",
        taskId: 42,
      };

      const ctx = new WorkflowActivityContext(mockContext as any);
      expect(ctx.getWorkflowActivityId()).toBe(42);
    });

    it("should return 0 as a valid task ID", () => {
      const mockContext = {
        orchestrationId: "orch-123",
        taskId: 0,
      };

      const ctx = new WorkflowActivityContext(mockContext as any);
      expect(ctx.getWorkflowActivityId()).toBe(0);
    });
  });
});

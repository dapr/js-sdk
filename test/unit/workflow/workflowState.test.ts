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

import { OrchestrationStatus } from "@dapr/durabletask-js/orchestration/enum/orchestration-status.enum";
import { OrchestrationState } from "@dapr/durabletask-js/orchestration/orchestration-state";
import { FailureDetails } from "@dapr/durabletask-js/task/failure-details";
import { WorkflowState } from "../../../src/workflow/client/WorkflowState";
import { WorkflowRuntimeStatus } from "../../../src/workflow/runtime/WorkflowRuntimeStatus";

describe("WorkflowState", () => {
  const now = new Date("2025-06-15T10:30:00Z");
  const later = new Date("2025-06-15T10:35:00Z");

  describe("constructor", () => {
    it("should throw if orchestrationState is null", () => {
      expect(() => new WorkflowState(null as any)).toThrow("OrchestrationMetadata cannot be null");
    });

    it("should throw if orchestrationState is undefined", () => {
      expect(() => new WorkflowState(undefined as any)).toThrow("OrchestrationMetadata cannot be null");
    });
  });

  describe("property accessors", () => {
    it("should return all properties for a completed workflow", () => {
      const orchState = new OrchestrationState(
        "instance-abc",
        "myWorkflow",
        OrchestrationStatus.COMPLETED,
        now,
        later,
        '"hello"',
        '"world"',
        '"in-progress"',
      );

      const state = new WorkflowState(orchState);

      expect(state.name).toBe("myWorkflow");
      expect(state.instanceId).toBe("instance-abc");
      expect(state.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state.createdAt).toEqual(now);
      expect(state.lastUpdatedAt).toEqual(later);
      expect(state.serializedInput).toBe('"hello"');
      expect(state.serializedOutput).toBe('"world"');
      expect(state.customStatus).toBe('"in-progress"');
      expect(state.workflowFailureDetails).toBeUndefined();
    });

    it("should map all runtime statuses correctly", () => {
      const statusMappings = [
        { orch: OrchestrationStatus.RUNNING, wf: WorkflowRuntimeStatus.RUNNING },
        { orch: OrchestrationStatus.COMPLETED, wf: WorkflowRuntimeStatus.COMPLETED },
        { orch: OrchestrationStatus.FAILED, wf: WorkflowRuntimeStatus.FAILED },
        { orch: OrchestrationStatus.TERMINATED, wf: WorkflowRuntimeStatus.TERMINATED },
        { orch: OrchestrationStatus.PENDING, wf: WorkflowRuntimeStatus.PENDING },
        { orch: OrchestrationStatus.SUSPENDED, wf: WorkflowRuntimeStatus.SUSPENDED },
        { orch: OrchestrationStatus.CONTINUED_AS_NEW, wf: WorkflowRuntimeStatus.CONTINUED_AS_NEW },
      ];

      for (const { orch, wf } of statusMappings) {
        const orchState = new OrchestrationState("id", "name", orch, now, later);
        const state = new WorkflowState(orchState);
        expect(state.runtimeStatus).toBe(wf);
      }
    });

    it("should handle undefined optional fields", () => {
      const orchState = new OrchestrationState(
        "instance-1",
        "myWorkflow",
        OrchestrationStatus.RUNNING,
        now,
        later,
      );

      const state = new WorkflowState(orchState);

      expect(state.serializedInput).toBeUndefined();
      expect(state.serializedOutput).toBeUndefined();
      expect(state.customStatus).toBeUndefined();
      expect(state.workflowFailureDetails).toBeUndefined();
    });
  });

  describe("workflowFailureDetails", () => {
    it("should populate failure details for failed workflows", () => {
      const failureDetails = new FailureDetails("Something broke", "TypeError", "Error: Something broke\n    at ...");
      const orchState = new OrchestrationState(
        "instance-failed",
        "failWorkflow",
        OrchestrationStatus.FAILED,
        now,
        later,
        undefined,
        undefined,
        undefined,
        failureDetails,
      );

      const state = new WorkflowState(orchState);

      expect(state.workflowFailureDetails).toBeDefined();
      expect(state.workflowFailureDetails?.getErrorMessage()).toBe("Something broke");
      expect(state.workflowFailureDetails?.getErrorType()).toBe("TypeError");
      expect(state.workflowFailureDetails?.getStackTrace()).toBe("Error: Something broke\n    at ...");
    });

    it("should not have failure details for successful workflows", () => {
      const orchState = new OrchestrationState(
        "instance-ok",
        "goodWorkflow",
        OrchestrationStatus.COMPLETED,
        now,
        later,
      );

      const state = new WorkflowState(orchState);

      expect(state.workflowFailureDetails).toBeUndefined();
    });
  });
});

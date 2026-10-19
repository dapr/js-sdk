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

import { OrchestrationRuntimeContext } from "../../../src/workflow/engine/context/OrchestrationRuntimeContext";

describe("OrchestrationRuntimeContext", () => {
  describe("continueAsNew", () => {
    it("should carry buffered external events forward by default", () => {
      const context = new OrchestrationRuntimeContext("test-instance");
      context._receivedEvents = { "my-event": ["first", "second"] };

      context.continueAsNew({ step: 1 });

      const [action] = context.getActions();
      expect(action.workflowActionType.case).toBe("completeWorkflow");
      if (action.workflowActionType.case !== "completeWorkflow") {
        throw new Error("Expected a complete workflow action");
      }

      expect(
        action.workflowActionType.value.carryoverEvents.map((event) =>
          event.eventType.case === "eventRaised"
            ? [event.eventType.value.name, event.eventType.value.input]
            : undefined,
        ),
      ).toEqual([
        ["my-event", JSON.stringify("first")],
        ["my-event", JSON.stringify("second")],
      ]);
    });

    it("should discard buffered external events when explicitly disabled", () => {
      const context = new OrchestrationRuntimeContext("test-instance");
      context._receivedEvents = { "my-event": ["buffered"] };

      context.continueAsNew({ step: 1 }, false);

      const [action] = context.getActions();
      expect(action.workflowActionType.case).toBe("completeWorkflow");
      if (action.workflowActionType.case !== "completeWorkflow") {
        throw new Error("Expected a complete workflow action");
      }
      expect(action.workflowActionType.value.carryoverEvents).toHaveLength(0);
    });
  });
});

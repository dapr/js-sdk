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

import { create } from "@bufbuild/protobuf";
import { OrchestrationExecutor, Registry, StopIterationError } from "../../../src/workflow/engine";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  newExecutionStartedEvent,
  newTaskScheduledEvent,
  newTimerCreatedEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";

const scheduledEvents = [
  newTimerCreatedEvent(1, new Date()),
  newTaskScheduledEvent(1, "expected"),
  create(HistoryEventSchema, {
    eventId: 1,
    eventType: { case: "childWorkflowInstanceCreated", value: { name: "expected" } },
  }),
];

describe("orchestration event error handling", () => {
  it("fails an orchestration when its function is not registered", async () => {
    const result = await new OrchestrationExecutor(new Registry()).execute(
      "id",
      [],
      [newExecutionStartedEvent("missing", "id")],
    );
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.FAILED,
        failureDetails: { errorType: "Error", errorMessage: "Orchestrator 'missing' is not registered." },
      },
    });
  });

  describe.each(scheduledEvents.map((event) => ({ event, kind: event.eventType.case })))("$kind", ({ event }) => {
    it.each([false, true])("preserves replay failures with a mismatched action (present: %s)", async (present) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("workflow", function* (context) {
        if (present) {
          context.sendEvent("other", "event", undefined);
        }
        yield context.waitForExternalEvent("wait");
      });
      const result = await new OrchestrationExecutor(registry).execute(
        "id",
        [newExecutionStartedEvent("workflow", "id")],
        [event],
      );
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].workflowActionType).toMatchObject({
        case: "completeWorkflow",
        value: {
          workflowStatus: OrchestrationStatus.FAILED,
          failureDetails: {
            errorType: "NonDeterminismError",
            errorMessage: expect.stringContaining(
              present ? "trying to call a different action" : "doesn't have this action",
            ),
          },
        },
      });
    });
  });

  it.each(scheduledEvents.slice(1))(
    "preserves replay failures for changed task names ($eventType.case)",
    async (event) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("workflow", function* (context) {
        yield event.eventType.case === "taskScheduled"
          ? context.callActivity("different")
          : context.callSubOrchestrator("different");
      });
      const result = await new OrchestrationExecutor(registry).execute(
        "id",
        [newExecutionStartedEvent("workflow", "id")],
        [event],
      );
      expect(result.actions[0].workflowActionType).toMatchObject({
        case: "completeWorkflow",
        value: {
          workflowStatus: OrchestrationStatus.FAILED,
          failureDetails: {
            errorType: "NonDeterminismError",
            errorMessage: expect.stringContaining("trying to call different"),
          },
        },
      });
    },
  );

  it("continues treating StopIterationError as successful completion", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", () => {
      throw new StopIterationError("result");
    });
    const result = await new OrchestrationExecutor(registry).execute(
      "id",
      [],
      [newExecutionStartedEvent("workflow", "id")],
    );
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.COMPLETED, result: '"result"' },
    });
  });
});

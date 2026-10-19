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
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import type { HistoryEvent } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { StopIterationError, whenAny } from "../../../src/workflow/engine/task";
import type { Task } from "../../../src/workflow/engine/task/Task";
import { OrchestrationExecutor } from "../../../src/workflow/engine/worker/OrchestrationExecutor";
import { Registry } from "../../../src/workflow/engine/worker/Registry";
import {
  newEventRaisedEvent,
  newExecutionStartedEvent,
  newExecutionTerminatedEvent,
  newTaskCompletedEvent,
  newTaskScheduledEvent,
  newTimerCreatedEvent,
  newTimerFiredEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";

describe("OrchestrationExecutor completion", () => {
  const instanceId = "workflow-id";
  const fireAt = new Date("2026-01-01T00:00:30Z");

  function createExecutor() {
    const registry = new Registry();
    registry.addNamedOrchestrator("jobWaitWorkflow", async function* (ctx): AsyncGenerator<
      Task<unknown>,
      string,
      unknown
    > {
      yield ctx.callActivity("createJob");
      const eventTask = ctx.waitForExternalEvent("job-done");
      const timerTask = ctx.createTimer(fireAt);
      const winner = yield whenAny([eventTask, timerTask]);
      return winner === eventTask ? "completed" : "timeout";
    });
    return new OrchestrationExecutor(registry);
  }

  function startedHistory(): HistoryEvent[] {
    return [newExecutionStartedEvent("jobWaitWorkflow", instanceId), newTaskScheduledEvent(1, "createJob")];
  }

  it.each(["new events", "replayed events", "between batches"])(
    "preserves completion when a timer confirmation follows the winning event in %s",
    async (ordering) => {
      const history = startedHistory();
      const completionEvents = [newTaskCompletedEvent(1), newEventRaisedEvent("job-done")];
      const trailingEvents = [
        newTimerCreatedEvent(2, fireAt),
        newTimerFiredEvent(2, fireAt),
        newExecutionTerminatedEvent(JSON.stringify("late termination")),
      ];
      const oldEvents =
        ordering === "new events"
          ? history
          : [...history, ...completionEvents, ...(ordering === "replayed events" ? trailingEvents : [])];
      const newEvents =
        ordering === "new events"
          ? [...completionEvents, ...trailingEvents]
          : ordering === "replayed events"
          ? [newEventRaisedEvent("late-event")]
          : trailingEvents;

      const result = await createExecutor().execute(instanceId, oldEvents, newEvents);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]).toMatchObject({
        id: 3,
        workflowActionType: {
          case: "completeWorkflow",
          value: {
            workflowStatus: OrchestrationStatus.COMPLETED,
            result: JSON.stringify("completed"),
          },
        },
      });
    },
  );

  it("completes when the timer wins and ignores a later external event", async () => {
    const result = await createExecutor().execute(
      instanceId,
      [...startedHistory(), newTaskCompletedEvent(1), newTimerCreatedEvent(2, fireAt)],
      [newTimerFiredEvent(2, fireAt), newEventRaisedEvent("job-done")],
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.COMPLETED,
        result: JSON.stringify("timeout"),
      },
    });
  });

  it("still detects a mismatched timer confirmation before completion", async () => {
    const result = await createExecutor().execute(
      instanceId,
      [...startedHistory(), newTaskCompletedEvent(1)],
      [newTimerCreatedEvent(99, fireAt)],
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.FAILED,
        failureDetails: { errorType: "NonDeterminismError" },
      },
    });
  });

  it("preserves a termination result when a timer confirmation follows it", async () => {
    const result = await createExecutor().execute(
      instanceId,
      [...startedHistory(), newTaskCompletedEvent(1)],
      [newExecutionTerminatedEvent(JSON.stringify("stopped")), newTimerCreatedEvent(2, fireAt)],
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.TERMINATED,
        result: JSON.stringify("stopped"),
      },
    });
  });

  it("continues buffering carryover events after continueAsNew", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("continuingWorkflow", function* (ctx) {
      yield ctx.waitForExternalEvent("restart");
      ctx.continueAsNew("next", true);
    });
    const executor = new OrchestrationExecutor(registry);

    const result = await executor.execute(
      instanceId,
      [newExecutionStartedEvent("continuingWorkflow", instanceId)],
      [newEventRaisedEvent("restart"), newEventRaisedEvent("next-event", JSON.stringify("payload"))],
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.CONTINUED_AS_NEW,
        carryoverEvents: [
          { eventType: { case: "eventRaised", value: { name: "next-event", input: JSON.stringify("payload") } } },
        ],
      },
    });
  });

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
});

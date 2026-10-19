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
import { OrchestrationExecutor, Registry, TaskHubClient, OrchestrationState } from "../../../src/workflow/engine";
import { ActivityExecutor } from "../../../src/workflow/engine/worker/ActivityExecutor";
import { OrchestrationRuntimeContext } from "../../../src/workflow/engine/context/OrchestrationRuntimeContext";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { WorkflowState, Task, JsonSerializer } from "../../../src";
import {
  newExecutionStartedEvent,
  newTaskScheduledEvent,
  newTaskCompletedEvent,
  newEventRaisedEvent,
  newScheduleTaskAction,
  newCreateChildWorkflowAction,
  newCreateDetachedWorkflowAction,
  newSendEventAction,
  newCompleteWorkflowAction,
} from "../../../src/workflow/engine/worker/protoHelpers";
import { CustomSerializer } from "../../fixtures/CustomSerializer";

const mockClient = {
  startInstance: jest.fn(async (_request: { input?: string }) => ({ instanceId: "id" })),
  raiseEvent: jest.fn(),
  terminateInstance: jest.fn(),
  rerunWorkflowFromEvent: jest.fn(async (_request: { input?: string }) => ({ newInstanceID: "rerun" })),
};
jest.mock("@connectrpc/connect", () => ({
  ...jest.requireActual("@connectrpc/connect"),
  createClient: () => mockClient,
}));

describe("workflow serialization", () => {
  const serializer = new CustomSerializer();
  const value = { count: 9007199254740993n };
  beforeEach(() => jest.clearAllMocks());

  const defaultValues = [
    { name: "omitted", value: undefined },
    { name: "null", value: null },
    { name: "false", value: false },
    { name: "zero", value: 0 },
    { name: "empty string", value: "" },
    { name: "object", value: { count: 42 } },
    { name: "array", value: [false, 0, ""] },
    { name: "NaN", value: NaN },
    { name: "symbol", value: Symbol("omitted") },
    { name: "function", value: () => undefined },
    { name: "toJSON omission", value: { toJSON: () => undefined } },
  ];

  it.each(defaultValues)("preserves default client JSON and omission behavior: $name", async ({ value }) => {
    const client = new TaskHubClient("localhost:50001");
    await client.scheduleNewOrchestration("workflow", value, "id");
    await client.raiseOrchestrationEvent("id", "event", value);
    await client.terminateOrchestration("id", value);
    await client.rerunWorkflowFromEvent("id", 2, { input: value });
    const encoded = JSON.stringify(value);
    expect(mockClient.startInstance.mock.calls[0][0].input).toBe(encoded);
    const defaulted = JSON.stringify(value === undefined ? null : value);
    expect(mockClient.raiseEvent.mock.calls[0][0].input).toBe(defaulted);
    expect(mockClient.terminateInstance.mock.calls[0][0].output).toBe(defaulted);
    expect(mockClient.rerunWorkflowFromEvent.mock.calls[0][0].input).toBe(encoded);
  });

  it.each(defaultValues)("preserves default worker output and scheduling semantics: $name", async ({ value }) => {
    const registry = new Registry();
    registry.addNamedActivity("echo", (_ctx, input) => {
      expect(input).toEqual({ count: 1 });
      return value;
    });
    const encoded = value != null ? JSON.stringify(value) : undefined;
    await expect(new ActivityExecutor(registry).execute("id", "echo", 1, '{"count":1}')).resolves.toBe(encoded);
    const complete = new OrchestrationRuntimeContext("id");
    complete.setComplete(value, OrchestrationStatus.COMPLETED);
    expect(complete.getActions()).toEqual([newCompleteWorkflowAction(1, OrchestrationStatus.COMPLETED, encoded)]);

    const ctx = new OrchestrationRuntimeContext("id");
    const activityTask = ctx.callActivity("echo", value);
    ctx.callSubOrchestrator("child", value, "child-id");
    ctx.sendEvent("other", "event", value);
    ctx.scheduleNewDetachedWorkflow("detached", value, "detached-id");
    expect(ctx.getActions()).toEqual([
      newScheduleTaskAction(1, "echo", encoded, activityTask.executionId),
      newCreateChildWorkflowAction(2, "child", "child-id", encoded),
      newSendEventAction(3, "other", "event", encoded),
      newCreateDetachedWorkflowAction(
        4,
        "detached",
        "detached-id",
        value === undefined ? undefined : JSON.stringify(value),
      ),
    ]);
    ctx.continueAsNew(value);
    expect(ctx.getActions()).toEqual([newCompleteWorkflowAction(5, OrchestrationStatus.CONTINUED_AS_NEW, encoded)]);
  });

  it("keeps strict JSON validation opt-in and does not fall back after provider errors", async () => {
    const client = new TaskHubClient("localhost:50001", undefined, false, undefined, undefined, new JsonSerializer());
    await expect(client.scheduleNewOrchestration("workflow", { toJSON: () => undefined }, "id")).rejects.toThrow(
      TypeError,
    );
    expect(mockClient.startInstance).not.toHaveBeenCalled();
  });

  it("serializes scheduling, events, termination and rerun replacement input", async () => {
    const client = new TaskHubClient("localhost:50001", undefined, false, undefined, undefined, serializer);
    await client.scheduleNewOrchestration("workflow", value, "id");
    await client.raiseOrchestrationEvent("id", "event", value);
    await client.terminateOrchestration("id", value);
    await client.rerunWorkflowFromEvent("id", 2, { input: value });
    expect(mockClient.startInstance).toHaveBeenCalledWith(
      expect.objectContaining({ name: "workflow", input: serializer.serialize(value) }),
      expect.anything(),
    );
    expect(mockClient.raiseEvent).toHaveBeenCalledWith(
      expect.objectContaining({ input: serializer.serialize(value) }),
      expect.anything(),
    );
    expect(mockClient.terminateInstance).toHaveBeenCalledWith(
      expect.objectContaining({ output: serializer.serialize(value) }),
      expect.anything(),
    );
    expect(mockClient.rerunWorkflowFromEvent).toHaveBeenCalledWith(
      expect.objectContaining({ input: serializer.serialize(value), overwriteInput: true }),
    );
  });

  it("round-trips activity input/output and replays an orchestration with the provider", async () => {
    const registry = new Registry();
    registry.addNamedActivity("echo", (ctx, input) => {
      expect(ctx.taskExecutionId).toBe("activity-execution-key");
      return input;
    });
    const names: string[] = [];
    registry.addNamedOrchestrator("workflow", function* (ctx, input): Generator<Task<unknown>, unknown, unknown> {
      names.push(ctx.name);
      const result = yield ctx.callActivity("echo", input);
      names.push(ctx.name);
      return result;
    });
    const encoded = serializer.serialize(value);
    const activity = new ActivityExecutor(registry, serializer);
    await expect(activity.execute("id", "echo", 1, encoded, undefined, "activity-execution-key")).resolves.toBe(
      encoded,
    );
    const executor = new OrchestrationExecutor(registry, serializer);
    const started = newExecutionStartedEvent("workflow", "id", encoded);
    const first = await executor.execute("id", [], [started]);
    expect(first.actions[0].workflowActionType).toMatchObject({
      case: "scheduleTask",
      value: { input: encoded, taskExecutionId: expect.any(String) },
    });
    const scheduledAction = first.actions[0].workflowActionType;
    if (scheduledAction.case !== "scheduleTask") throw new Error("Expected an activity");
    const executionId = scheduledAction.value.taskExecutionId;
    const replay = await executor.execute(
      "id",
      [started, newTaskScheduledEvent(1, "echo", encoded, executionId)],
      [newTaskCompletedEvent(1, "invalid", "stale-execution-id"), newTaskCompletedEvent(1, encoded, executionId)],
    );
    expect(replay.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { workflowStatus: OrchestrationStatus.COMPLETED, result: encoded },
    });
    expect(names).toEqual(["workflow", "workflow", "workflow"]);
  });

  it.each([true, false])("decodes external events whether buffered or awaited (%s)", async (buffered) => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      return yield ctx.waitForExternalEvent("event");
    });
    const start = newExecutionStartedEvent("workflow", "id");
    const event = newEventRaisedEvent("event", serializer.serialize(value));
    const result = await new OrchestrationExecutor(registry, serializer).execute(
      "id",
      [],
      buffered ? [event, start] : [start, event],
    );
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { result: serializer.serialize(value) },
    });
  });

  it("uses the provider for child and detached workflows, inter-workflow events and continue-as-new carryover", () => {
    const ctx = new OrchestrationRuntimeContext("id", undefined, undefined, "", serializer);
    ctx.callSubOrchestrator("child", value);
    ctx.sendEvent("other", "event", value);
    ctx.scheduleNewDetachedWorkflow("detached", value);
    expect(ctx.getActions().map((action) => action.workflowActionType)).toEqual([
      expect.objectContaining({
        case: "createChildWorkflow",
        value: expect.objectContaining({ input: serializer.serialize(value) }),
      }),
      expect.objectContaining({
        case: "sendEvent",
        value: expect.objectContaining({ data: serializer.serialize(value) }),
      }),
      expect.objectContaining({
        case: "createDetachedWorkflow",
        value: expect.objectContaining({ input: serializer.serialize(value) }),
      }),
    ]);
    ctx._receivedEvents.event = [value];
    ctx.continueAsNew(value);
    expect(ctx.getActions()[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        result: serializer.serialize(value),
        carryoverEvents: [
          expect.objectContaining({
            eventType: expect.objectContaining({
              case: "eventRaised",
              value: expect.objectContaining({ input: serializer.serialize(value) }),
            }),
          }),
        ],
      },
    });
  });

  it("decodes child workflow results", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      return yield ctx.callSubOrchestrator("child");
    });
    const result = await new OrchestrationExecutor(registry, serializer).execute(
      "id",
      [],
      [
        newExecutionStartedEvent("workflow", "id"),
        create(HistoryEventSchema, {
          eventId: 1,
          eventType: {
            case: "childWorkflowInstanceCreated",
            value: { name: "child" },
          },
        }),
        create(HistoryEventSchema, {
          eventType: {
            case: "childWorkflowInstanceCompleted",
            value: { taskScheduledId: 1, result: serializer.serialize(value) },
          },
        }),
      ],
    );
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: { result: serializer.serialize(value) },
    });
  });

  it("surfaces invalid custom input as a failed workflow and rejects invalid activity input", async () => {
    const registry = new Registry();
    registry.addNamedOrchestrator("workflow", () => {
      return "unused";
    });
    registry.addNamedActivity("echo", (_ctx, input) => input);
    const result = await new OrchestrationExecutor(registry, serializer).execute(
      "id",
      [],
      [newExecutionStartedEvent("workflow", "id", "invalid")],
    );
    expect(result.actions[0].workflowActionType).toMatchObject({
      case: "completeWorkflow",
      value: {
        workflowStatus: OrchestrationStatus.FAILED,
        failureDetails: { errorMessage: "Invalid custom payload" },
      },
    });
    await expect(new ActivityExecutor(registry, serializer).execute("id", "echo", 1, "invalid")).rejects.toThrow(
      "Invalid custom payload",
    );
  });

  it("adds typed state access without changing raw state properties", () => {
    const encoded = serializer.serialize(value);
    const state = new WorkflowState(
      new OrchestrationState(
        "id",
        "workflow",
        OrchestrationStatus.COMPLETED,
        new Date(),
        new Date(),
        encoded,
        encoded,
        encoded,
      ),
      serializer,
    );
    expect(state.getInput<typeof value>()).toEqual(value);
    expect(state.getOutput<typeof value>()).toEqual(value);
    expect(state.getCustomStatus<typeof value>()).toEqual(value);
    expect(state.serializedInput).toBe(encoded);
    expect(state.serializedOutput).toBe(encoded);
    expect(state.customStatus).toBe(encoded);
  });
});

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
import { Code, ConnectError } from "@connectrpc/connect";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import {
  GetInstanceHistoryRequestSchema,
  GetInstanceHistoryResponseSchema,
  ListInstanceIDsRequestSchema,
  ListInstanceIDsResponseSchema,
  RerunWorkflowFromEventRequestSchema,
  RerunWorkflowFromEventResponseSchema,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import {
  CreateWorkflowScheduleRequestSchema,
  DeleteWorkflowScheduleRequestSchema,
  GetWorkflowScheduleRequestSchema,
  GetWorkflowScheduleResponseSchema,
  ListWorkflowSchedulesRequestSchema,
  ListWorkflowSchedulesResponseSchema,
  TriggerWorkflowScheduleRequestSchema,
  TriggerWorkflowScheduleResponseSchema,
  WorkflowScheduleSchema,
  WorkflowScheduleState as ProtoWorkflowScheduleState,
} from "../../../src/proto/dapr/proto/durabletask/v1/workflow_schedule_pb";
import { OrchestrationStatus } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { type RerunWorkflowFromEventOptions, WorkflowRuntimeStatus, WorkflowScheduleState } from "../../../src";
import { TaskHubClient } from "../../../src/workflow/engine";

const mockClient = {
  getInstanceHistory: jest.fn(),
  rerunWorkflowFromEvent: jest.fn(),
  listInstanceIDs: jest.fn(),
  createWorkflowSchedule: jest.fn(),
  getWorkflowSchedule: jest.fn(),
  listWorkflowSchedules: jest.fn(),
  deleteWorkflowSchedule: jest.fn(),
  triggerWorkflowSchedule: jest.fn(),
};

jest.mock("@connectrpc/connect", () => ({
  ...jest.requireActual("@connectrpc/connect"),
  createClient: () => mockClient,
}));

describe("TaskHubClient workflow history", () => {
  const { getInstanceHistory, rerunWorkflowFromEvent } = mockClient;
  let client: TaskHubClient;

  beforeEach(() => {
    jest.resetAllMocks();
    client = new TaskHubClient("localhost:50001");
  });

  it("sends the history request and preserves typed event payloads", async () => {
    const event = create(HistoryEventSchema, {
      eventId: 7,
      eventType: {
        case: "taskScheduled",
        value: { name: "echo", input: '{"value":"original"}' },
      },
    });
    const response = create(GetInstanceHistoryResponseSchema, { events: [event] });
    getInstanceHistory.mockResolvedValueOnce(response);

    const history = await client.getWorkflowHistory("source-instance");

    expect(getInstanceHistory).toHaveBeenCalledWith(
      create(GetInstanceHistoryRequestSchema, { instanceId: "source-instance" }),
    );
    expect(history).toBe(response.events);
    expect(history[0].eventType).toEqual(event.eventType);
  });

  it("preserves an empty history returned by the runtime", async () => {
    getInstanceHistory.mockResolvedValueOnce(create(GetInstanceHistoryResponseSchema));

    await expect(client.getWorkflowHistory("source-instance")).resolves.toEqual([]);
  });

  it.each([Code.NotFound, Code.Unknown, Code.Unavailable])("preserves history RPC error %s", async (code) => {
    const error = new ConnectError("history unavailable", code);
    getInstanceHistory.mockRejectedValueOnce(error);

    await expect(client.getWorkflowHistory("missing-instance")).rejects.toBe(error);
  });

  const rerunCases: {
    name: string;
    options?: RerunWorkflowFromEventOptions;
    input?: string;
    overwriteInput: boolean;
  }[] = [
    { name: "omitted options", overwriteInput: false },
    { name: "custom ID without replacement input", options: { newInstanceId: "custom-id" }, overwriteInput: false },
    {
      name: "object",
      options: { input: { value: "replacement" } },
      input: '{"value":"replacement"}',
      overwriteInput: true,
    },
    { name: "null", options: { input: null }, input: "null", overwriteInput: true },
    { name: "false", options: { input: false }, input: "false", overwriteInput: true },
    { name: "zero", options: { input: 0 }, input: "0", overwriteInput: true },
    { name: "empty string", options: { input: "" }, input: '""', overwriteInput: true },
    { name: "explicit undefined", options: { input: undefined }, overwriteInput: false },
    { name: "clear input", options: { overwriteInput: true }, overwriteInput: true },
    {
      name: "explicitly preserve input",
      options: { input: { ignored: true }, overwriteInput: false },
      input: '{"ignored":true}',
      overwriteInput: false,
    },
  ];

  it.each(rerunCases)("encodes rerun options: $name", async ({ options, input, overwriteInput }) => {
    rerunWorkflowFromEvent.mockResolvedValueOnce(
      create(RerunWorkflowFromEventResponseSchema, { newInstanceID: options?.newInstanceId ?? "runtime-generated-id" }),
    );

    const id = await client.rerunWorkflowFromEvent("source-instance", 7, options);

    expect(rerunWorkflowFromEvent).toHaveBeenCalledWith(
      create(RerunWorkflowFromEventRequestSchema, {
        sourceInstanceID: "source-instance",
        eventID: 7,
        newInstanceID: options?.newInstanceId,
        input,
        overwriteInput,
      }),
    );
    expect(id).toBe(options?.newInstanceId ?? "runtime-generated-id");
  });

  it.each([Code.NotFound, Code.InvalidArgument, Code.Unknown, Code.Unavailable])(
    "preserves rerun RPC error %s",
    async (code) => {
      const error = new ConnectError("rerun failed", code);
      rerunWorkflowFromEvent.mockRejectedValueOnce(error);

      await expect(client.rerunWorkflowFromEvent("source-instance", 7)).rejects.toBe(error);
    },
  );

  it("rejects non-serializable replacement input without sending a rerun request", async () => {
    const input: { self?: unknown } = {};
    input.self = input;

    await expect(client.rerunWorkflowFromEvent("source-instance", 7, { input })).rejects.toThrow(TypeError);
    expect(rerunWorkflowFromEvent).not.toHaveBeenCalled();
  });
});

describe("TaskHubClient workflow schedules", () => {
  let client: TaskHubClient;
  const due = new Date("2026-01-02T03:04:05Z");
  const expiry = new Date("2026-02-01T00:00:00Z");

  beforeEach(() => {
    jest.resetAllMocks();
    client = new TaskHubClient("localhost:50001");
  });

  it("encodes every create option", async () => {
    await client.createWorkflowSchedule("nightly", "report", "@daily", {
      input: { day: 1 },
      dueTime: due,
      expirationTime: expiry,
      repeats: 3,
      targetAppId: "other-app",
      targetAppNamespace: "other-ns",
      overwrite: true,
      skipMissed: true,
    });

    expect(mockClient.createWorkflowSchedule).toHaveBeenCalledWith(
      create(CreateWorkflowScheduleRequestSchema, {
        schedule: {
          name: "nightly",
          workflowName: "report",
          schedule: "@daily",
          input: '{"day":1}',
          dueTime: timestampFromDate(due),
          expirationTime: timestampFromDate(expiry),
          repeats: 3,
          targetAppID: "other-app",
          targetAppNamespace: "other-ns",
          skipMissed: true,
        },
        overwrite: true,
      }),
    );
  });

  it("sends serialized input as is and leaves unset options absent", async () => {
    await client.createWorkflowSchedule("raw", "report", "@every 5s", { serializedInput: "not json" });
    await client.createWorkflowSchedule("bare", "report", "@every 5s", { skipMissed: false });

    const [[raw], [bare]] = mockClient.createWorkflowSchedule.mock.calls;
    expect(raw.schedule.input).toBe("not json");
    expect(bare).toEqual(
      create(CreateWorkflowScheduleRequestSchema, {
        schedule: { name: "bare", workflowName: "report", schedule: "@every 5s" },
      }),
    );
    expect(bare.overwrite).toBe(false);
    expect(bare.schedule.input).toBeUndefined();
    expect(bare.schedule.repeats).toBeUndefined();
    expect(bare.schedule.skipMissed).toBeUndefined();
  });

  it("maps a schedule with its status and last run", async () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const next = new Date("2026-01-03T00:00:00Z");
    mockClient.getWorkflowSchedule.mockResolvedValueOnce(
      create(GetWorkflowScheduleResponseSchema, {
        schedule: {
          name: "nightly",
          workflowName: "report",
          schedule: "@daily",
          input: '{"day":1}',
          dueTime: timestampFromDate(due),
          repeats: 3,
          targetAppID: "other-app",
          skipMissed: true,
          status: {
            state: ProtoWorkflowScheduleState.ACTIVE,
            createdAt: timestampFromDate(created),
            nextRunTime: timestampFromDate(next),
            lastRunTime: timestampFromDate(due),
            runCount: 1,
            lastRun: {
              instanceId: "nightly_20260102T030405Z",
              runtimeStatus: OrchestrationStatus.FAILED,
              createdTimestamp: timestampFromDate(due),
              lastUpdatedTimestamp: timestampFromDate(next),
              output: '"partial"',
              failureDetails: { errorType: "Error", errorMessage: "boom" },
            },
          },
        },
      }),
    );

    const schedule = await client.getWorkflowSchedule("nightly");

    expect(mockClient.getWorkflowSchedule).toHaveBeenCalledWith(
      create(GetWorkflowScheduleRequestSchema, { name: "nightly" }),
    );
    expect(schedule).toMatchObject({
      name: "nightly",
      workflowName: "report",
      schedule: "@daily",
      serializedInput: '{"day":1}',
      dueTime: due,
      expirationTime: undefined,
      repeats: 3,
      targetAppId: "other-app",
      targetAppNamespace: undefined,
      skipMissed: true,
      status: {
        state: WorkflowScheduleState.ACTIVE,
        createdAt: created,
        nextRunTime: next,
        lastRunTime: due,
        runCount: 1,
        failureMessage: undefined,
        lastRun: {
          instanceId: "nightly_20260102T030405Z",
          runtimeStatus: WorkflowRuntimeStatus.FAILED,
          createdAt: due,
          lastUpdatedAt: next,
          serializedOutput: '"partial"',
        },
      },
    });
    expect(schedule.status?.lastRun?.failureDetails?.getErrorMessage()).toBe("boom");
  });

  it("maps a completed schedule whose last run cannot be read", async () => {
    mockClient.getWorkflowSchedule.mockResolvedValueOnce(
      create(GetWorkflowScheduleResponseSchema, {
        schedule: {
          name: "once",
          status: {
            state: ProtoWorkflowScheduleState.FAILED,
            runCount: 1,
            failureMessage: "workflow not found",
            lastRun: { instanceId: "once_20260102T030405Z" },
          },
        },
      }),
    );

    const { status, skipMissed } = await client.getWorkflowSchedule("once");

    expect(skipMissed).toBe(false);
    expect(status?.state).toBe(WorkflowScheduleState.FAILED);
    expect(status?.failureMessage).toBe("workflow not found");
    expect(status?.nextRunTime).toBeUndefined();
    expect(status?.lastRun).toEqual({ instanceId: "once_20260102T030405Z" });
  });

  it("lists a page of schedules", async () => {
    mockClient.listWorkflowSchedules.mockResolvedValueOnce(
      create(ListWorkflowSchedulesResponseSchema, {
        schedules: [create(WorkflowScheduleSchema, { name: "a" }), create(WorkflowScheduleSchema, { name: "b" })],
        continuationToken: "next",
      }),
    );

    const page = await client.listWorkflowSchedules({ pageSize: 2, continuationToken: "prev" });

    expect(mockClient.listWorkflowSchedules).toHaveBeenCalledWith(
      create(ListWorkflowSchedulesRequestSchema, { pageSize: 2, continuationToken: "prev" }),
    );
    expect(page.schedules.map((s) => s.name)).toEqual(["a", "b"]);
    expect(page.continuationToken).toBe("next");
  });

  it("deletes and triggers by name", async () => {
    mockClient.triggerWorkflowSchedule.mockResolvedValueOnce(
      create(TriggerWorkflowScheduleResponseSchema, { instanceId: "nightly_20260102T030405Z_manual" }),
    );

    await client.deleteWorkflowSchedule("nightly");
    await expect(client.triggerWorkflowSchedule("nightly")).resolves.toBe("nightly_20260102T030405Z_manual");

    expect(mockClient.deleteWorkflowSchedule).toHaveBeenCalledWith(
      create(DeleteWorkflowScheduleRequestSchema, { name: "nightly" }),
    );
    expect(mockClient.triggerWorkflowSchedule).toHaveBeenCalledWith(
      create(TriggerWorkflowScheduleRequestSchema, { name: "nightly" }),
    );
  });

  it.each([
    ["getWorkflowSchedule", Code.NotFound],
    ["deleteWorkflowSchedule", Code.NotFound],
    ["triggerWorkflowSchedule", Code.FailedPrecondition],
  ] as const)("preserves %s RPC error %s", async (method, code) => {
    const error = new ConnectError("schedule error", code);
    mockClient[method].mockRejectedValueOnce(error);

    await expect(client[method]("nightly")).rejects.toBe(error);
  });

  it("preserves create RPC errors", async () => {
    const error = new ConnectError("schedule exists", Code.AlreadyExists);
    mockClient.createWorkflowSchedule.mockRejectedValueOnce(error);

    await expect(client.createWorkflowSchedule("nightly", "report", "@daily")).rejects.toBe(error);
  });

  it("filters listed instance IDs by prefix", async () => {
    mockClient.listInstanceIDs.mockResolvedValueOnce(
      create(ListInstanceIDsResponseSchema, { instanceIds: ["nightly_20260102T030405Z"] }),
    );

    const page = await client.listWorkflowInstanceIds(undefined, undefined, "nightly_");

    expect(mockClient.listInstanceIDs).toHaveBeenCalledWith(
      create(ListInstanceIDsRequestSchema, { instanceIdPrefix: "nightly_" }),
    );
    expect(page.instanceIds).toEqual(["nightly_20260102T030405Z"]);
  });
});

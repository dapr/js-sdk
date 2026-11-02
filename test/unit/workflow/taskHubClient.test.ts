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
import {
  GetInstanceHistoryRequestSchema,
  GetInstanceHistoryResponseSchema,
  RerunWorkflowFromEventRequestSchema,
  RerunWorkflowFromEventResponseSchema,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import type { RerunWorkflowFromEventOptions } from "../../../src";
import { TaskHubClient } from "../../../src/workflow/engine";

const mockClient = {
  getInstanceHistory: jest.fn(),
  rerunWorkflowFromEvent: jest.fn(),
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

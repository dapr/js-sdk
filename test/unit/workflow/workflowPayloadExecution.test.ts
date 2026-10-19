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
import { Readable } from "node:stream";
import {
  BinaryStoreWorkflowPayloadResolver,
  PayloadReference,
  PayloadKind,
  PayloadWritePreference,
  WorkflowContext,
  WorkflowActivityContext,
  type BinaryStorePayloadOptions,
  type Task,
} from "../../../src";
import { OrchestrationExecutor, Registry } from "../../../src/workflow/engine";
import { ActivityExecutor } from "../../../src/workflow/engine";
import type { OrchestrationExecuteResult } from "../../../src/workflow/engine";
import { HistoryEventSchema } from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { OrchestrationStatus, TaskRouterSchema } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  newExecutionStartedEvent,
  newTaskScheduledEvent,
  newTaskCompletedEvent,
  newEventRaisedEvent,
  newTaskFailedEvent,
  newFailureDetails,
  newTimerCreatedEvent,
  newTimerFiredEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";
import { MemoryPayloadStore } from "../../utils/WorkflowPayloadTestUtils";

function output(result: OrchestrationExecuteResult) {
  const action = result.actions.find(
    (action) => action.workflowActionType.case === "completeWorkflow",
  )?.workflowActionType;
  if (action?.case !== "completeWorkflow") throw new Error("Expected completion");
  expect(action.value.workflowStatus).toBe(OrchestrationStatus.COMPLETED);
  return action.value.result;
}

describe("workflow payload execution and replay", () => {
  let store: MemoryPayloadStore;
  let registry: Registry;
  const payloads = (options: Partial<BinaryStorePayloadOptions> = {}) =>
    new BinaryStoreWorkflowPayloadResolver(store, { storeName: "store", ...options });
  const automatic = () => payloads({ writePreference: PayloadWritePreference.PreferReference, offloadThreshold: 1 });
  const execute = (resolver = payloads()) => new OrchestrationExecutor(registry, undefined, resolver);

  beforeEach(() => {
    store = new MemoryPayloadStore();
    registry = new Registry();
  });

  it("resolves workflow input and offloads only new activity actions, not replayed ones", async () => {
    const resolver = automatic();
    const input = await resolver.store({ value: 1 }, "id");
    registry.addNamedOrchestrator("test", function* (ctx, value) {
      expect(value).toEqual({ value: 1 });
      yield ctx.callActivity("echo", value);
      yield ctx.waitForExternalEvent("finish");
    });
    const start = newExecutionStartedEvent("test", "id", input.toEnvelope());
    const first = await execute(resolver).execute("id", [], [start]);
    const action = first.actions[0].workflowActionType;
    if (action.case !== "scheduleTask") throw new Error("Expected activity");
    expect(PayloadReference.parse(action.value.input)).toEqual(input);
    const writes = store.writes;
    const second = await execute(resolver).execute(
      "id",
      [start, newTaskScheduledEvent(1, "echo", action.value.input)],
      [newTaskCompletedEvent(1, input.toEnvelope())],
    );
    expect(second.actions).toHaveLength(0);
    expect(store.writes).toBe(writes + 1); // The unchanged custom status is content-addressed too.
    expect(store.files.size).toBe(2);
  });

  it("snapshots mutable inputs before user code can change them", async () => {
    registry.addNamedOrchestrator("test", function* (ctx) {
      const value = { count: 1 };
      const task = ctx.callActivity("echo", value);
      value.count = 2;
      yield task;
    });
    const resolver = automatic();
    const result = await execute(resolver).execute("id", [], [newExecutionStartedEvent("test", "id")]);
    const action = result.actions[0].workflowActionType;
    if (action.case !== "scheduleTask") throw new Error("Expected activity");
    expect(await resolver.resolve(PayloadReference.parse(action.value.input)!)).toEqual({ count: 1 });
  });

  it.each([false, true])(
    "materializes activity and child results or returns explicit references (%s)",
    async (resultAsReference) => {
      const resolver = payloads();
      const reference = await resolver.store({ value: 1 }, "id");
      registry.addNamedOrchestrator("test", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
        const activity = yield ctx.callActivity("echo", undefined, { resultAsReference });
        const child = yield ctx.callSubOrchestrator("child", undefined, "child-id", { resultAsReference });
        expect(activity instanceof PayloadReference).toBe(resultAsReference);
        expect(child instanceof PayloadReference).toBe(resultAsReference);
        return child;
      });
      const result = await execute(resolver).execute(
        "id",
        [
          newExecutionStartedEvent("test", "id"),
          newTaskScheduledEvent(1, "echo"),
          newTaskCompletedEvent(1, reference.toEnvelope()),
          create(HistoryEventSchema, {
            eventId: 2,
            eventType: {
              case: "childWorkflowInstanceCreated",
              value: { name: "child", instanceId: "child-id" },
            },
          }),
        ],
        [
          create(HistoryEventSchema, {
            eventType: {
              case: "childWorkflowInstanceCompleted",
              value: { taskScheduledId: 2, result: reference.toEnvelope() },
            },
          }),
        ],
      );
      expect(output(result)).toBe(resultAsReference ? reference.toEnvelope() : '{"value":1}');
      expect(store.reads).toBe(resultAsReference ? 0 : 1);
    },
  );

  it("makes payload resolution failures catchable by workflow code", async () => {
    const reference = await payloads().store(1, "id");
    store.files.clear();
    registry.addNamedOrchestrator("test", function* (ctx) {
      try {
        yield ctx.callActivity("echo");
      } catch (error) {
        expect(String(error)).toContain("not found");
        return "handled";
      }
    });
    const result = await execute().execute(
      "id",
      [newExecutionStartedEvent("test", "id"), newTaskScheduledEvent(1, "echo")],
      [newTaskCompletedEvent(1, reference.toEnvelope())],
    );
    expect(output(result)).toBe('"handled"');
  });

  it.each([false, true])("handles buffered and live reference events (%s)", async (buffered) => {
    const resolver = payloads();
    const reference = await resolver.store({ event: 1 }, "id");
    registry.addNamedOrchestrator("test", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      yield ctx.callActivity("echo");
      const ordinary = yield ctx.waitForExternalEvent("ordinary");
      const explicit = yield ctx.waitForExternalEvent("explicit", { asReference: true });
      expect(ordinary).toEqual({ event: 1 });
      expect(explicit).toEqual(reference);
      return explicit;
    });
    const raised = [
      newEventRaisedEvent("ordinary", reference.toEnvelope()),
      newEventRaisedEvent("explicit", reference.toEnvelope()),
    ];
    const result = await execute(resolver).execute(
      "id",
      [newExecutionStartedEvent("test", "id"), newTaskScheduledEvent(1, "echo")],
      buffered ? [...raised, newTaskCompletedEvent(1)] : [newTaskCompletedEvent(1), ...raised],
    );
    expect(output(result)).toBe(reference.toEnvelope());
    expect(store.reads).toBe(1);
  });

  it("preserves unconsumed reference events across continue-as-new without materializing them", async () => {
    const reference = await payloads().store("event", "id");
    registry.addNamedOrchestrator("test", function* (ctx) {
      yield ctx.callActivity("echo");
      ctx.continueAsNew({ iteration: 2 }, true);
    });
    const resolver = automatic();
    const result = await execute(resolver).execute(
      "id",
      [newExecutionStartedEvent("test", "id"), newTaskScheduledEvent(1, "echo")],
      [newEventRaisedEvent("pending", reference.toEnvelope()), newTaskCompletedEvent(1)],
    );
    const action = result.actions[0].workflowActionType;
    if (action.case !== "completeWorkflow") throw new Error("Expected continuation");
    expect(action.value.workflowStatus).toBe(OrchestrationStatus.CONTINUED_AS_NEW);
    expect(action.value.carryoverEvents[0].eventType).toMatchObject({
      case: "eventRaised",
      value: { input: reference.toEnvelope() },
    });
    expect(store.reads).toBe(0);
    expect(await resolver.resolve(PayloadReference.parse(action.value.result)!)).toEqual({ iteration: 2 });
  });

  it.each(["activity", "child", "detached"] as const)(
    "defaults cross-app %s inputs to inline and honors explicit permission",
    async (kind) => {
      for (const allowPayloadReferences of [false, true]) {
        const resolver = automatic();
        const reference = await resolver.store("input", "id");
        registry = new Registry();
        registry.addNamedOrchestrator("test", function* (ctx) {
          const options = { targetAppId: "remote", allowPayloadReferences };
          if (kind === "activity") yield ctx.callActivity("target", reference, options);
          else if (kind === "child") yield ctx.callSubOrchestrator("target", reference, "child", options);
          else {
            yield ctx.scheduleNewDetachedWorkflow("target", reference, "detached", undefined, options);
            yield ctx.waitForExternalEvent("hold");
          }
        });
        const start = newExecutionStartedEvent("test", "id");
        start.router = create(TaskRouterSchema, { sourceAppID: "local", targetAppID: "local" });
        const result = await execute(resolver).execute("id", [], [start]);
        const action = result.actions[0].workflowActionType;
        if (
          action.case !== "scheduleTask" &&
          action.case !== "createChildWorkflow" &&
          action.case !== "createDetachedWorkflow"
        ) {
          throw new Error("Expected input action");
        }
        expect(action.value.input).toBe(allowPayloadReferences ? reference.toEnvelope() : '"input"');
      }
    },
  );

  it("does not let cross-app permission override PreferInline", async () => {
    const resolver = payloads({ writePreference: PayloadWritePreference.PreferInline });
    const reference = await resolver.store("input", "id");
    registry.addNamedOrchestrator("test", function* (ctx) {
      yield ctx.callActivity("remote", reference, { targetAppId: "remote", allowPayloadReferences: true });
    });
    const start = newExecutionStartedEvent("test", "id");
    start.router = create(TaskRouterSchema, { sourceAppID: "local" });
    const result = await execute(resolver).execute("id", [], [start]);
    expect(result.actions[0].workflowActionType.value).toMatchObject({ input: '"input"' });
  });

  it.each(
    (["activity", "child", "detached"] as const).flatMap((kind) =>
      Object.values(PayloadWritePreference).flatMap((preference) =>
        ["local", "remote"].map((targetAppId) => ({ kind, preference, targetAppId })),
      ),
    ),
  )(
    "applies $preference to $kind inputs targeting $targetAppId without confusing permission with preference",
    async ({ kind, preference, targetAppId }) => {
      for (const allowPayloadReferences of [false, true]) {
        for (const referenceInput of [false, true]) {
          registry = new Registry();
          const resolver = payloads({
            writePreference: preference,
            offloadThreshold: 1,
            offloadSites: PayloadKind.ActivityInput | PayloadKind.ChildWorkflowInput | PayloadKind.WorkflowInput,
          });
          const document = { order: 123 };
          const reference = await resolver.store(document, "source");
          const input = referenceInput ? reference : document;
          const reads = store.reads;
          const writes = store.writes;
          registry.addNamedOrchestrator("test", function* (ctx) {
            const options = { targetAppId, allowPayloadReferences };
            if (kind === "activity") yield ctx.callActivity("target", input, options);
            else if (kind === "child") yield ctx.callSubOrchestrator("target", input, "child-id", options);
            else {
              yield ctx.scheduleNewDetachedWorkflow("target", input, "detached-id", undefined, options);
              yield ctx.waitForExternalEvent("hold");
            }
          });
          const start = newExecutionStartedEvent("test", "id");
          start.router = create(TaskRouterSchema, { sourceAppID: "local", targetAppID: "local" });
          const result = await execute(resolver).execute("id", [], [start]);
          const action = result.actions[0].workflowActionType;
          if (
            action.case !== "scheduleTask" &&
            action.case !== "createChildWorkflow" &&
            action.case !== "createDetachedWorkflow"
          ) {
            throw new Error("Expected scheduled input action");
          }
          const forcedInline = targetAppId !== "local" && !allowPayloadReferences;
          const sendReference =
            !forcedInline &&
            preference !== PayloadWritePreference.PreferInline &&
            (referenceInput || preference === PayloadWritePreference.PreferReference);
          const sent = PayloadReference.parse(action.value.input);
          expect(!!sent).toBe(sendReference);
          expect(store.reads - reads).toBe(referenceInput && !sendReference ? 1 : 0);
          expect(store.writes - writes).toBe(!referenceInput && sendReference ? 1 : 0);
          if (sendReference) {
            if (referenceInput) expect(action.value.input).toBe(reference.toEnvelope());
            expect(await resolver.resolve(sent!)).toEqual(document);
          } else {
            expect(action.value.input).toBe(JSON.stringify(document));
          }
        }
      }
    },
  );

  it("retains cross-app reference permission and result contracts on retries", async () => {
    const resolver = automatic();
    registry.addNamedOrchestrator("test", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      return yield ctx.callActivity("remote", "input", {
        targetAppId: "remote",
        allowPayloadReferences: true,
        resultAsReference: true,
        retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
      });
    });
    const start = newExecutionStartedEvent("test", "id");
    start.router = create(TaskRouterSchema, { sourceAppID: "local" });
    const failed = newTaskFailedEvent(1, newFailureDetails(new Error("retry")));
    const fireAt = new Date(Number(failed.timestamp!.seconds) * 1000 + 1000);
    const result = await execute(resolver).execute(
      "id",
      [start, newTaskScheduledEvent(1, "remote"), failed, newTimerCreatedEvent(2, fireAt)],
      [newTimerFiredEvent(2, fireAt)],
    );
    const action = result.actions[0].workflowActionType;
    if (action.case !== "scheduleTask") throw new Error("Expected retry activity");
    expect(PayloadReference.parse(action.value.input)).toBeDefined();
    expect(result.actions[0].id).toBe(3);
  });

  it("provides replay-scoped explicit read tasks without consuming durable sequence IDs", async () => {
    const resolver = payloads();
    const reference = await resolver.store({ value: 1 }, "id");
    const observations: Array<{ time: number; replaying: boolean }> = [];
    registry.addNamedOrchestrator(
      "test",
      function* (inner, input): Generator<Task<unknown>, unknown, unknown> {
        const ctx = new WorkflowContext(inner);
        expect(ctx.hasPayloadResolver()).toBe(true);
        expect(input).toBeInstanceOf(PayloadReference);
        const before = ctx.getCurrentUtcDateTime().getTime();
        const first = yield ctx.resolvePayload(reference);
        const second = yield ctx.resolvePayload(reference);
        expect(first).toEqual(second);
        expect(ctx.getCurrentUtcDateTime().getTime()).toBe(before);
        observations.push({ time: before, replaying: ctx.isReplaying() });
        yield ctx.callActivity("echo", first);
        return "done";
      },
      { inputAsReference: true },
    );
    const start = newExecutionStartedEvent("test", "id", reference.toEnvelope());
    const first = await execute(resolver).execute("id", [], [start]);
    expect(first.actions[0].id).toBe(1);
    const second = await execute(resolver).execute(
      "id",
      [start, newTaskScheduledEvent(1, "echo")],
      [newTaskCompletedEvent(1)],
    );
    expect(output(second)).toBe('"done"');
    expect(observations.map((o) => o.replaying)).toEqual([false, true]);
    expect(store.reads).toBe(2);
  });

  it("opens raw streams through explicit workflow read tasks", async () => {
    const resolver = payloads({ maxInMemoryRehydrationSize: 1 });
    const reference = await resolver.store("stream", "id");
    registry.addNamedOrchestrator("test", async function* (ctx): AsyncGenerator<Task<unknown>, unknown, unknown> {
      const stream = yield ctx.openPayload(reference);
      expect(stream).toBeInstanceOf(Readable);
      const chunks: Buffer[] = [];
      for await (const chunk of stream as Readable) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks).toString();
    });
    expect(output(await execute(resolver).execute("id", [], [newExecutionStartedEvent("test", "id")]))).toBe(
      '"\\"stream\\""',
    );
  });

  it("offloads workflow output, custom status, and sent events at their own sites", async () => {
    const resolver = automatic();
    registry.addNamedOrchestrator("test", function* (ctx) {
      ctx.setCustomStatus({ progress: 1 });
      ctx.sendEvent("receiver", "data", { event: 1 });
      yield ctx.waitForExternalEvent("finish");
      return { result: 1 };
    });
    const start = newExecutionStartedEvent("test", "id");
    const pending = await execute(resolver).execute("id", [], [start]);
    const sent = pending.actions[0].workflowActionType;
    if (sent.case !== "sendEvent") throw new Error("Expected event");
    expect(PayloadReference.parse(sent.value.data)?.key).toContain("/receiver/");
    expect(await resolver.resolve(PayloadReference.parse(pending.encodedCustomStatus)!)).toEqual({ progress: 1 });
    const completed = await execute(resolver).execute("id", [], [start, newEventRaisedEvent("finish")]);
    expect(await resolver.resolve(PayloadReference.parse(output(completed))!)).toEqual({ result: 1 });
  });

  it("uses ChildWorkflowOutput rather than WorkflowOutput for child results", async () => {
    const resolver = payloads({
      writePreference: PayloadWritePreference.PreferReference,
      offloadThreshold: 1,
      offloadSites: PayloadKind.ChildWorkflowOutput,
    });
    registry.addNamedOrchestrator("test", () => ({ child: true }));
    const start = newExecutionStartedEvent("test", "id");
    if (start.eventType.case !== "executionStarted") throw new Error("Expected start");
    start.eventType.value.parentInstance = {
      $typeName: "ParentInstanceInfo",
      taskScheduledId: 1,
      name: "parent",
      version: "",
      workflowInstance: undefined,
    };
    const result = await execute(resolver).execute("id", [], [start]);
    expect(PayloadReference.parse(output(result))).toBeDefined();
  });

  it("reports upload failures as workflow failures, never as successful inline outputs", async () => {
    registry.addNamedOrchestrator("test", () => ({ output: true }));
    jest.spyOn(store, "setBinaryFile").mockRejectedValue(new Error("store offline"));
    const result = await execute(automatic()).execute("id", [], [newExecutionStartedEvent("test", "id")]);
    expect(result.actions[0].workflowActionType.value).toMatchObject({
      workflowStatus: OrchestrationStatus.FAILED,
      failureDetails: { errorMessage: "store offline" },
    });
  });

  it("preserves activity reference contracts and exposes explicit storage to activities", async () => {
    const resolver = payloads();
    const reference = await resolver.store("input", "id");
    registry.addNamedActivity(
      "explicit",
      async (inner, input) => {
        const ctx = new WorkflowActivityContext(inner);
        expect(input).toEqual(reference);
        return ctx.payloads.store("output", ctx.getWorkflowInstanceId());
      },
      { inputAsReference: true },
    );
    const executor = new ActivityExecutor(registry, undefined, resolver);
    const result = PayloadReference.parse(await executor.execute("id", "explicit", 1, reference.toEnvelope()))!;
    expect(await resolver.resolve(result)).toBe("output");
    await expect(executor.execute("id", "explicit", 1, '"inline"')).rejects.toThrow("requires a PayloadReference");
    registry.addNamedActivity("ordinary", (_ctx, input) => input);
    expect(await executor.execute("id", "ordinary", 2, reference.toEnvelope())).toBe('"input"');
  });
});

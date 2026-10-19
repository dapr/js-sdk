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

import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import type { ChildWorkflowOptions, PropagatedHistory } from "../../../src";
import {
  HistoryPropagationScope,
  TaskRouterSchema,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import {
  HistoryEventSchema,
  PropagatedHistorySchema,
} from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { WorkflowActionSchema } from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";
import { OrchestrationRuntimeContext } from "../../../src/workflow/engine/context/OrchestrationRuntimeContext";
import { OrchestrationExecutor } from "../../../src/workflow/engine/worker/OrchestrationExecutor";
import { ActivityExecutor } from "../../../src/workflow/engine/worker/ActivityExecutor";
import { Registry } from "../../../src/workflow/engine/worker/Registry";
import {
  decodePropagatedHistory,
  newExecutionStartedEvent,
  newTaskScheduledEvent,
  newTaskCompletedEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";

declare module "../../../src/types/workflow/ChildWorkflowOptions.type" {
  interface ChildWorkflowOptions {
    customMetadata?: string;
  }
}

const history = create(PropagatedHistorySchema, {
  scope: HistoryPropagationScope.LINEAGE,
  chunks: ["root", "parent"].map((appId) => ({
    appId,
    instanceId: `${appId}-id`,
    workflowName: `${appId}-workflow`,
    rawEvents: [
      toBinary(HistoryEventSchema, newTaskScheduledEvent(1, "seed", '"input"')),
      toBinary(HistoryEventSchema, newTaskCompletedEvent(1, '"output"')),
    ],
    rawSignatures: [new Uint8Array([1, 2, 3])],
    signingCertChains: [new Uint8Array([4, 5, 6])],
  })),
});

describe("cross-app workflow tasks", () => {
  it("preserves declaration merging for child workflow options", () => {
    const options: ChildWorkflowOptions = {
      customMetadata: "consumer-defined",
      targetAppId: "destination",
      propagationScope: HistoryPropagationScope.LINEAGE,
      retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
    };
    const context = new OrchestrationRuntimeContext("parent", "source");
    new WorkflowContext(context).callChildWorkflow("remoteChild", undefined, undefined, options);
    expect(context.getActions()[0].router).toMatchObject({ sourceAppID: "source", targetAppID: "destination" });
  });

  it.each([HistoryPropagationScope.NONE, HistoryPropagationScope.OWN_HISTORY, HistoryPropagationScope.LINEAGE])(
    "serializes routing and propagation scope %s for activities and both child aliases",
    (propagationScope) => {
      const context = new OrchestrationRuntimeContext("parent-id", "source");
      const publicContext = new WorkflowContext(context);
      const options = { targetAppId: "destination", propagationScope };
      publicContext.callActivity("remoteActivity", { value: 42 }, options);
      publicContext.callChildWorkflow("remoteChild", { value: 42 }, "child-id", options);
      publicContext.callSubWorkflow("remoteChild", { value: 42 }, "sub-id", options);

      for (const action of context.getActions()) {
        const decoded = fromBinary(WorkflowActionSchema, toBinary(WorkflowActionSchema, action));
        expect(decoded.router).toMatchObject({ sourceAppID: "source", targetAppID: "destination" });
        expect(decoded.workflowActionType.value).toMatchObject({
          input: '{"value":42}',
        });
        if (
          decoded.workflowActionType.case === "scheduleTask" ||
          decoded.workflowActionType.case === "createChildWorkflow"
        ) {
          expect(decoded.workflowActionType.value.historyPropagationScope).toBe(propagationScope || undefined);
        }
      }
    },
  );

  it("keeps legacy calls local with no propagation, and supports local propagation", () => {
    const context = new OrchestrationRuntimeContext("parent");
    context.callActivity("local");
    context.callSubOrchestrator("localChild");
    context.callActivity("localHistory", undefined, { propagationScope: HistoryPropagationScope.OWN_HISTORY });
    const actions = context.getActions();
    expect(actions.every((action) => action.router === undefined)).toBe(true);
    expect(actions[0].workflowActionType.value).not.toHaveProperty("historyPropagationScope");
    expect(actions[1].workflowActionType.value).not.toHaveProperty("historyPropagationScope");
    expect(actions[2].workflowActionType.value).toMatchObject({
      historyPropagationScope: HistoryPropagationScope.OWN_HISTORY,
    });
  });

  it.each(["activity", "child"])("preserves routing and scope on every %s retry", (kind) => {
    const context = new OrchestrationRuntimeContext("parent", "source");
    const options = {
      targetAppId: "destination",
      propagationScope: HistoryPropagationScope.LINEAGE,
      retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
    };
    if (kind === "activity") context.callActivity("remote", undefined, options);
    else context.callSubOrchestrator("remote", undefined, "child", options);
    const original = context.getActions()[0];
    options.targetAppId = "mutated";
    options.propagationScope = HistoryPropagationScope.NONE;
    context._pendingActions = {};
    context._pendingTasks[1].fail("retry");
    context._pendingActions = {};
    context._pendingTasks[2].complete(undefined);
    const retry = context.getActions()[0];
    expect(retry.router).toEqual(original.router);
    expect(retry.workflowActionType.value).toMatchObject({ historyPropagationScope: HistoryPropagationScope.LINEAGE });
  });

  it("rejects invalid routing or scope before allocating tasks", () => {
    const context = new OrchestrationRuntimeContext("parent", "source");
    expect(() => context.callActivity("remote", undefined, { targetAppId: " " })).toThrow("targetAppId");
    expect(() =>
      context.callSubOrchestrator("remote", undefined, undefined, { propagationScope: 99 as HistoryPropagationScope }),
    ).toThrow("propagationScope");
    expect(() =>
      new OrchestrationRuntimeContext("parent").callActivity("remote", undefined, { targetAppId: "target" }),
    ).toThrow("calling app ID");
    expect(context.getActions()).toEqual([]);
    expect(context._pendingTasks).toEqual({});
  });

  it.each(["target", "source", "request"])(
    "recovers the calling app from %s routing metadata on replay",
    async (source) => {
      const registry = new Registry();
      registry.addNamedOrchestrator("parent", function* (context) {
        yield context.callActivity("seed");
        yield context.callActivity("remote", undefined, { targetAppId: "destination" });
      });
      const start = newExecutionStartedEvent("parent", "parent-id");
      const router = create(TaskRouterSchema, {
        sourceAppID: "caller",
        targetAppID: source === "target" ? "current" : undefined,
      });
      if (source !== "request") start.router = router;
      const old = [start, newTaskScheduledEvent(1, "seed")];
      const next = [newTaskCompletedEvent(1)];
      const executor = new OrchestrationExecutor(registry);
      const first = await executor.execute("parent-id", old, next, source === "request" ? router : undefined);
      const replay = await executor.execute(
        "parent-id",
        [...old, ...next],
        [newTaskScheduledEvent(2, "remote")],
        router,
      );
      expect(first.actions[0].router).toMatchObject({
        sourceAppID: source === "target" ? "current" : "caller",
        targetAppID: "destination",
      });
      expect(replay.actions).toEqual([]);
    },
  );
});

describe("received propagated history", () => {
  it("exports history views only as types, not public constructors or decoders", async () => {
    const sdk = await import("../../../src");
    expect(sdk).not.toHaveProperty("PropagatedHistory");
    expect(sdk).not.toHaveProperty("PropagatedHistoryEntry");
    expect(sdk).not.toHaveProperty("decodePropagatedHistory");
  });

  it("decodes ordered chunks without losing original signed bytes", () => {
    const received: PropagatedHistory = decodePropagatedHistory(history)!;
    expect(received.scope).toBe(HistoryPropagationScope.LINEAGE);
    expect(received.chunks.map((chunk) => chunk.appId)).toEqual(["root", "parent"]);
    expect(received.chunks[0]).toMatchObject({
      instanceId: "root-id",
      workflowName: "root-workflow",
      rawEvents: history.chunks[0].rawEvents,
      rawSignatures: history.chunks[0].rawSignatures,
      signingCertChains: history.chunks[0].signingCertChains,
    });
    expect(received.chunks[0].events[1].eventType).toMatchObject({
      case: "taskCompleted",
      value: { result: '"output"' },
    });
  });

  it.each([undefined, create(PropagatedHistorySchema), history])(
    "exposes incoming history on public workflow and activity contexts",
    async (incoming) => {
      const registry = new Registry();
      const expected = decodePropagatedHistory(incoming);
      registry.addNamedOrchestrator("receiver", (context) => {
        expect(new WorkflowContext(context).getPropagatedHistory()).toEqual(expected);
        return { result: "workflow-result" };
      });
      registry.addNamedActivity("receiver", (context) => {
        expect(new WorkflowActivityContext(context).getPropagatedHistory()).toEqual(expected);
        return "activity-result";
      });
      const workflow = await new OrchestrationExecutor(registry).execute(
        "id",
        [],
        [newExecutionStartedEvent("receiver", "id")],
        undefined,
        incoming,
      );
      expect(workflow.actions[0].workflowActionType.value).toMatchObject({ result: '{"result":"workflow-result"}' });
      expect(await new ActivityExecutor(registry).execute("id", "receiver", 1, undefined, incoming)).toBe(
        '"activity-result"',
      );
    },
  );

  it("surfaces corrupt history as a workflow or activity failure rather than dropping it", async () => {
    const corrupt = create(PropagatedHistorySchema, { chunks: [{ rawEvents: [new Uint8Array([255])] }] });
    const registry = new Registry();
    registry.addNamedOrchestrator("receiver", () => "should not run");
    registry.addNamedActivity("receiver", () => "should not run");
    const result = await new OrchestrationExecutor(registry).execute(
      "id",
      [],
      [newExecutionStartedEvent("receiver", "id")],
      undefined,
      corrupt,
    );
    expect(result.actions[0].workflowActionType.value).toHaveProperty("failureDetails");
    await expect(new ActivityExecutor(registry).execute("id", "receiver", 1, undefined, corrupt)).rejects.toThrow();
  });
});

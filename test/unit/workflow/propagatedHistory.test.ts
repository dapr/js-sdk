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

import { create, toBinary } from "@bufbuild/protobuf";
import { HistoryPropagationScope, WorkflowActivityContext, WorkflowContext } from "../../../src";
import type { PropagatedHistory, PropagatedHistoryEntry, PropagatedHistoryView } from "../../../src";
import {
  HistoryEventSchema,
  PropagatedHistorySchema,
} from "../../../src/proto/dapr/proto/durabletask/v1/history_events_pb";
import { ActivityContext } from "../../../src/workflow/engine";
import { OrchestrationRuntimeContext } from "../../../src/workflow/engine";
import { decodePropagatedHistory, newTaskCompletedEvent } from "../../../src/workflow/engine/worker/protoHelpers";

function fixture() {
  const chunks: PropagatedHistoryEntry[] = [
    { appId: "payments", instanceId: "root", workflowName: "payment", events: [newTaskCompletedEvent(1, '"root"')] },
    { appId: "audit", instanceId: "empty", workflowName: "audit", events: [] },
    {
      appId: "payments",
      instanceId: "parent",
      workflowName: "payment",
      events: [newTaskCompletedEvent(1, '"parent-1"'), newTaskCompletedEvent(2, '"parent-2"')],
    },
  ].map((chunk) => {
    const events = chunk.events.map((event, index) => ({ ...event, eventId: index + 1 }));
    return {
      ...chunk,
      events,
      rawEvents: events.map((event) => toBinary(HistoryEventSchema, event)),
      rawSignatures: [new Uint8Array([1, 2, 3])],
      signingCertChains: [new Uint8Array([4, 5, 6])],
    };
  });
  // Existing consumers can still construct the original two-property interface.
  const legacy: PropagatedHistory = { scope: HistoryPropagationScope.LINEAGE, chunks };
  const message = create(PropagatedHistorySchema, {
    scope: legacy.scope,
    chunks: chunks.map((chunk) => ({
      appId: chunk.appId,
      instanceId: chunk.instanceId,
      workflowName: chunk.workflowName,
      rawEvents: [...chunk.rawEvents],
      rawSignatures: [...chunk.rawSignatures],
      signingCertChains: [...chunk.signingCertChains],
    })),
  });
  return { legacy, message, view: decodePropagatedHistory(message)! };
}

describe("propagated history views", () => {
  it("flattens events in ancestor order without interpreting colliding event IDs", () => {
    const { view } = fixture();
    expect(view.events).toEqual(view.chunks.flatMap((chunk) => chunk.events));
    expect(view.events.map((event) => event.eventId)).toEqual([1, 1, 2]);
    expect(view.events[0]).toBe(view.chunks[0].events[0]);
    expect(view.appIDs).toEqual(["payments", "audit"]);
  });

  it("indexes workflows into flattened events, including ancestors with no events", () => {
    const { view } = fixture();
    expect(view.workflows.map(({ startEventIndex, eventCount }) => ({ startEventIndex, eventCount }))).toEqual([
      { startEventIndex: 0, eventCount: 1 },
      { startEventIndex: 1, eventCount: 0 },
      { startEventIndex: 1, eventCount: 2 },
    ]);
    for (const workflow of view.workflows) {
      expect(view.events.slice(workflow.startEventIndex, workflow.startEventIndex + workflow.eventCount)).toEqual(
        workflow.events,
      );
    }
    expect(view.getWorkflowByName("payment")).toMatchObject({ instanceId: "root", startEventIndex: 0, eventCount: 1 });
    expect(view.getWorkflowByName("audit")).toMatchObject({ instanceId: "empty", eventCount: 0 });
  });

  it("filters all matching chunks, preserving order and disambiguating instances", () => {
    const { view } = fixture();
    expect(view.getEventsByAppID("payments")).toEqual(view.events);
    expect(view.getEventsByInstanceID("parent")).toEqual(view.chunks[2].events);
    expect(view.getEventsByInstanceID("root")).toEqual(view.chunks[0].events);
    expect(view.getEventsByWorkflowName("payment")).toEqual(view.events);
    expect(view.getEventsByWorkflowName("audit")).toEqual([]);
    expect(view.getEventsByAppID("audit")).toEqual([]);
  });

  it("returns null for missing workflow names and empty arrays for unmatched filters", () => {
    const { view } = fixture();
    for (const name of ["missing", "", "Payment", "__proto__"]) {
      expect(view.getWorkflowByName(name)).toBeNull();
      expect(view.getEventsByAppID(name)).toEqual([]);
      expect(view.getEventsByInstanceID(name)).toEqual([]);
      expect(view.getEventsByWorkflowName(name)).toEqual([]);
    }
  });

  it.each([HistoryPropagationScope.NONE, HistoryPropagationScope.OWN_HISTORY, HistoryPropagationScope.LINEAGE])(
    "preserves scope %s and signed bytes without rewriting or verifying them",
    (scope) => {
      const { message } = fixture();
      message.scope = scope;
      const original = toBinary(PropagatedHistorySchema, message);
      const view = decodePropagatedHistory(message)!;
      expect(view.scope).toBe(scope);
      expect(view.chunks[0].rawEvents).toBe(message.chunks[0].rawEvents);
      expect(view.chunks[0].rawSignatures).toBe(message.chunks[0].rawSignatures);
      expect(view.chunks[0].signingCertChains).toBe(message.chunks[0].signingCertChains);
      view.getWorkflowByName("payment");
      view.getEventsByAppID("payments");
      view.getEventsByInstanceID("parent");
      view.getEventsByWorkflowName("payment");
      expect(toBinary(PropagatedHistorySchema, message)).toEqual(original);
    },
  );

  it.each(["workflow", "activity"])("enriches legacy history supplied to a public %s context", (kind) => {
    const { legacy } = fixture();
    const context =
      kind === "workflow"
        ? new WorkflowContext(new OrchestrationRuntimeContext("id", undefined, legacy))
        : new WorkflowActivityContext(new ActivityContext("id", 1, legacy));
    const received: PropagatedHistoryView = context.getPropagatedHistory()!;
    const compatible: PropagatedHistory = received;
    expect(compatible.scope).toBe(legacy.scope);
    expect(compatible.chunks).toBe(legacy.chunks);
    expect(received.getEventsByInstanceID("parent")).toEqual(legacy.chunks[2].events);
    expect(Object.keys(legacy)).toEqual(["scope", "chunks"]);
    expect({ ...received }).toEqual(legacy);
  });

  it("does not add public runtime constructors or view factories", async () => {
    const sdk = await import("../../../src");
    expect(sdk).not.toHaveProperty("PropagatedHistoryView");
    expect(sdk).not.toHaveProperty("HistoryView");
    expect(sdk).not.toHaveProperty("createPropagatedHistoryView");
  });

  it("reuses decoded views across both contexts and keeps absent history undefined", () => {
    const { view } = fixture();
    const workflow = new WorkflowContext(new OrchestrationRuntimeContext("id", undefined, view));
    const activity = new WorkflowActivityContext(new ActivityContext("id", 1, view));
    expect(workflow.getPropagatedHistory()).toBe(view);
    expect(activity.getPropagatedHistory()).toBe(view);
    expect(new WorkflowContext(new OrchestrationRuntimeContext("id")).getPropagatedHistory()).toBeUndefined();
    expect(new WorkflowActivityContext(new ActivityContext("id", 1)).getPropagatedHistory()).toBeUndefined();
    expect(decodePropagatedHistory()).toBeUndefined();
    expect(decodePropagatedHistory(create(PropagatedHistorySchema))).toBeUndefined();
  });

  it("supports a received chunk containing no events", () => {
    const view = decodePropagatedHistory(create(PropagatedHistorySchema, { chunks: [{ workflowName: "empty" }] }))!;
    expect(view.events).toEqual([]);
    expect(view.getWorkflowByName("empty")).toMatchObject({ startEventIndex: 0, eventCount: 0 });
  });
});

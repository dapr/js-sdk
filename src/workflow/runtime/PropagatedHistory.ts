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

import type { HistoryEvent } from "../../proto/dapr/proto/durabletask/v1/history_events_pb";
import type { HistoryPropagationScope } from "../../proto/dapr/proto/durabletask/v1/orchestration_pb";

/** One ancestor's history, in execution order. Signatures are not verified by the SDK. */
export interface PropagatedHistoryEntry {
  readonly appId: string;
  readonly instanceId: string;
  readonly workflowName: string;
  readonly events: readonly HistoryEvent[];
  readonly rawEvents: readonly Uint8Array[];
  readonly rawSignatures: readonly Uint8Array[];
  readonly signingCertChains: readonly Uint8Array[];
}

/** History shared by the caller, ordered oldest ancestor first, immediate parent last. */
export interface PropagatedHistory {
  readonly scope: HistoryPropagationScope;
  readonly chunks: readonly PropagatedHistoryEntry[];
}

/** The SDK-provided history view, with lookups over all ancestor chunks. */
export interface PropagatedHistoryView extends PropagatedHistory {
  readonly events: readonly HistoryEvent[];
  readonly appIDs: readonly string[];
  readonly workflows: readonly (PropagatedHistoryEntry & {
    readonly startEventIndex: number;
    readonly eventCount: number;
  })[];
  /** Returns the oldest matching ancestor, or null when the name is absent. */
  getWorkflowByName(name: string): PropagatedHistoryView["workflows"][number] | null;
  getEventsByAppID(appId: string): readonly HistoryEvent[];
  getEventsByInstanceID(instanceId: string): readonly HistoryEvent[];
  /** Includes every matching instance when a workflow name occurs more than once. */
  getEventsByWorkflowName(name: string): readonly HistoryEvent[];
}

class HistoryView implements PropagatedHistoryView {
  readonly scope: HistoryPropagationScope;
  readonly chunks: readonly PropagatedHistoryEntry[];

  constructor(history: PropagatedHistory) {
    this.scope = history.scope;
    this.chunks = history.chunks;
  }

  get events(): readonly HistoryEvent[] {
    return this.chunks.flatMap((chunk) => chunk.events);
  }

  get appIDs(): readonly string[] {
    return [...new Set(this.chunks.map((chunk) => chunk.appId))];
  }

  get workflows(): PropagatedHistoryView["workflows"] {
    let startEventIndex = 0;
    return this.chunks.map((chunk) => {
      const workflow = { ...chunk, startEventIndex, eventCount: chunk.events.length };
      startEventIndex += chunk.events.length;
      return workflow;
    });
  }

  getWorkflowByName(name: string): PropagatedHistoryView["workflows"][number] | null {
    return this.workflows.find((workflow) => workflow.workflowName === name) ?? null;
  }

  getEventsByAppID(appId: string): readonly HistoryEvent[] {
    return this.chunks.filter((chunk) => chunk.appId === appId).flatMap((chunk) => chunk.events);
  }

  getEventsByInstanceID(instanceId: string): readonly HistoryEvent[] {
    return this.chunks.filter((chunk) => chunk.instanceId === instanceId).flatMap((chunk) => chunk.events);
  }

  getEventsByWorkflowName(name: string): readonly HistoryEvent[] {
    return this.chunks.filter((chunk) => chunk.workflowName === name).flatMap((chunk) => chunk.events);
  }
}

export function createPropagatedHistoryView(history?: PropagatedHistory): PropagatedHistoryView | undefined {
  return history === undefined || history instanceof HistoryView ? history : new HistoryView(history);
}

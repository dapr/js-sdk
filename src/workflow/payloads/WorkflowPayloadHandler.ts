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

import type { IDaprSerializer } from "../../serialization/IDaprSerializer";
import { deserializeWorkflowValue } from "../../serialization/Serialization.util";
import type { WorkflowAction } from "../../proto/dapr/proto/durabletask/v1/orchestrator_actions_pb";
import { OrchestrationStatus } from "../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import type { BinaryStoreWorkflowPayloadResolver } from "./BinaryStoreWorkflowPayloadResolver";
import { PayloadReference } from "./PayloadReference";
import { PayloadKind, PayloadSite } from "./BinaryStorePayloadOptions";
import { PayloadNotResolvableError } from "./PayloadErrors";

/** One handler per orchestration execution; never share its cache across replay or instances. */
export class WorkflowPayloadHandler {
  readonly inlineInputs = new Map<number, boolean>();
  readonly referenceResults = new Set<number>();
  private readonly cache = new Map<string, { read: Promise<string>; size: number }>();
  private cachedBytes = 0;

  constructor(
    readonly resolver?: BinaryStoreWorkflowPayloadResolver,
    readonly serializer?: IDaprSerializer,
    private readonly cacheReads = false,
  ) {}

  async read(wire?: string, asReference = false, signal?: AbortSignal): Promise<unknown> {
    signal?.throwIfAborted();
    if (wire === undefined || wire === "") return undefined;
    const reference = PayloadReference.parse(wire);
    if (asReference) {
      if (!reference)
        throw new TypeError("The receiving contract requires a PayloadReference, but the payload is inline");
      return reference;
    }
    return deserializeWorkflowValue(
      reference ? await this.resolveSerialized(reference, signal) : wire,
      this.serializer,
    );
  }

  async resolveSerialized(reference: PayloadReference, signal?: AbortSignal): Promise<string> {
    signal?.throwIfAborted();
    if (!this.resolver) throw new PayloadNotResolvableError();
    const key = reference.toEnvelope();
    const cached = this.cache.get(key);
    if (cached) return cached.read;
    const read = this.resolver.resolveSerialized(reference, signal);
    const { resolutionCacheSize: capacity, resolutionCacheBytes: budget } = this.resolver.options;
    // Both bounds apply: the entry count keeps lookups cheap, the byte budget keeps replay memory predictable.
    if (this.cacheReads && capacity && reference.size <= budget) {
      while (this.cache.size >= capacity || this.cachedBytes + reference.size > budget) {
        this.evict(this.cache.keys().next().value!);
      }
      this.cache.set(key, { read, size: reference.size });
      this.cachedBytes += reference.size;
    }
    try {
      return await read;
    } catch (error) {
      this.evict(key);
      throw error;
    }
  }

  private evict(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;
    this.cache.delete(key);
    this.cachedBytes -= entry.size;
  }

  async encode(wire: string | undefined, site: PayloadSite, signal?: AbortSignal): Promise<string | undefined> {
    signal?.throwIfAborted();
    if (this.resolver) return this.resolver.encode(wire, site, signal);
    if (site.requireInline && PayloadReference.parse(wire)) throw new PayloadNotResolvableError();
    return wire;
  }

  async encodeActions(actions: WorkflowAction[], instanceId: string, isChild: boolean): Promise<void> {
    for (const action of actions) {
      const value = action.workflowActionType;
      const requireInline = this.inlineInputs.get(action.id) ?? false;
      switch (value.case) {
        case "scheduleTask":
          value.value.input = await this.encode(value.value.input, {
            kind: PayloadKind.ActivityInput,
            instanceId,
            requireInline,
          });
          break;
        case "createChildWorkflow":
          value.value.input = await this.encode(value.value.input, {
            kind: PayloadKind.ChildWorkflowInput,
            instanceId: value.value.instanceId,
            requireInline,
          });
          break;
        case "createDetachedWorkflow":
          value.value.input = await this.encode(value.value.input, {
            kind: PayloadKind.WorkflowInput,
            instanceId: value.value.instanceId,
            requireInline,
          });
          break;
        case "sendEvent":
          value.value.data = await this.encode(value.value.data, {
            kind: PayloadKind.ExternalEvent,
            instanceId: value.value.instance?.instanceId ?? instanceId,
          });
          break;
        case "completeWorkflow":
          if (
            value.value.workflowStatus === OrchestrationStatus.COMPLETED ||
            value.value.workflowStatus === OrchestrationStatus.CONTINUED_AS_NEW
          ) {
            value.value.result = await this.encode(value.value.result, {
              kind:
                value.value.workflowStatus === OrchestrationStatus.CONTINUED_AS_NEW
                  ? PayloadKind.ContinueAsNewInput
                  : isChild
                  ? PayloadKind.ChildWorkflowOutput
                  : PayloadKind.WorkflowOutput,
              instanceId,
            });
          }
          break;
      }
    }
  }
}

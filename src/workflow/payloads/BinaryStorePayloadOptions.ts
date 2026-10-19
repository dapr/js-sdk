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

import type { PayloadReference } from "./PayloadReference";

export enum PayloadWritePreference {
  Preserve = "preserve",
  PreferReference = "preferReference",
  PreferInline = "preferInline",
}

export enum PayloadKind {
  None = 0,
  WorkflowInput = 1 << 0,
  WorkflowOutput = 1 << 1,
  ActivityInput = 1 << 2,
  ActivityOutput = 1 << 3,
  ExternalEvent = 1 << 4,
  ContinueAsNewInput = 1 << 5,
  CustomStatus = 1 << 6,
  ChildWorkflowInput = 1 << 7,
  ChildWorkflowOutput = 1 << 8,
  All = (1 << 9) - 1,
}

export interface PayloadSite {
  kind: PayloadKind;
  instanceId: string;
  name?: string;
  requireInline?: boolean;
}

/** Supply a durable, idempotent implementation when explicit payload cleanup is required. */
export interface IWorkflowPayloadManifest {
  record(instanceId: string, reference: PayloadReference, signal?: AbortSignal): Promise<void>;
  list(instanceId: string, signal?: AbortSignal): Promise<readonly PayloadReference[]>;
  clear(instanceId: string, signal?: AbortSignal): Promise<void>;
}

export interface BinaryStorePayloadOptions {
  storeName: string;
  /** Defaults to "workflow-payloads". */
  keyPrefix?: string;
  /** Defaults to Preserve. Reads are independent of the future-write policy. */
  writePreference?: PayloadWritePreference;
  /** Bitwise combination of PayloadKind values. Defaults to All. */
  offloadSites?: PayloadKind;
  /** Minimum UTF-8 byte count, inclusive. Defaults to 64 KiB; null offloads every nonempty snapshot. */
  offloadThreshold?: number | null;
  skipWriteIfExists?: boolean;
  /** Defaults to 16 MiB. Checked against both the envelope and bytes actually received. */
  maxInMemoryRehydrationSize?: number;
  verifyIntegrityOnRead?: boolean;
  /** Per-orchestrator-execution cache; zero disables it. Defaults to 128. */
  resolutionCacheSize?: number;
  manifest?: IWorkflowPayloadManifest;
}

/** JavaScript needs an explicit reference contract because generic types are erased at runtime. */
export interface WorkflowPayloadRegistrationOptions {
  inputAsReference?: boolean;
}

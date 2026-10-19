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

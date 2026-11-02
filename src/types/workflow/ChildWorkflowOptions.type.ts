/*
Copyright 2022 The Dapr Authors
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

import type { RetryPolicy } from "./RetryPolicy.type";
import type { HistoryPropagationScope } from "../../proto/dapr/proto/durabletask/v1/orchestration_pb";

export interface ChildWorkflowOptions {
  /** Allow reference inputs at a cross-app boundary; destination must support and access the store. */
  allowPayloadReferences?: boolean;
  /** Receive the top-level result as a PayloadReference instead of buffering it. */
  resultAsReference?: boolean;
  retryPolicy?: RetryPolicy;
  /** Destination Dapr app ID. Omit to run in the calling application. */
  targetAppId?: string;
  /** Ancestor history to share with the callee. Defaults to NONE. */
  propagationScope?: HistoryPropagationScope;
}

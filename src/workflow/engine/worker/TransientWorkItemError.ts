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

import { Code, ConnectError } from "@connectrpc/connect";

/**
 * A work item hit infrastructure that may recover (for example, the binary store was unreachable while
 * offloading a payload). The work item is released for redelivery instead of failing the workflow; because
 * payload keys are content-addressed, a re-executed turn reuses any blobs the failed attempt already wrote.
 */
export class TransientWorkItemError extends Error {
  constructor(message: string, readonly cause: unknown) {
    super(message);
    this.name = "TransientWorkItemError";
  }
}

const NON_RETRYABLE_CODES: ReadonlySet<Code> = new Set([
  Code.InvalidArgument,
  Code.NotFound,
  Code.AlreadyExists,
  Code.PermissionDenied,
  Code.FailedPrecondition,
  Code.OutOfRange,
  Code.Unimplemented,
  Code.Unauthenticated,
]);

/** Whether retrying an RPC can change its outcome. Unknown error shapes are treated as retryable. */
export function isRetryableRpcError(error: unknown): boolean {
  return !(error instanceof ConnectError && NON_RETRYABLE_CODES.has(error.code));
}

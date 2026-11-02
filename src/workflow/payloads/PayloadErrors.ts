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

export class PayloadNotResolvableError extends Error {
  constructor() {
    super("Binary store payload support is not configured; supply WorkflowClientOptions.payloads");
    this.name = "PayloadNotResolvableError";
  }
}

export class PayloadNotFoundError extends Error {
  constructor(readonly reference: PayloadReference, readonly cause: unknown) {
    super(`Workflow payload '${reference.storeName}/${reference.key}' was not found`);
    this.name = "PayloadNotFoundError";
  }
}

export class PayloadIntegrityError extends Error {
  constructor(readonly reference: PayloadReference, readonly actualHash: string) {
    super(
      `SHA-256 mismatch for workflow payload '${reference.key}': expected ${reference.contentHash}, got ${actualHash}`,
    );
    this.name = "PayloadIntegrityError";
  }
}

export class PayloadRehydrationLimitError extends Error {
  constructor(readonly reference: PayloadReference, readonly limit: number) {
    super(
      `Workflow payload '${reference.key}' exceeds the in-memory rehydration limit of ${limit} bytes; use openPayload or open`,
    );
    this.name = "PayloadRehydrationLimitError";
  }
}

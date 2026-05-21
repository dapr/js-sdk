/*
Copyright 2023 The Dapr Authors
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

/**
 * Options for raising external events to workflow instances.
 *
 * Controls how event payloads are serialized when sending events via
 * {@link DaprWorkflowClient.raiseEvent}.
 *
 * @example
 * ```typescript
 * const client = new DaprWorkflowClient();
 * await client.raiseEvent(
 *   "order-workflow-123",
 *   "PaymentReceived",
 *   { amount: 99.99, transactionId: "tx-456" },
 *   { eventContentType: "application/json" }
 * );
 * ```
 *
 * @see {@link DaprWorkflowClient.raiseEvent}
 * @see {@link WorkflowContext.waitForExternalEvent}
 */
export type WorkflowRaiseOptions = {
  /**
   * MIME type of the event payload.
   *
   * Specifies how the event data should be serialized. Common values:
   * - "application/json" - JSON serialization (default, auto-detected)
   * - "text/plain" - Plain text
   * - "application/octet-stream" - Binary data
   *
   * If omitted, the content type is inferred from the payload type.
   *
   * @default undefined (auto-detected from payload)
   */
  eventContentType?: string;
};

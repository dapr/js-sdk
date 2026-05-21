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

import { KeyValueType } from "../KeyValue.type";

/**
 * Options for scheduling workflow instances.
 *
 * Controls how workflow input is serialized and specifies additional
 * workflow-specific options when starting orchestrations via
 * {@link DaprWorkflowClient.scheduleNewWorkflow}.
 *
 * @example
 * ```typescript
 * const client = new DaprWorkflowClient();
 * const instanceId = await client.scheduleNewWorkflow(
 *   orderWorkflow,
 *   { orderId: "order-123", amount: 99.99 },
 *   "order-instance-123",
 *   undefined,
 *   { contentType: "application/json", workflowOptions: { priority: "high" } }
 * );
 * ```
 *
 * @see {@link DaprWorkflowClient.scheduleNewWorkflow}
 */
export type WorkflowStartOptions = {
  /**
   * MIME type of the workflow input payload.
   *
   * Specifies how the input data should be serialized and deserialized.
   * Common values:
   * - "application/json" - JSON serialization (default, auto-detected)
   * - "text/plain" - Plain text
   * - "application/octet-stream" - Binary data
   *
   * If omitted, the content type is automatically inferred from the input value.
   *
   * @default undefined (auto-detected from input)
   */
  contentType?: string;

  /**
   * gRPC-specific workflow options.
   *
   * Custom key-value metadata passed to the workflow orchestration.
   * Only applicable when using gRPC communication with the sidecar.
   * HTTP communication ignores this field.
   *
   * Useful for passing runtime configuration, feature flags, or priority information
   * to the workflow orchestrator.
   *
   * @default undefined
   */
  workflowOptions?: KeyValueType;
};

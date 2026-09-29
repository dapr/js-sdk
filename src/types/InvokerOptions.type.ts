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

import { KeyValueType } from "./KeyValue.type";

/**
 * Configuration options for service-to-service invocation.
 *
 * When invoking methods on other services, these options control request behavior
 * such as headers and HTTP verb customization. These options apply to HTTP invocations;
 * they are ignored when using the gRPC protocol.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/service-invocation/ | Dapr Service Invocation}
 *
 * @example
 * ```typescript
 * const options: InvokerOptions = {
 *   headers: {
 *     "x-correlation-id": "req-123",
 *     "x-request-source": "order-service"
 *   }
 * };
 * const result = await client.invoker.invoke("payment-service", "ProcessPayment", {
 *   body: { orderId: "ORD-001", amount: 99.99 },
 *   httpMethod: "POST",
 *   metadata: options.headers
 * });
 * ```
 */
export type InvokerOptions = {
  /**
   * Custom HTTP headers to include in the service invocation request.
   * These headers are passed through to the invoked service method.
   * Ignored when using the gRPC communication protocol.
   *
   * @example
   * ```typescript
   * {
   *   "x-correlation-id": "abc-123",
   *   "authorization": "Bearer token-xyz"
   * }
   * ```
   */
  headers?: KeyValueType;
};

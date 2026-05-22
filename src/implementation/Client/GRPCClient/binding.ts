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

import { create } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import { InvokeBindingRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientBinding from "../../../interfaces/Client/IClientBinding";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { KeyValueType } from "../../../types/KeyValue.type";

/**
 * gRPC-based output bindings building block implementation.
 *
 * Output bindings invoke external systems through the Dapr sidecar.
 * This implementation uses gRPC for efficient communication with binding connectors.
 *
 * Supported binding types include databases, message queues, webhooks, and more.
 * Bindings allow sending data to external systems without maintaining direct connections.
 *
 * @implements {IClientBinding}
 * @see {@link https://docs.dapr.io/reference/api/bindings_api/} Dapr Bindings API
 * @see {@link DaprClient.binding} for unified API
 *
 * @internal
 */
export default class GRPCClientBinding implements IClientBinding {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC output binding building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Sends a request to an output binding.
   *
   * Invokes the named binding with the specified operation and data.
   * The binding connector determines how the operation is interpreted
   * (e.g., "create" for databases, "send" for message queues).
   *
   * @param bindingName - Name of the binding to invoke
   * @param operation - Binding-specific operation identifier
   * @param data - Data to send (automatically serialized)
   * @param metadata - Optional metadata key-value pairs (default: {})
   *
   * @returns Promise resolving to response object with data and metadata
   *
   * @throws Rejects if binding does not exist, operation fails, or gRPC call fails
   *
   * @example
   * ```typescript
   * // Send data to a database binding
   * const response = await client.binding.send(
   *   "mydb",
   *   "create",
   *   { id: 1, name: "Alice", city: "San Francisco" },
   *   { table: "users" }
   * );
   * // response: { data: ..., metadata: { table: "users" }, operation: "create" }
   *
   * // Send message to a message queue binding
   * await client.binding.send(
   *   "mqbinding",
   *   "send",
   *   { message: "Hello World" }
   * );
   * ```
   *
   * @see {@link https://docs.dapr.io/reference/api/bindings_api/#invoking-output-bindings}
   */
  async send(bindingName: string, operation: string, data: any, metadata: KeyValueType = {}): Promise<object> {
    const req: any = { name: bindingName, operation, metadata: metadata ?? {} };

    if (data) {
      const serialized = SerializerUtil.serializeGrpc(data);
      req.data = serialized.serializedData;
    }

    const client = await this.client.getClient();
    const res = await client.invokeBinding(create(InvokeBindingRequestSchema, req));

    return {
      data: res.data,
      metadata: res.metadata,
      operation,
    };
  }
}


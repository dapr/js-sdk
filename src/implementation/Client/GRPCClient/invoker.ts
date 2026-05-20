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
import { AnySchema } from "@bufbuild/protobuf/wkt";
import GRPCClient from "./GRPCClient";

import { HttpMethod } from "../../../enum/HttpMethod.enum";
import { HTTPExtensionSchema, InvokeRequestSchema } from "../../../proto/dapr/proto/common/v1/common_pb";
import { InvokeServiceRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import IClientInvoker from "../../../interfaces/Client/IClientInvoker";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { InvokerOptions } from "../../../types/InvokerOptions.type";

/**
 * gRPC-based service invocation building block implementation.
 *
 * Enables service-to-service invocation (often called remote procedure calls).
 * Routes calls through the Dapr sidecar for service discovery, routing, and retry logic.
 *
 * Supports both gRPC and HTTP method semantics through HTTP extension headers.
 *
 * @implements {IClientInvoker}
 * @see {@link https://docs.dapr.io/reference/api/service_invocation_api/} Dapr Service Invocation API
 * @see {@link DaprClient.invoker} for unified API
 *
 * @internal
 */
export default class GRPCClientInvoker implements IClientInvoker {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC service invocation building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Invokes a method on a remote service.
   *
   * Sends an invoke request through the Dapr sidecar to another service.
   * The sidecar handles service discovery and routing based on the app ID.
   * Automatically serializes/deserializes request and response data.
   *
   * @param appId - ID of the target service (as configured in Dapr)
   * @param methodName - Name of the method to invoke
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.) (default: GET)
   * @param data - Request data to send to the method (default: {})
   * @param _options - Optional invocation options (reserved for future use)
   *
   * @returns Promise resolving to the parsed JSON response from the remote service
   *
   * @throws Rejects if:
   *   - Service with appId does not exist
   *   - Method invocation fails
   *   - Response cannot be parsed as JSON
   *
   * @example
   * ```typescript
   * // Invoke another service
   * const result = await client.invoker.invoke(
   *   "order-service",
   *   "getOrder",
   *   HttpMethod.GET,
   *   { orderId: 123 }
   * );
   * // result: { orderId: 123, total: 99.99, items: [...] }
   *
   * // Simple POST with data
   * await client.invoker.invoke(
   *   "notification-service",
   *   "sendEmail",
   *   HttpMethod.POST,
   *   { to: "user@example.com", subject: "Hello" }
   * );
   * ```
   *
   * @see {@link https://docs.dapr.io/reference/api/service_invocation_api/#invoking-a-service}
   */
  async invoke(
    appId: string,
    methodName: string,
    method: HttpMethod = HttpMethod.GET,
    data: object = {},
    _options: InvokerOptions = {},
  ): Promise<object> {
    const httpExtension = create(HTTPExtensionSchema, {
      verb: HttpVerbUtil.convertHttpVerbStringToNumber(method),
    });

    const { serializedData, contentType } = SerializerUtil.serializeGrpc(data);
    const msgSerialized = create(AnySchema, { value: serializedData });

    const msgInvoke = create(InvokeRequestSchema, {
      method: methodName,
      httpExtension,
      data: msgSerialized,
      contentType,
    });

    const msgInvokeService = create(InvokeServiceRequestSchema, {
      id: appId,
      message: msgInvoke,
    });

    const client = await this.client.getClient();
    const res = await client.invokeService(msgInvokeService);

    let resData = "";

    if (res.data) {
      resData = Buffer.from(res.data.value).toString();
    }

    try {
      return JSON.parse(resData);
    } catch (e) {
      throw new Error(
        JSON.stringify({
          error: "COULD_NOT_PARSE_RESULT",
          error_msg: `Could not parse the returned resultset: ${resData}`,
        }),
      );
    }
  }
}


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

import Class from "../../../types/Class";
import IClientProxy from "../../../interfaces/Client/IClientProxy";
import HTTPClient from "./HTTPClient";
import { HTTPNotSupportedError } from "../../../errors/HTTPNotSupportedError";

/**
 * HTTP proxy wrapper for service-to-service invocation.
 *
 * Provides a proxy interface for invoking remote services through the Dapr sidecar.
 * HTTP protocol does not support proxy creation, so all methods throw HTTPNotSupportedError.
 *
 * For gRPC-based proxy support, use {@link GRPCClientProxy} instead.
 *
 * @implements {IClientProxy}
 *
 * @internal
 */
export default class HTTPClientProxy implements IClientProxy {
  /**
   * Reference to the underlying HTTP client.
   */
  client: HTTPClient;

  /**
   * Creates an HTTP proxy wrapper.
   *
   * @param client - The HTTP client instance
   */
  constructor(client: HTTPClient) {
    this.client = client;
  }

  /**
   * Creates a type-safe proxy for service-to-service invocation.
   *
   * **Not supported for HTTP protocol.** The Dapr HTTP API does not support
   * typed proxy creation. Service-to-service calls must be made via the HTTP API directly.
   *
   * @typeParam T - The service interface type (unused for HTTP)
   * @param _cls - The service class/interface to proxy
   * @param _clientOptions - Optional proxy configuration (unused for HTTP)
   *
   * @returns Never - Always throws HTTPNotSupportedError
   *
   * @throws {@link HTTPNotSupportedError} Always - proxy is not supported over HTTP
   *
   * @example
   * ```typescript
   * // This will throw HTTPNotSupportedError
   * try {
   *   const proxy = await client.proxy.create(MyService);
   * } catch (err) {
   *   // err instanceof HTTPNotSupportedError
   *   // Use gRPC client instead or call HTTP API directly
   * }
   * ```
   *
   * @see {@link GRPCClientProxy} for gRPC-based proxy support
   * @see {@link DaprClient.proxy} for unified API
   */
  async create<T>(_cls: Class<T>, _clientOptions?: Record<string, unknown>): Promise<T> {
    throw new HTTPNotSupportedError();
  }
}


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

import { HttpMethod } from "../../enum/HttpMethod.enum";
import { InvokerOptions } from "../../types/InvokerOptions.type";

/**
 * Dapr client interface for Service-to-Service invocation.
 * Provides methods to invoke methods on other services via Dapr service invocation building block.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/service-invocation/
 */
export default interface IClientInvoker {
  /**
   * Invokes a method on a remote service.
   *
   * @param appId - The Dapr app ID of the target service.
   * @param methodName - The name or path of the method to invoke on the target service.
   * @param method - The HTTP method to use for the invocation (GET, POST, PUT, DELETE, etc.).
   * @param data - Optional request payload. Objects are JSON serialized automatically.
   * @param options - Optional invocation options (timeout, metadata, etc.).
   * @returns A promise that resolves to the response from the remote service.
   *
   * @example
   * ```ts
   * const result = await client.invoker.invoke(
   *   "user-service",
   *   "getUserById",
   *   HttpMethod.GET,
   *   undefined,
   *   { timeout: 5000 }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/service_invocation_api/
   */
  invoke(
    appId: string,
    methodName: string,
    method: HttpMethod,
    data?: object,
    options?: InvokerOptions,
  ): Promise<object>;
}

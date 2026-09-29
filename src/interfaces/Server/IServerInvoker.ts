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

import { DaprInvokerCallbackFunction } from "../../types/DaprInvokerCallback.type";
import { InvokerListenOptionsType } from "../../types/InvokerListenOptions.type";

/**
 * Dapr server interface for Service Invocation.
 * Provides methods to register method handlers for incoming service-to-service invocations.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/service-invocation/
 */
export default interface IServerInvoker {
  /**
   * Registers a handler for incoming method invocations from other services.
   *
   * @param methodName - The method name that will be invoked by remote services.
   * This corresponds to the methodName parameter used in client.invoker.invoke().
   * @param cb - Callback function to handle the method invocation.
   * Receives request data and should return a response.
   * @param options - Optional listener options (e.g., HTTP verb, response type).
   * @returns A promise that resolves when the method handler is registered.
   *
   * @example
   * ```ts
   * await server.invoker.listen(
   *   "getUserById",
   *   async (request) => {
   *     const userId = request.userId;
   *     return { id: userId, name: "John Doe" };
   *   }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/service_invocation_api/
   */
  listen(methodName: string, cb: DaprInvokerCallbackFunction, options?: InvokerListenOptionsType): Promise<any>;
}

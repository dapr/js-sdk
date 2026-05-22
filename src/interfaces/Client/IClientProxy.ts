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

import Class from "../../types/Class";

/**
 * Dapr client interface for creating service invocation proxies.
 * Allows creation of typed proxies for remote service method invocation.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/service-invocation/
 */
export default interface IClientProxy {
  /**
   * Creates a strongly-typed proxy for a remote service.
   * The proxy transparently handles serialization and routing to the remote service via Dapr.
   *
   * @typeParam T - The interface or class type representing the remote service API.
   * @param cls - The class or interface representing the remote service methods.
   * @param clientOptions - Optional client-specific options passed to the proxy (e.g., invocation options).
   * @returns A promise that resolves to a proxy instance that implements the provided service interface.
   *
   * @example
   * ```ts
   * interface UserService {
   *   getUser(id: string): Promise<{ id: string; name: string }>;
   *   updateUser(id: string, user: any): Promise<void>;
   * }
   *
   * const userServiceProxy = await client.proxy.create<UserService>(UserService);
   * const user = await userServiceProxy.getUser("user-123");
   * ```
   *
   * @see https://docs.dapr.io/reference/api/service_invocation_api/
   */
  create<T>(cls: Class<T>, clientOptions?: Record<string, unknown>): Promise<T>;
}

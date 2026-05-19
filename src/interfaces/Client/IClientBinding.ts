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

/**
 * Dapr client interface for Output Bindings.
 * Provides methods to send data to external systems via Dapr output bindings.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/bindings/
 */
export default interface IClientBinding {
  /**
   * Sends data to an output binding.
   *
   * @param bindingName - The name of the output binding component to invoke.
   * @param operation - The operation or action to perform on the binding (e.g., "create", "delete", "invoke").
   * Component-specific; consult binding documentation.
   * @param data - The payload to send. Objects are JSON serialized automatically.
   * @param metadata - Optional component-specific metadata passed to the binding provider.
   * @returns A promise that resolves to the response from the binding (implementation-specific).
   *
   * @example
   * ```ts
   * const response = await client.binding.send(
   *   "myKafkaBinding",
   *   "publish",
   *   { message: "Hello, World!" }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/bindings_api/
   */
  send(bindingName: string, operation: string, data: any, metadata?: object): Promise<object>;
}

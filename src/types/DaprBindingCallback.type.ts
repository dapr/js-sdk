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
 * Callback function signature for handling incoming binding invocations.
 *
 * This callback is invoked when the Dapr sidecar receives a message from an input binding.
 * The handler receives the binding data and must process it asynchronously, returning
 * void or a response value. If the handler throws an error, the binding invocation fails.
 *
 * @param data - The message payload from the binding. Can be any type depending on the binding component.
 * @returns Promise that resolves when binding processing is complete. Can return void or any response value.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/bindings/ | Dapr Input/Output Bindings}
 *
 * @example
 * ```typescript
 * // Simple binding handler
 * const bindingHandler: TypeDaprBindingCallback = async (data) => {
 *   console.log("Received binding data:", data);
 *   if (typeof data === 'string') {
 *     const parsed = JSON.parse(data);
 *     await processOrder(parsed);
 *   }
 * };
 *
 * // Register with server
 * server.binding.subscribe("kafka-binding", bindingHandler);
 * ```
 */
export type TypeDaprBindingCallback = (data: any) => Promise<any | void>;

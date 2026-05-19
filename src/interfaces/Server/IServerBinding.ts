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

import { TypeDaprBindingCallback } from "../../types/DaprBindingCallback.type";

/**
 * Dapr server interface for Input Bindings.
 * Provides methods to subscribe to events from external systems via Dapr input bindings.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/bindings/
 */
export default interface IServerBinding {
  /**
   * Registers a handler for incoming messages from an input binding.
   *
   * @param bindingName - The name of the input binding component to listen to.
   * @param cb - Callback function to handle messages from the binding.
   * The callback receives the incoming message data and should return a response.
   * @returns A promise that resolves when the binding handler is registered.
   *
   * @example
   * ```ts
   * await server.binding.receive(
   *   "myKafkaBinding",
   *   (message) => {
   *     console.log("Received:", message);
   *     return { status: "processed" };
   *   }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/bindings_api/
   */
  receive(bindingName: string, cb: TypeDaprBindingCallback): Promise<any>;
}

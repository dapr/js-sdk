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

import GRPCClient from "./GRPCClient";
import IClientActorBuilder from "../../../interfaces/Client/IClientActorBuilder";
import ActorProxyBuilder from "../../../actors/client/ActorProxyBuilder";
import Class from "../../../types/Class";
import ActorId from "../../../actors/ActorId";

/**
 * gRPC-based actor building block implementation.
 *
 * Provides actor proxy creation for virtual actor patterns. Actors are stateful,
 * re-entrant objects with built-in timers and reminders. This implementation
 * uses gRPC for efficient communication with actor instances on the Dapr sidecar.
 *
 * @implements {IClientActorBuilder}
 * @see {@link https://docs.dapr.io/reference/api/actors_api/} Dapr Actors API
 * @see {@link DaprClient.actor} for unified API
 *
 * @internal
 */
export default class GRPCClientActor implements IClientActorBuilder {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC actor building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Creates an actor proxy for invoking actor methods.
   *
   * Returns a proxy instance of the specified actor type with a randomly generated ID.
   * The proxy forwards method calls to the Dapr sidecar's actor runtime.
   *
   * **Note:** ActorTypeClass is required because JavaScript's type information is erased at runtime.
   * Unlike TypeScript's compile-time generics, we cannot instantiate T directly, so the class
   * must be passed explicitly.
   *
   * @typeParam T - The actor class type
   * @param actorTypeClass - The actor class (required for runtime instantiation)
   *
   * @returns A proxy instance of type T with a random actor ID
   *
   * @throws Throws if actor class is invalid or proxy builder fails
   *
   * @example
   * ```typescript
   * class MyActor {
   *   async doSomething(value: string): Promise<string> {
   *     return `Processed: ${value}`;
   *   }
   * }
   *
   * const actor = client.actor.create(MyActor);
   * const result = await actor.doSomething("test");
   * ```
   *
   * @see {@link ActorProxyBuilder} for proxy implementation details
   */
  create<T>(actorTypeClass: Class<T>): T {
    const builder = new ActorProxyBuilder<T>(
      actorTypeClass,
      this.client.options.daprHost,
      this.client.options.daprPort,
      this.client.options.communicationProtocol,
      this.client.options,
    );
    const actor = builder.build(ActorId.createRandomId());
    return actor;
  }
}


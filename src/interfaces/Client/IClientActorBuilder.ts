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
 * Builder interface for creating actor proxies.
 * Used to instantiate client-side proxy objects that wrap actor communication.
 */
export default interface IClientActor {
  /**
   * Creates a strongly-typed proxy instance for actor communication.
   * The proxy handles serialization and remoting of method calls to the actual actor instance.
   *
   * @typeParam T - The actor interface or class type to create a proxy for.
   * @param actorTypeClass - The class or interface representing the actor type.
   * @returns A proxy instance that implements the provided actor interface.
   *
   * @example
   * ```ts
   * interface UserActor {
   *   getId(): Promise<string>;
   *   setName(name: string): Promise<void>;
   * }
   *
   * const actor = client.actor.create<UserActor>(UserActor);
   * const id = await actor.getId();
   * ```
   *
   * @see https://docs.dapr.io/developing-applications/building-blocks/actors/
   */
  create<T>(actorTypeClass: Class<T>): T;
}

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

import AbstractActor from "../../actors/runtime/AbstractActor";
import Class from "../../types/Class";

/**
 * Dapr server interface for Actor runtime.
 * Provides methods to register and manage actor types for incoming actor invocations.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/actors/
 */
export default interface IServerActor {
  /**
   * Registers an actor type with the server.
   * The actor class will handle incoming method invocations for that actor type.
   *
   * @typeParam T - The actor class type extending AbstractActor.
   * @param cls - The actor class to register. Must extend AbstractActor.
   * @returns A promise that resolves when the actor type is registered.
   *
   * @example
   * ```ts
   * class UserActor extends AbstractActor {
   *   async updateProfile(profile: any) {
   *     // actor logic
   *   }
   * }
   *
   * await server.actor.registerActor(UserActor);
   * ```
   *
   * @see https://docs.dapr.io/developing-applications/building-blocks/actors/
   */
  registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void>;

  /**
   * Retrieves a list of all registered actor type names.
   * Useful for debugging and monitoring which actors are available.
   *
   * @returns A promise that resolves to an array of registered actor type names.
   *
   * @see https://docs.dapr.io/developing-applications/building-blocks/actors/
   */
  getRegisteredActors(): Promise<string[]>;

  /**
   * Initializes the actor runtime.
   * Must be called before the server starts to ensure actors are ready to receive invocations.
   *
   * @returns A promise that resolves when the actor runtime is initialized.
   *
   * @see https://docs.dapr.io/developing-applications/building-blocks/actors/
   */
  init(): Promise<void>;

  // deactivateActor(actorType: string, actorId: string): Promise<void>;
}

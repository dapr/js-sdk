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

import ActorId from "../../actors/ActorId";
import { ActorReminderType } from "../../types/ActorReminder.type";
import { ActorTimerType } from "../../types/ActorTimer.type";
import { KeyValueType } from "../../types/KeyValue.type";
import { OperationType } from "../../types/Operation.type";

/**
 * Dapr client interface for Actor interactions.
 * Provides methods to invoke actor methods, manage state, and register reminders and timers.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/actors/
 */
export default interface IClientActor {
  /**
   * Invokes a method on a specific actor instance.
   *
   * @param actorType - The actor type registered in the Dapr runtime.
   * @param actorId - The unique identifier for the actor instance.
   * @param methodName - The name of the method to invoke on the actor.
   * @param body - Optional payload to pass to the actor method. Will be JSON serialized.
   * @returns A promise that resolves to the actor method's response.
   *
   * @example
   * ```ts
   * const response = await client.actor.invoke(
   *   "userActor",
   *   new ActorId("user-123"),
   *   "updateProfile",
   *   { name: "John", age: 30 }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/actors_api/
   */
  invoke(actorType: string, actorId: ActorId, methodName: string, body?: any): Promise<object>;

  /**
   * Performs a transactional state update for an actor.
   * Allows atomic multi-key operations on actor state.
   *
   * @param actorType - The actor type registered in the Dapr runtime.
   * @param actorId - The unique identifier for the actor instance.
   * @param operations - Array of state operations (upsert, delete) to apply transactionally.
   * @returns A promise that resolves when the transaction completes.
   *
   * @see https://docs.dapr.io/reference/api/actors_api/#transactional-state
   */
  stateTransaction(actorType: string, actorId: ActorId, operations: OperationType[]): Promise<void>;

  /**
   * Retrieves a single state value for an actor.
   *
   * @param actorType - The actor type registered in the Dapr runtime.
   * @param actorId - The unique identifier for the actor instance.
   * @param key - The state key to retrieve.
   * @returns A promise that resolves to the state value (KeyValueType or string), or undefined if not found.
   *
   * @see https://docs.dapr.io/reference/api/actors_api/#get-actor-state
   */
  stateGet(actorType: string, actorId: ActorId, key: string): Promise<KeyValueType | string>;

  /**
   * Registers a reminder for an actor.
   * The reminder will trigger the actor's reminder handler at the specified interval.
   *
   * @param actorType - The actor type registered in the Dapr runtime.
   * @param actorId - The unique identifier for the actor instance.
   * @param name - A unique name for the reminder.
   * @param reminder - Configuration for the reminder (period, due time, data).
   * @returns A promise that resolves when the reminder is registered.
   *
   * @example
   * ```ts
   * await client.actor.registerActorReminder(
   *   "userActor",
   *   new ActorId("user-123"),
   *   "dailyCheck",
   *   {
   *     period: "PT1M",      // 1 minute
   *     dueTime: "PT1M",
   *     data: { checkType: "daily" }
   *   }
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/actors_api/#reminders
   */
  registerActorReminder(actorType: string, actorId: ActorId, name: string, reminder: ActorReminderType): Promise<void>;

  /**
   * Unregisters a previously registered actor reminder.
   *
   * @param actorType - The actor type registered in the Dapr runtime.
   * @param actorId - The unique identifier for the actor instance.
   * @param name - The name of the reminder to unregister.
   * @returns A promise that resolves when the reminder is unregistered.
   *
   * @see https://docs.dapr.io/reference/api/actors_api/#reminders
   */
  unregisterActorReminder(actorType: string, actorId: ActorId, name: string): Promise<void>;

  /**
   * Registers a timer for an actor.
   * The timer will trigger the actor's timer handler at the specified interval.
   *
   * @param actorType - The actor type registered in the Dapr runtime.
   * @param actorId - The unique identifier for the actor instance.
   * @param name - A unique name for the timer.
   * @param timer - Configuration for the timer (period, callback, data).
   * @returns A promise that resolves when the timer is registered.
   *
   * @see https://docs.dapr.io/reference/api/actors_api/#timers
   */
  registerActorTimer(actorType: string, actorId: ActorId, name: string, timer: ActorTimerType): Promise<void>;

  /**
   * Unregisters a previously registered actor timer.
   *
   * @param actorType - The actor type registered in the Dapr runtime.
   * @param actorId - The unique identifier for the actor instance.
   * @param name - The name of the timer to unregister.
   * @returns A promise that resolves when the timer is unregistered.
   *
   * @see https://docs.dapr.io/reference/api/actors_api/#timers
   */
  unregisterActorTimer(actorType: string, actorId: ActorId, name: string): Promise<void>;

  /**
   * Retrieves a summary of all active actor instances across all actor types.
   *
   * @returns A promise that resolves to an object containing actor summary information.
   *
   * @see https://docs.dapr.io/reference/api/actors_api/
   */
  getActors(): Promise<object>;
}

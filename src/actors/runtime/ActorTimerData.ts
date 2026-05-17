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

import BufferSerializer from "./BufferSerializer";

/**
 * Configuration and metadata for an ephemeral actor timer.
 *
 * Timers are non-durable, recurring callbacks that exist only for the lifetime of the
 * current actor activation. Unlike reminders, timers are not persisted and are lost on
 * actor deactivation or failover. Timers are useful for ephemeral state management,
 * cleanup tasks, and timeout-based logic.
 *
 * ActorTimerData encapsulates the complete timer specification. It is created during
 * actor timer registration and managed by the actor runtime. The current implementation
 * supports basic timer scheduling with dueTime and period. Future enhancements may add
 * time-to-live (TTL) and jitter support.
 *
 * @remarks
 * Timers have the following lifecycle:
 * - Registered via {@link AbstractActor#registerActorTimer}
 * - Stored in memory, not persisted to the Dapr state store
 * - Fired at (dueTime) initially, then every (period) interval (if period > 0)
 * - Automatically cancelled if the actor is deactivated
 * - Unregistered via {@link AbstractActor#unregisterActorTimer}
 *
 * The timer callback method receives the state data passed during registration and
 * the callback method name to invoke. The callback is routed through the actor's
 * method invocation system as a direct method call.
 *
 * @example
 * ```typescript
 * // Register a timer that fires after 1 second, then every 3 seconds,
 * // calling the "onTimer" method with custom state
 * const timer = new ActorTimerData(
 *   "cleanup-timer",
 *   "onTimer",
 *   1000,    // dueTime: 1 second
 *   3000,    // period: 3 seconds
 *   { sessionId: "sess-456" }
 * );
 * ```
 */
export default class ActorTimerData {
  /**
   * The user-defined name of this timer, unique within the actor instance.
   */
  readonly timerName: string;

  /**
   * Application-defined state data passed to the timer callback method.
   * Can be a JSON-serializable object or string.
   */
  readonly state: string | object | undefined;

  /**
   * The name of the callback method to invoke when the timer fires.
   * This method must exist on the actor implementation.
   */
  readonly callback: string;

  /**
   * Constructs an ActorTimerData instance.
   *
   * Note: The current implementation only supports basic timing with dueTime and period.
   * Time-to-live (TTL) and period are managed by the ActorManager, not this class.
   *
   * @param timerName - The name of the timer, unique within this actor.
   * @param callback - The name of the callback method to invoke.
   * @param state - Optional state data to be passed to the callback.
   *
   * @example
   * ```typescript
   * new ActorTimerData("session-timeout", "onSessionTimeout", { sessionId: "x" });
   * ```
   */
  constructor(timerName: string, callback: string, state?: string | object | undefined) {
    this.timerName = timerName;
    this.callback = callback;
    this.state = state;
  }

  /**
   * Retrieves the timer name.
   *
   * @returns The unique timer identifier within this actor.
   */
  getTimerName(): string {
    return this.timerName;
  }

  /**
   * Retrieves the timer state data.
   *
   * @returns The state passed during registration, or undefined if no state.
   */
  getState(): string | object | undefined {
    return this.state;
  }

  /**
   * Retrieves the callback method name.
   *
   * @returns The method name to be invoked when the timer fires.
   */
  getCallback(): string {
    return this.callback;
  }

  /**
   * Converts this timer to a serializable object representation.
   *
   * Used internally for marshaling timer data during method invocation and
   * for passing to the timer callback handler.
   *
   * @returns An object with fields: callback, data.
   *
   * @internal
   */
  toObject(): object {
    return {
      callback: this.callback,
      data: this.state,
    };
  }

  /**
   * Reconstructs an ActorTimerData from a serialized object representation.
   *
   * Deserializes the state data using BufferSerializer to convert from Buffer
   * or JSON format to JavaScript values.
   *
   * @param timerName - The timer name.
   * @param obj - The serialized timer object (typically from actor runtime).
   * @returns A new ActorTimerData instance.
   *
   * @internal
   */
  static fromObject(timerName: string, obj: any): ActorTimerData {
    const serializer = new BufferSerializer();

    const callback = obj?.callback;
    const data = obj?.data;

    const deserializedData = serializer.deserialize(data);

    return new ActorTimerData(timerName, callback, deserializedData);
  }
}

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
 * Configuration and metadata for a persistent actor reminder.
 *
 * Reminders are durable, recurring callbacks that survive actor deactivation and failover.
 * Unlike timers, reminders persist in the Dapr state store and are replayed across restarts.
 * The reminder will fire at regular intervals specified by `period` after the initial delay.
 *
 * ActorReminderData encapsulates the complete reminder specification and is created during
 * actor reminder registration. It may be serialized/deserialized for transport through the
 * Dapr runtime.
 *
 * @remarks
 * Reminders have the following lifecycle:
 * - Registered via {@link AbstractActor#registerActorReminder}
 * - Persisted in the Dapr state store
 * - Fired at (dueTime) initially, then every (period) interval
 * - Expire and are deleted after (ttl) duration if specified
 * - Unregistered via {@link AbstractActor#unregisterActorReminder}
 *
 * The reminder callback method receives the state data passed during registration.
 * By default, this calls the actor's `receiveReminder()` method.
 *
 * @example
 * ```typescript
 * // Register a reminder that fires after 2 seconds, then every 5 seconds,
 * // expires after 1 minute, with custom state data
 * const reminder = new ActorReminderData(
 *   "payment-reminder",
 *   2000,     // dueTime: 2 seconds
 *   5000,     // period: 5 seconds
 *   60000,    // ttl: 60 seconds
 *   { accountId: "user-123", amount: 99.99 }
 * );
 * ```
 */
export default class ActorReminderData {
  /**
   * The user-defined name of this reminder, unique within the actor instance.
   */
  readonly reminderName: string;

  /**
   * Application-defined state data passed to the reminder callback.
   * Can be a JSON-serializable object or string.
   */
  readonly state: string | object | undefined;

  /**
   * Initial delay in milliseconds before the first reminder firing.
   */
  readonly dueTime: number;

  /**
   * Optional time-to-live in milliseconds. After this duration from registration,
   * the reminder is automatically deleted and will not fire again.
   */
  readonly ttl: number | undefined;

  /**
   * Recurrence interval in milliseconds between successive reminder firings
   * after the initial due time.
   */
  readonly period: number;

  /**
   * Constructs an ActorReminderData instance.
   *
   * @param reminderName - The name of the reminder, unique within this actor.
   * @param dueTime - Initial delay in milliseconds before first firing.
   * @param period - Interval in milliseconds between subsequent firings.
   * @param ttl - Optional time-to-live in milliseconds. If specified, the reminder
   *              is automatically deleted after this duration.
   * @param state - Optional state data to be passed to the reminder callback.
   *
   * @example
   * ```typescript
   * new ActorReminderData("check-balance", 5000, 10000, 300000, { threshold: 100 });
   * ```
   */
  constructor(reminderName: string, dueTime: number, period: number, ttl?: number, state?: string | object) {
    this.reminderName = reminderName;
    this.dueTime = dueTime;
    this.ttl = ttl;
    this.period = period;
    this.state = state;
  }

  /**
   * Retrieves the reminder name.
   *
   * @returns The unique reminder identifier within this actor.
   */
  getReminderName(): string {
    return this.reminderName;
  }

  /**
   * Retrieves the reminder state data.
   *
   * @returns The state passed during registration, or undefined.
   */
  getState(): string | object | undefined {
    return this.state;
  }

  /**
   * Retrieves the initial delay before first firing.
   *
   * @returns The due time in milliseconds.
   */
  getDueTime(): number {
    return this.dueTime;
  }

  /**
   * Retrieves the time-to-live duration.
   *
   * @returns The TTL in milliseconds, or undefined if no expiration.
   */
  getTtl(): number | undefined {
    return this.ttl;
  }

  /**
   * Retrieves the recurrence interval.
   *
   * @returns The period in milliseconds between successive firings.
   */
  getPeriod(): number {
    return this.period;
  }

  /**
   * Converts this reminder to a serializable object representation.
   *
   * Used internally for marshaling reminder data to the Dapr runtime.
   *
   * @returns An object with fields: reminderName, dueTime, ttl, period, data.
   *
   * @internal
   */
  toObject(): object {
    return {
      reminderName: this.reminderName,
      dueTime: this.dueTime,
      ttl: this.ttl,
      period: this.period,
      data: this.state,
    };
  }

  /**
   * Reconstructs an ActorReminderData from a serialized object representation.
   *
   * Deserializes the state data using BufferSerializer.
   *
   * @param reminderName - The reminder name.
   * @param obj - The serialized reminder object (typically from Dapr runtime).
   * @returns A new ActorReminderData instance.
   *
   * @internal
   */
  static fromObject(reminderName: string, obj: any): ActorReminderData {
    const serializer = new BufferSerializer();

    const data = obj?.data;
    const dueTime = obj?.dueTime;
    const ttl = obj?.ttl;
    const period = obj?.period;

    const deserializedData = serializer.deserialize(data);

    return new ActorReminderData(reminderName, dueTime, ttl, period, deserializedData);
  }
}

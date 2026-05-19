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

import { Temporal } from "@js-temporal/polyfill";

/**
 * Configuration for setting up recurring reminders for an actor.
 *
 * Reminders provide a reliable mechanism to trigger actor methods at specified intervals.
 * Unlike timers, reminders are durable—they survive actor restarts. Reminders are stored
 * externally and re-triggered by the Dapr runtime if the actor instance is deactivated
 * or the application crashes.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/actors/ | Dapr Actors}
 * @see {@link https://tc39.es/proposal-temporal/ | TC39 Temporal Proposal}
 *
 * @example
 * ```typescript
 * import { Temporal } from "@js-temporal/polyfill";
 *
 * // Recurring reminder every 30 seconds, starting immediately
 * const periodicReminder: ActorReminderType = {
 *   period: Temporal.Duration.from({ seconds: 30 })
 * };
 *
 * // Remind after 5 minutes delay, then every 30 seconds
 * const delayedRepeating: ActorReminderType = {
 *   dueTime: Temporal.Duration.from({ minutes: 5 }),
 *   period: Temporal.Duration.from({ seconds: 30 })
 * };
 *
 * // Single reminder after 1 minute with custom data
 * const oneTime: ActorReminderType = {
 *   dueTime: Temporal.Duration.from({ minutes: 1 }),
 *   data: { userId: "user-123", action: "cleanup" },
 *   ttl: Temporal.Duration.from({ hours: 1 })
 * };
 *
 * // Register reminder
 * await actor.registerReminder("cleanup", oneTime);
 * ```
 */
export type ActorReminderType = {
  /**
   * The interval at which the reminder should recur.
   * Specifies the period between successive reminder invocations.
   * Defaults to no recurrence (one-time reminder) if omitted.
   *
   * Format using Temporal.Duration:
   * - Repeat every 9 seconds: `Temporal.Duration.from({ seconds: 9 })`
   * - Repeat every 2 minutes: `Temporal.Duration.from({ minutes: 2 })`
   * - Repeat every 1 hour 30 minutes: `Temporal.Duration.from({ hours: 1, minutes: 30 })`
   *
   * @example
   * ```typescript
   * period: Temporal.Duration.from({ seconds: 30 })
   * ```
   */
  period?: Temporal.Duration;

  /**
   * The time to wait before the first reminder invocation.
   * Defaults to zero (trigger immediately) if omitted.
   *
   * Format using Temporal.Duration:
   * - Trigger after 1 minute: `Temporal.Duration.from({ minutes: 1 })`
   * - Trigger after 30 seconds: `Temporal.Duration.from({ seconds: 30 })`
   * - Trigger immediately: `Temporal.Duration.from({ seconds: 0 })` or omit
   *
   * @example
   * ```typescript
   * dueTime: Temporal.Duration.from({ minutes: 5 })  // Wait 5 minutes before first trigger
   * ```
   */
  dueTime?: Temporal.Duration;

  /**
   * Optional custom data to pass to the reminder method when invoked.
   * Can be any JSON-serializable value: strings, numbers, objects, arrays, etc.
   * The actor's reminder method receives this data as its argument.
   *
   * @example
   * ```typescript
   * data: { orderId: "ORD-123", reason: "followup" }
   * data: "notification-email"
   * data: 42
   * ```
   */
  data?: any;

  /**
   * Time-to-live (TTL) for the reminder.
   * After this duration, the reminder automatically expires and stops triggering.
   * If omitted, the reminder persists indefinitely until explicitly deleted.
   *
   * Format using Temporal.Duration:
   * - Expire after 1 hour: `Temporal.Duration.from({ hours: 1 })`
   * - Expire after 30 days: `Temporal.Duration.from({ days: 30 })`
   *
   * @example
   * ```typescript
   * ttl: Temporal.Duration.from({ hours: 24 })  // Reminder expires after 24 hours
   * ```
   */
  ttl?: Temporal.Duration;
};

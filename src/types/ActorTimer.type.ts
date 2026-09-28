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
 * Configuration for setting up recurring timers for an actor.
 *
 * Timers provide a mechanism to schedule method calls on an actor at specified intervals.
 * Unlike reminders, timers are not durable—they are lost if the actor instance is deactivated
 * or the application crashes. Timers are simpler and more lightweight than reminders, ideal
 * for temporary scheduled actions within an actor's lifetime.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/actors/ | Dapr Actors}
 * @see {@link https://tc39.es/proposal-temporal/ | TC39 Temporal Proposal}
 *
 * @example
 * ```typescript
 * import { Temporal } from "@js-temporal/polyfill";
 *
 * // Call `OnTimerCallback` method every 10 seconds
 * const repeatingTimer: ActorTimerType = {
 *   period: Temporal.Duration.from({ seconds: 10 }),
 *   callback: "OnTimerCallback"
 * };
 *
 * // Call `ProcessHeartbeat` after 1 minute delay, then every 30 seconds
 * const delayedHeartbeat: ActorTimerType = {
 *   dueTime: Temporal.Duration.from({ minutes: 1 }),
 *   period: Temporal.Duration.from({ seconds: 30 }),
 *   callback: "ProcessHeartbeat",
 *   data: { sessionId: "sess-123" }
 * };
 *
 * // Call `Cleanup` once after 5 minutes
 * const oneTimeCleanup: ActorTimerType = {
 *   dueTime: Temporal.Duration.from({ minutes: 5 }),
 *   callback: "Cleanup",
 *   ttl: Temporal.Duration.from({ minutes: 10 })
 * };
 *
 * // Register timer
 * await actor.registerTimer("heartbeat", delayedHeartbeat);
 * ```
 */
export type ActorTimerType = {
  /**
   * The interval at which the timer should recur.
   * Specifies the period between successive timer invocations.
   * Defaults to no recurrence (one-time timer) if omitted.
   *
   * Format using Temporal.Duration:
   * - Repeat every 9 seconds: `Temporal.Duration.from({ seconds: 9 })`
   * - Repeat every 2 minutes: `Temporal.Duration.from({ minutes: 2 })`
   * - Repeat every 1 hour: `Temporal.Duration.from({ hours: 1 })`
   *
   * @example
   * ```typescript
   * period: Temporal.Duration.from({ seconds: 30 })
   * ```
   */
  period?: Temporal.Duration;

  /**
   * The time to wait before the first timer invocation.
   * Defaults to zero (trigger immediately) if omitted.
   *
   * Format using Temporal.Duration:
   * - Trigger after 1 minute: `Temporal.Duration.from({ minutes: 1 })`
   * - Trigger after 30 seconds: `Temporal.Duration.from({ seconds: 30 })`
   * - Trigger immediately: omit or use `Temporal.Duration.from({ seconds: 0 })`
   *
   * @example
   * ```typescript
   * dueTime: Temporal.Duration.from({ minutes: 5 })  // Wait 5 minutes before first trigger
   * ```
   */
  dueTime?: Temporal.Duration;

  /**
   * Optional custom data to pass to the timer callback method when invoked.
   * Can be any JSON-serializable value: strings, numbers, objects, arrays, etc.
   * The actor's timer method receives this data as its argument.
   *
   * @example
   * ```typescript
   * data: { sessionId: "sess-123", operation: "sync" }
   * data: "notification-event"
   * data: 100
   * ```
   */
  data?: any;

  /**
   * Time-to-live (TTL) for the timer.
   * After this duration, the timer automatically expires and stops triggering.
   * If omitted, the timer persists as long as the actor remains active.
   *
   * Format using Temporal.Duration:
   * - Expire after 1 hour: `Temporal.Duration.from({ hours: 1 })`
   * - Expire after 30 minutes: `Temporal.Duration.from({ minutes: 30 })`
   *
   * @example
   * ```typescript
   * ttl: Temporal.Duration.from({ hours: 2 })  // Timer expires after 2 hours
   * ```
   */
  ttl?: Temporal.Duration;

  /**
   * The name of the actor method to invoke when the timer is triggered.
   * This method will be called with the timer's `data` as its parameter.
   * The method must exist on the actor instance.
   *
   * @example
   * ```typescript
   * callback: "OnTimerCallback"
   * callback: "ProcessHeartbeat"
   * callback: "PerformCleanup"
   * ```
   */
  callback: string;
};

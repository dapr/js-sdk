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
 * Discriminates the type of invocation dispatched to an actor method by the runtime.
 *
 * The actor runtime invokes actor methods through different pathways depending on the
 * call source: explicit client invocations, scheduled timer callbacks, or persisted
 * reminder callbacks. This enum distinguishes these invocation paths, which is useful
 * for conditional logic or logging within actor implementations.
 */
export enum ActorCallType {
  /**
   * Method invoked by an explicit client request.
   *
   * Dispatched when a remote caller invokes a method on an actor through the
   * Dapr actor runtime via ActorProxyBuilder or direct actor client invocation.
   * This is the most common actor method invocation type.
   */
  ACTOR_INTERFACE_METHOD,

  /**
   * Method invoked by a scheduled timer callback.
   *
   * Dispatched when an actor's registered timer fires. The callback method name
   * is specified during timer registration and the method receives state data
   * optionally provided at timer registration time.
   *
   * Timers are NOT persisted across actor deactivation. They are ephemeral
   * scheduling constructs tied to the current actor activation.
   */
  TIMER_METHOD,

  /**
   * Method invoked by a persistent reminder callback.
   *
   * Dispatched when an actor's registered reminder fires. The default callback
   * method is `receiveReminder()` on the actor implementation. Reminder state data
   * is passed to this callback.
   *
   * Reminders persist across actor deactivation and failover, making them suitable
   * for durable scheduled work. Unlike timers, reminders survive actor restart,
   * process crash, and cluster failover events.
   */
  REMINDER_METHOD,
}

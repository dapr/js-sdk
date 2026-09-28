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

import { ActorCallType } from "./ActorCallType";

/**
 * Provides contextual metadata about an actor method invocation.
 *
 * The actor runtime captures invocation context information (method name and invocation type)
 * and makes it available to the actor method handler. This allows actors to respond differently
 * depending on whether they're being invoked as a direct method call, timer callback, or
 * reminder callback.
 *
 * ActorMethodContext instances are created by the runtime and typically not directly instantiated
 * by application code. Use the static factory methods for testing or advanced scenarios.
 */
export default class ActorMethodContext {
  private readonly methodName: string;
  private readonly callType: ActorCallType;

  private constructor(methodName: string, callType: ActorCallType) {
    this.methodName = methodName;
    this.callType = callType;
  }

  /**
   * Retrieves the name of the method being invoked.
   *
   * @returns The method name, e.g., "increment", "receiveReminder", or a timer callback name.
   */
  public getMethodName(): string {
    return this.methodName;
  }

  /**
   * Retrieves the type of actor method invocation.
   *
   * @returns The {@link ActorCallType} discriminating the invocation pathway.
   */
  public getCallType(): ActorCallType {
    return this.callType;
  }

  /**
   * Creates a context for a direct actor interface method invocation.
   *
   * Use this factory when building a context for a client-initiated method call.
   *
   * @param methodName - The name of the actor method being invoked.
   * @returns A new ActorMethodContext with call type {@link ActorCallType.ACTOR_INTERFACE_METHOD}.
   */
  static createForActor(methodName: string): ActorMethodContext {
    return new ActorMethodContext(methodName, ActorCallType.ACTOR_INTERFACE_METHOD);
  }

  /**
   * Creates a context for a timer callback method invocation.
   *
   * Use this factory when building a context for a scheduled timer firing.
   *
   * @param methodName - The name of the timer callback method.
   * @returns A new ActorMethodContext with call type {@link ActorCallType.TIMER_METHOD}.
   */
  static createForTimer(methodName: string): ActorMethodContext {
    return new ActorMethodContext(methodName, ActorCallType.TIMER_METHOD);
  }

  /**
   * Creates a context for a reminder callback method invocation.
   *
   * Use this factory when building a context for a persisted reminder firing.
   *
   * @param methodName - The name of the reminder callback method (typically "receiveReminder").
   * @returns A new ActorMethodContext with call type {@link ActorCallType.REMINDER_METHOD}.
   */
  static createForReminder(methodName: string): ActorMethodContext {
    return new ActorMethodContext(methodName, ActorCallType.REMINDER_METHOD);
  }
}

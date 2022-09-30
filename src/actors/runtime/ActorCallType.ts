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
 * Represents the call-type associated with the method invoked by the actor runtime
 */
export enum ActorCallType {
  /**
   * Specifies that the method invoked is an actor interface method for a given
   * client request.
   */
  ACTOR_INTERFACE_METHOD,
  /**
   * Specifies that the method invoked is a timer callback method.
   */
  TIMER_METHOD,
  /**
   * Specifies that the method is when a reminder fires.
   */
  REMINDER_METHOD,
}

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

export default interface ActorTimerInterface {
  /**
   * Initialize a timer.
   * @param timerName The name of the timer.
   * @param incrementBy The amount to increment the counter by.
   * @param dueTimeSeconds Time in seconds when the timer is first due.
   * @param periodSeconds Time in seconds between subsequent timers.
   * @param ttlSeconds Time in seconds after which the timer is deleted.
   */
  init(
    timerName: string,
    incrementBy: number,
    dueTimeSeconds: number,
    periodSeconds: number,
    ttlSeconds: number,
  ): Promise<string>;

  /**
   * Update the value of the internal counter by the specified amount.
   */
  countBy(value: string): Promise<void>;

  /**
   * Get the value of the internal counter.
   */
  getCounter(): Promise<number>;

  /**
   * Stop a timer if it is running.
   */
  stop(): Promise<void>;
}

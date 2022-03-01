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
 * Contains the actor reminder data
 */
export default class ActorTimerData {
  readonly timerName: string;
  readonly state: string | object | undefined;
  readonly callback: string;

  /**
   * @param reminderName the name of the actor reminder
   * @param state the state data passed to receiveReminder callback
   * @param callback the callback method to call
   */
  constructor(timerName: string, callback: string, state?: string | object | undefined) {
    this.timerName = timerName;
    this.callback = callback;
    this.state = state;
  }

  getTimerName(): string {
    return this.timerName;
  }

  getState(): string | object | undefined {
    return this.state;
  }

  getCallback(): string {
    return this.callback;
  }

  /**
   * Return this class as an object
   */
  toObject(): object {
    return {
      callback: this.callback,
      data: this.state
    }
  }

  static fromObject(reminderName: string, obj: any): ActorTimerData {
    const serializer = new BufferSerializer();

    const callback = obj?.callback;
    const data = obj?.data;

    const deserializedData = serializer.deserialize(data);

    return new ActorTimerData(reminderName, callback, deserializedData);
  }
}
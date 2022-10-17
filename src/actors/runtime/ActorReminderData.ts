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
export default class ActorReminderData {
  readonly reminderName: string;
  readonly state: string | object | undefined;
  readonly dueTime: number;
  readonly ttl: number | undefined;
  readonly period: number;

  /**
   * @param reminderName the name of the actor reminder
   * @param state the state data passed to receiveReminder callback
   * @param dueTime the amount of time to delay before invoking the reminder for the first time
   * @param ttl time to duration after which the reminder will be expired and deleted
   * @param period the time interval between reminder invocations after the first invocation
   */
  constructor(reminderName: string, dueTime: number, period: number, ttl?: number, state?: string | object) {
    this.reminderName = reminderName;
    this.dueTime = dueTime;
    this.ttl = ttl;
    this.period = period;
    this.state = state;
  }

  getReminderName(): string {
    return this.reminderName;
  }

  getState(): string | object | undefined {
    return this.state;
  }

  getDueTime(): number {
    return this.dueTime;
  }

  getTtl(): number | undefined {
    return this.ttl;
  }

  getPeriod(): number {
    return this.period;
  }

  /**
   * Return this class as an object
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

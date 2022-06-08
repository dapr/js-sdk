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

import { AbstractActor, Temporal } from "@dapr/dapr";
import ActorReminderInterface from "../interfaces/ActorReminderInterface";

export default class ActorReminderImpl extends AbstractActor implements ActorReminderInterface {
  private reminderName: string | undefined;

  async init(
    reminderName: string,
    dueTimeSeconds: number,
    periodSeconds: number,
    ttlSeconds: number): Promise<string> {
    this.reminderName = reminderName;

    await super.registerActorReminder(
      this.reminderName,
      Temporal.Duration.from({ seconds: dueTimeSeconds }),
      Temporal.Duration.from({ seconds: periodSeconds }),
      Temporal.Duration.from({ seconds: ttlSeconds }));

    return "Actor Initialized";
  }

  async stop(): Promise<void> {
    if (this.reminderName !== undefined) {
      await super.unregisterActorReminder(this.reminderName);
    }
  }

  /**
   * @override
   */
  async receiveReminder(): Promise<void> {
    console.log(`Actor Reminder Fired! Current time in UTC is ${new Date().toUTCString()}`);
  }
}
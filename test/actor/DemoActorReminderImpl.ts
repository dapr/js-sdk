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

import { AbstractActor, Temporal } from "../../src";
import DemoActorReminderInterface from "./DemoActorReminderInterface";

export default class DemoActorReminderImpl extends AbstractActor implements DemoActorReminderInterface {
  counter = 0;

  async init(): Promise<string> {
    await super.registerActorReminder(
      "my-reminder-name",
      Temporal.Duration.from({ milliseconds: 1 }),
      Temporal.Duration.from({ seconds: 1 }),
      undefined,
      123,
    );

    return "Actor Initialized";
  }

  async count(): Promise<void> {
    this.counter++;
  }

  async getCounter(): Promise<number> {
    return this.counter;
  }

  async removeReminder(): Promise<void> {
    return this.unregisterActorReminder("my-reminder-name");
  }

  /**
   * @override
   * @param data
   */
  async receiveReminder(data: string): Promise<void> {
    this.counter += parseInt(data);
  }
}

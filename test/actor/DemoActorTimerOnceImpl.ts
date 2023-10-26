/*
Copyright 2023 The Dapr Authors
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
import DemoActorTimerInterface from "./DemoActorTimerInterface";

export default class DemoActorTimerOnceImpl extends AbstractActor implements DemoActorTimerInterface {
  counter = 0;

  async init(): Promise<string> {
    await super.registerActorTimer(
      "my-timer-name",
      "countBy",
      Temporal.Duration.from({ seconds: 2 }),
      undefined,
      undefined,
      100,
    );
    return "Actor Initialized";
  }

  async count(): Promise<void> {
    this.counter++;
  }

  async getCounter(): Promise<number> {
    return this.counter;
  }

  async countBy(amount: string): Promise<void> {
    this.counter += parseInt(amount);
  }

  async removeTimer(): Promise<void> {
    return await this.unregisterActorTimer("my-timer-name");
  }
}

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
import ActorTimerInterface from "../interfaces/ActorTimerInterface";

export default class ActorTimerImpl extends AbstractActor implements ActorTimerInterface {
  private timerName: string | undefined;
  private counter = 0;

  async init(
    timerName: string,
    incrementBy: number,
    dueTimeSeconds: number,
    periodSeconds: number,
    ttlSeconds: number,
  ): Promise<string> {
    this.timerName = timerName;

    await super.registerActorTimer(
      this.timerName,
      "countBy",
      Temporal.Duration.from({ seconds: dueTimeSeconds }),
      Temporal.Duration.from({ seconds: periodSeconds }),
      Temporal.Duration.from({ seconds: ttlSeconds }),
      incrementBy,
    );

    return "Actor Initialized";
  }

  async countBy(value: string): Promise<void> {
    this.counter += parseInt(value);
  }

  async getCounter(): Promise<number> {
    return this.counter;
  }

  async stop(): Promise<void> {
    if (this.timerName !== undefined) {
      await super.unregisterActorTimer(this.timerName);
    }
  }
}

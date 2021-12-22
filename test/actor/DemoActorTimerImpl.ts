import { AbstractActor, Temporal } from "../../src";
import DemoActorTimerInterface from "./DemoActorTimerInterface";

export default class DemoActorTimerImpl extends AbstractActor implements DemoActorTimerInterface {
  counter = 0;

  async init(): Promise<string> {
    await super.registerActorTimer("my-timer-name", "countBy", Temporal.Duration.from({ seconds: 2 }), Temporal.Duration.from({ seconds: 1 }), 100);
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
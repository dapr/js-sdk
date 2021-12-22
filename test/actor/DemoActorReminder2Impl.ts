import { AbstractActor, Temporal } from "../../src";
import DemoActorReminderInterface from "./DemoActorReminderInterface";

export default class DemoActorReminder2Impl extends AbstractActor implements DemoActorReminderInterface {
  counter = 0;

  async init(): Promise<string> {
    await super.registerActorReminder("my-reminder-name", Temporal.Duration.from({ seconds: 2 }), Temporal.Duration.from({ seconds: 1 }), 123);
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
}
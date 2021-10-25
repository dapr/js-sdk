import { AbstractActor } from "../../src";
import DemoActorReminderInterface from "./DemoActorReminderInterface";

export default class DemoActorReminder2Impl extends AbstractActor implements DemoActorReminderInterface {
  counter = 0;

  async init(): Promise<string> {
    return "Actor Initialized";
  }

  async count(): Promise<void> {
    this.counter++;
  }

  async getCounter(): Promise<number> {
    return this.counter;
  }
}
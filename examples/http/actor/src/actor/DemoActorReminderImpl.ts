import { AbstractActor } from "dapr-client";

export default class DemoActorReminderImpl extends AbstractActor {
  counter = 0;

  async count(): Promise<void> {
    this.counter++;
  }

  async countBy(amount: number): Promise<void> {
    this.counter += amount;
  }
}
import { AbstractActor } from "dapr-client";
import DemoActorCounterInterface from "./DemoActorCounterInterface";

export default class DemoActorCounterImpl extends AbstractActor implements DemoActorCounterInterface {
  counter = 0;

  async count(): Promise<void> {
    this.counter++;
  }

  async countBy(amount: number, multiplier: number = 1): Promise<void> {
    this.counter += (amount * multiplier);
  }
}
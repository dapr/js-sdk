import { AbstractActor } from "@dapr/dapr";
import DemoActorTimerInterface from "./DemoActorTimerInterface";

export default class DemoActorTimerImpl extends AbstractActor implements DemoActorTimerInterface {
  counter = 0;

  async init(): Promise<string> {
    return "Actor Activated";
  }

  async count(): Promise<void> {
    this.counter++;
  }

  async countBy(amount: number): Promise<void> {
    this.counter += amount;
  }
}
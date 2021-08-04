import { AbstractActor } from "../../src";
import DemoActorTimerInterface from "./DemoActorTimerInterface";

export default class DemoActorTimerImpl extends AbstractActor implements DemoActorTimerInterface {
  counter: number = 0;

  async init(): Promise<string> {
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
}
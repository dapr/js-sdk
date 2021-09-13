import { AbstractActor } from "../../src";
import DemoActorReminderInterface from "./DemoActorReminderInterface";

export default class DemoActorReminderImpl extends AbstractActor implements DemoActorReminderInterface {
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

  /**
   * @override
   * @param data 
   */
  async receiveReminder(data: string): Promise<void> {
    this.counter += parseInt(data);
  }
}
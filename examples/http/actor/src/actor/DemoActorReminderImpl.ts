import { AbstractActor } from "dapr-client";
import DemoActorReminderInterface from "./DemoActorReminderInterface";

export default class DemoActorReminderImpl extends AbstractActor implements DemoActorReminderInterface {
    counter: number = 0;

    async count(): Promise<void> {
        this.counter++;
    }

    async countBy(amount: number): Promise<void> {
        this.counter += amount;
    }
}
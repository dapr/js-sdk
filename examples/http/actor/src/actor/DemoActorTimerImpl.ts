import { AbstractActor } from "@dapr/js-sdk";
import DemoActorTimerInterface from "./DemoActorTimerInterface";

export default class DemoActorTimerImpl extends AbstractActor implements DemoActorTimerInterface {
    counter: number = 0;

    async count(): Promise<void> {
        this.counter++;
    }

    async countBy(amount: number): Promise<void> {
        this.counter += amount;
    }
}
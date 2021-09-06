import { AbstractActor } from "../../src";
import DemoActorCounterInterface from "./DemoActorCounterInterface";

export default class DemoActorCounterImpl extends AbstractActor implements DemoActorCounterInterface {
    counter: number = 0;

    async count(): Promise<void> {
        this.counter++;
    }

    async countBy(amount: number): Promise<void> {
        this.counter += amount;
    }
}
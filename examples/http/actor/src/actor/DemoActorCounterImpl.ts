import { AbstractActor } from "@dapr/js-sdk";
import DemoActorCounterInterface from "./DemoActorCounterInterface";

export default class DemoActorCounterImpl extends AbstractActor implements DemoActorCounterInterface {
    increment(amount: number): void {
        throw new Error("Method not implemented.");
    }
}
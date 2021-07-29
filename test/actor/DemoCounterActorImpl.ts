import { AbstractActor } from "../../src";
import IDemoActor from "./IDemoCounterActor";

export default class DemoActorImpl extends AbstractActor implements IDemoActor {
    increment(amount: number): void {
        throw new Error("Method not implemented.");
    }
}
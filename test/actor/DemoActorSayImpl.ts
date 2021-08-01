import { AbstractActor } from "../../src";
import DemoActorSayInterface from "./DemoActorSayInterface";

export default class DemoActorSayImpl extends AbstractActor implements DemoActorSayInterface {
    sayString(msg: string): string {
        return `Actor said: "${msg}"`;
    }

    sayObject(msg: object): object {
        return { said: msg };
    }
}
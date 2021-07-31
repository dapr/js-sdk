import { AbstractActor } from "@dapr/js-sdk";
import DemoActorSayInterface from "./DemoActorSayInterface";

export default class DemoActorSayImpl extends AbstractActor implements DemoActorSayInterface {
    say(msg: string): string {
        return `Actor said: ${msg}`;
    }
}
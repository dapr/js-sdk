import { AbstractActor } from "../../src";
import FakeSimpleActorInterface from "./FakeSimpleActorInterface";

export default class FakeSimpleActorImpl extends AbstractActor implements FakeSimpleActorInterface {
    async actorMethod(): Promise<object> {
        return { name: "actor_method" };
    }

    sayMessage(msg: string): string {
        return msg;
    }
}
import { AbstractActor } from "../../src";
import ActorId from "../../src/actors/ActorId";
import FakeSimpleActorInterface from "./FakeSimpleActorInterface";

export default class FakeSimpleReminderActorImpl extends AbstractActor implements FakeSimpleActorInterface {
    timerCalled: boolean;

    constructor(actorId: ActorId) {
        super(actorId);
        this.timerCalled = false;
    }

    async actorMethod(): Promise<object> {
        return { name: "actor_method" };
    }

    async receiveReminder(name: string, state: Buffer, dueTime: number, period: number): Promise<void> {
    }
}
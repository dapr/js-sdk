import AbstractActor from "./AbstractActor";

export default class StateManager {
    actor: AbstractActor;

    constructor(actor: AbstractActor) {
        this.actor = actor;

        // if (!this.actor.runtimeCtx) {
        //     throw new Error('RUNTIME_CONTEXT_NOT_SET');
        // }

        // this.typeName = this.actor.runtimeCtx.
    }
}
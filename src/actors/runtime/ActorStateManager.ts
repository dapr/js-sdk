import AbstractActor from "./AbstractActor";

export default class ActorStateManager {
    actor: AbstractActor;
    
    constructor(actor: AbstractActor) {
        this.actor = actor;
    }
}
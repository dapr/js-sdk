import DaprClient from "../../implementation/Client/DaprClient";

export default class StateProvider {
    stateClient: DaprClient;
    
    constructor(actorClient: DaprClient) {
        this.stateClient = actorClient;
    }
}
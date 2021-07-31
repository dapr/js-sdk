import { AbstractActor, DaprClient } from "../..";
import Class from "../../types/Class";
import ActorId from "../ActorId";
import ActorProxy from "./ActorProxy";
import ActorProxyFactoryInterface from "./ActorProxyFactory.interface";

export default class ActorProxyFactory implements ActorProxyFactoryInterface {
    daprClient: DaprClient;
    
    constructor(daprHost: string, daprPort: string) {
        this.daprClient = new DaprClient(daprHost, daprPort);
    }

    create<T extends AbstractActor>(actorType: string, actorId: ActorId, actorInterface: Class<T>): ActorProxy<T> {
        return new ActorProxy(this.daprClient, actorType, actorId, actorInterface);
    }
}
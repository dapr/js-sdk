import { AbstractActor } from "../..";
import DaprClient from "../../implementation/Client/DaprClient";
import Class from "../../types/Class";
import ActorId from "../ActorId";
import ActorProxyFactory from "./ActorProxyFactory";

export default class ActorProxy<T extends AbstractActor> {
    readonly actorProxyFactory: ActorProxyFactory;
    readonly daprClient: DaprClient;
    readonly actorType: string;
    readonly actorId: ActorId;
    readonly actorInterface: Class<T>;

    constructor(daprClient: DaprClient, actorType: string, actorId: ActorId, actorInterface: Class<T>) {
        this.daprClient = daprClient;
        this.actorType = actorType;
        this.actorId = actorId;
        this.actorInterface = actorInterface;
        this.actorProxyFactory = new ActorProxyFactory(daprClient.getDaprHost(), daprClient.getDaprPort());
    }

    getActorId(): ActorId {
        return this.actorId;
    }

    getActorType(): string {
        return this.actorType;
    }

    static create<T extends AbstractActor>(client: DaprClient, actorType: string, actorId: string, actorInterface: Class<T>): ActorProxy<T> {
        const factory = new ActorProxyFactory(client.getDaprHost(), client.getDaprPort());
        return factory.create(actorType, new ActorId(actorId), actorInterface);
    }

    // @todo: we want to be able to call the below. For this we need to implement a "smart" getter (python has __getattr__)
    // const proxy = ActorProxyFactory.create(daprClient, 'DemoActor', 'some-id-for-the-actor', DemoActorInterface);
    // proxy.getMyData()
}
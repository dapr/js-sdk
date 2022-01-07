import { DaprClient } from "../..";
import Class from "../../types/Class";
import ActorClient from "./ActorClient/ActorClient";
import ActorId from "../ActorId";

export default class ActorProxyBuilder<T> {
  actorClient: ActorClient;
  daprClient: DaprClient;
  actorTypeClass: Class<T>;

  constructor(actorTypeClass: Class<T>, daprClient: DaprClient) {
    this.actorTypeClass = actorTypeClass;
    this.daprClient = daprClient;
    this.actorClient = new ActorClient(daprClient.getDaprHost(), daprClient.getDaprPort(), daprClient.getCommunicationProtocol(), daprClient.getOptions());
  }

  build(actorId: ActorId): T {
    const actorTypeClassName = this.actorTypeClass.name;
    const actorClient = this.actorClient;

    const handler = {
      get(target: any, propKey: any, receiver: any) {
        return async function (...args: any) {
          const body = args.length > 0 ? args : null;
          const res = await actorClient.actor.invoke(actorTypeClassName, actorId, propKey, body);

          return res;
        };
      }
    };

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy
    // we implement a handler that will take a method and forward it to the actor client
    const proxy = new Proxy(this.actorTypeClass, handler);

    // Return a NOT strongly typed API
    // @todo: this should return a strongly typed API as well, but requires reflection. How to do this in typescript? 
    return proxy as unknown as T;
  }
}
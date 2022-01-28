import GRPCClient from './GRPCClient';
import IClientActorBuilder from "../../../interfaces/Client/IClientActorBuilder";
import ActorProxyBuilder from "../../../actors/client/ActorProxyBuilder";
import Class from "../../../types/Class";
import ActorId from "../../../actors/ActorId";

// https://docs.dapr.io/reference/api/actors_api/
export default class GRPCClientActor implements IClientActorBuilder {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // Note: actorTypeClass is required since Javascript compiled has type information erased
  // this means that we can't use T to new up an object (sadly enough) so we have to pass it
  create<T>(actorTypeClass: Class<T>): T {
    const builder = new ActorProxyBuilder<T>(actorTypeClass, this.client.getClientHost(), this.client.getClientPort(), this.client.getClientCommunicationProtocol(), this.client.getOptions());
    const actor = builder.build(ActorId.createRandomId());
    return actor;
  }
}

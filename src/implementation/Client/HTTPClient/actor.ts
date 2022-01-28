import HTTPClient from './HTTPClient';
import ActorId from '../../../actors/ActorId';
import ActorProxyBuilder from '../../../actors/client/ActorProxyBuilder';
import Class from '../../../types/Class';
import IClientActorBuilder from '../../../interfaces/Client/IClientActorBuilder';

// https://docs.dapr.io/reference/api/actors_api/
export default class HTTPClientActor implements IClientActorBuilder {
  client: HTTPClient;

  constructor(client: HTTPClient) {
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

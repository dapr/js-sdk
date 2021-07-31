import HTTPServer from './HTTPServer';
import IServerActor from '../../../interfaces/Server/IServerActor';
import AbstractActor from '../../../actors/runtime/AbstractActor';
import Class from '../../../types/Class';
import ActorRuntime from '../../../actors/runtime/ActorRuntime';
import DaprClient from '../../Client/DaprClient';

// https://docs.dapr.io/reference/api/bindings_api/
export default class HTTPServerActor implements IServerActor {
  server: HTTPServer;
  client: DaprClient;

  constructor(server: HTTPServer) {
      this.server = server;
      this.client = new DaprClient(this.server.serverHost, this.server.serverPort);
  }

  async registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void> {
    ActorRuntime.getInstance(this.client).registerActor(cls);
    console.log(`Registering actor ${cls.name}`);
  }
}

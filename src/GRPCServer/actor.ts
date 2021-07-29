import { AbstractActor } from '..';
import ActorRuntime from '../actors/runtime/ActorRuntime';
import DaprClient from '../DaprClient';
import Class from '../types/Class';
import GRPCServer from './GRPCServer';

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class GRPCServerActor {
  server: GRPCServer;
  client: DaprClient;

  constructor(server: GRPCServer) {
      this.server = server;
      this.client = new DaprClient(this.server.serverHost, this.server.serverPort);
  }

  async registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void> {
    await ActorRuntime.getInstance(this.client).registerActor(cls);
    console.log(`Registering actor ${cls.name}`)
  }
}

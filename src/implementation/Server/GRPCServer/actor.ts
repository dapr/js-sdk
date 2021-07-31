import GRPCServer from './GRPCServer';
import IServerActor from '../../../interfaces/Server/IServerActor';
import AbstractActor from '../../../actors/runtime/AbstractActor';
import Class from '../../../types/Class';

// https://docs.dapr.io/reference/api/bindings_api/
export default class GRPCServerActor implements IServerActor {
  server: GRPCServer;

  constructor(server: GRPCServer) {
      this.server = server;
  }
  registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

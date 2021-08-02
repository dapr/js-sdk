import GRPCServer from './GRPCServer';
import IServerActor from '../../../interfaces/Server/IServerActor';
import AbstractActor from '../../../actors/runtime/AbstractActor';
import Class from '../../../types/Class';
import GRPCClient from '../../Client/GRPCClient/GRPCClient';

// https://docs.dapr.io/reference/api/bindings_api/
export default class GRPCServerActor implements IServerActor {
  server: GRPCServer;
  client: GRPCClient;

  constructor(server: GRPCServer, client: GRPCClient) {
      this.server = server;
      this.client = client;
  }

  init(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getRegisteredActors(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  
  registerActor<T extends AbstractActor>(cls: Class<T>): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

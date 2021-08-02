import GRPCServer from './GRPCServer';
import { TypeDaprBindingCallback } from '../../../types/DaprBindingCallback.type';
import IServerBinding from '../../../interfaces/Server/IServerBinding';
import GRPCClient from '../../Client/GRPCClient/GRPCClient';

// https://docs.dapr.io/reference/api/bindings_api/
export default class DaprBinding implements IServerBinding {
  server: GRPCServer;
  client: GRPCClient;

  constructor(server: GRPCServer, client: GRPCClient) {
      this.server = server;
      this.client = client;
  }
  
  // Receive an input from an external system
  async receive(bindingName: string, cb: TypeDaprBindingCallback): Promise<any> {
    console.log(`Registering GRPC onBindingInput Handler: Binding = ${bindingName}`);
    this.server.getServerImpl().registerInputBindingHandler(bindingName, cb);
  }
}

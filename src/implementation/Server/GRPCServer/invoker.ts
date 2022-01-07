import GRPCServer from './GRPCServer';
import { TypeDaprInvokerCallback } from '../../../types/DaprInvokerCallback.type';
import { InvokerListenOptionsType } from '../../../types/InvokerListenOptions.type';
import { HttpMethod } from '../../../enum/HttpMethod.enum';
import IServerInvoker from '../../../interfaces/Server/IServerInvoker';
import GRPCClient from '../../Client/GRPCClient/GRPCClient';

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class DaprInvoker implements IServerInvoker {
  server: GRPCServer;

  constructor(server: GRPCServer) {
    this.server = server;
  }

  async listen(methodName: string, cb: TypeDaprInvokerCallback, options: InvokerListenOptionsType = {}): Promise<any> {
    const httpMethod: HttpMethod = options?.method?.toLowerCase() as HttpMethod || HttpMethod.GET;
    console.log(`Registering onInvoke Handler ${httpMethod} /${methodName}`);
    this.server.getServerImpl().registerOnInvokeHandler(httpMethod, methodName, cb);
  }
}

import { TypeDaprInvokerCallback } from '../types/DaprInvokerCallback.type';
import { InvokerListenOptionsType } from '../types/InvokerListenOptions.type';
import { HttpMethod } from '../enum/HttpMethod.enum';
import GRPCServer from './GRPCServer';

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class GRPCServerInvoker {
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

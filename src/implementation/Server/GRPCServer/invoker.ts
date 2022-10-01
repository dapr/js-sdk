/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import GRPCServer from "./GRPCServer";
import { TypeDaprInvokerCallback } from "../../../types/DaprInvokerCallback.type";
import { InvokerListenOptionsType } from "../../../types/InvokerListenOptions.type";
import { HttpMethod } from "../../../enum/HttpMethod.enum";
import IServerInvoker from "../../../interfaces/Server/IServerInvoker";
import { Logger } from "../../../logger/Logger";

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class DaprInvoker implements IServerInvoker {
  server: GRPCServer;
  private readonly logger: Logger;

  constructor(server: GRPCServer) {
    this.server = server;
    this.logger = new Logger("GRPCServer", "Invoker", server.client.options.logger);
  }

  async listen(methodName: string, cb: TypeDaprInvokerCallback, options: InvokerListenOptionsType = {}): Promise<any> {
    const httpMethod: HttpMethod = (options?.method?.toLowerCase() as HttpMethod) || HttpMethod.GET;
    this.logger.info(`Registering onInvoke Handler ${httpMethod} /${methodName}`);
    this.server.getServerImpl().registerOnInvokeHandler(httpMethod, methodName, cb);
  }
}

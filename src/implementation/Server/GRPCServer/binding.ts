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

import GRPCServer from './GRPCServer';
import { TypeDaprBindingCallback } from '../../../types/DaprBindingCallback.type';
import IServerBinding from '../../../interfaces/Server/IServerBinding';
import { Logger } from '../../../logger/Logger';

// https://docs.dapr.io/reference/api/bindings_api/
export default class DaprBinding implements IServerBinding {
  server: GRPCServer;
  private readonly logger: Logger;

  constructor(server: GRPCServer) {
    this.server = server;
    this.logger = new Logger("GRPCServer", "Binding", server.client.options.logger);
  }

  // Receive an input from an external system
  async receive(bindingName: string, cb: TypeDaprBindingCallback): Promise<any> {
    this.logger.info(`Registering GRPC onBindingInput Handler: Binding = ${bindingName}`);
    this.server.getServerImpl().registerInputBindingHandler(bindingName, cb);
  }
}

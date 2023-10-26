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

import IServer from "../../interfaces/Server/IServer";
import IServerPubSub from "../../interfaces/Server/IServerPubSub";
import IServerBinding from "../../interfaces/Server/IServerBinding";
import IServerInvoker from "../../interfaces/Server/IServerInvoker";
import IServerActor from "../../interfaces/Server/IServerActor";

import CommunicationProtocolEnum from "../../enum/CommunicationProtocol.enum";
import GRPCServer from "./GRPCServer/GRPCServer";
import GRPCServerPubSub from "./GRPCServer/pubsub";
import GRPCServerBinding from "./GRPCServer/binding";
import GRPCServerInvoker from "./GRPCServer/invoker";
import GRPCServerActor from "./GRPCServer/actor";

import HTTPServer from "./HTTPServer/HTTPServer";
import HTTPServerPubSub from "./HTTPServer/pubsub";
import HTTPServerBinding from "./HTTPServer/binding";
import HTTPServerInvoker from "./HTTPServer/invoker";
import HTTPServerActor from "./HTTPServer/actor";
import { Settings } from "../../utils/Settings.util";
import { DaprServerOptions } from "../../types/DaprServerOptions";
import DaprClient from "../Client/DaprClient";
import { getClientOptions } from "../../utils/Client.util";

export default class DaprServer {
  // App details
  private readonly serverOptions: DaprServerOptions;

  readonly daprServer: IServer;
  readonly pubsub: IServerPubSub;
  readonly binding: IServerBinding;
  readonly invoker: IServerInvoker;
  readonly actor: IServerActor;
  readonly client: DaprClient;

  constructor(serverOptions: Partial<DaprServerOptions> = {}) {
    const communicationProtocol = serverOptions.communicationProtocol ?? Settings.getDefaultCommunicationProtocol();
    const clientOptions = getClientOptions(serverOptions.clientOptions, communicationProtocol, serverOptions?.logger);

    // Legacy validation on port
    // URI validation is done later, when we instantiate the HttpEndpoint or GrpcEndpoint
    // object in the HttpClient or GrpcClient constructor, but we need to
    // keep this additional check for backward compatibility
    // TODO: Remove this validation in the next major version
    if (clientOptions?.daprPort && !/^[0-9]+$/.test(clientOptions?.daprPort)) {
      throw new Error("DAPR_INCORRECT_SIDECAR_PORT");
    }

    this.client = new DaprClient(clientOptions);

    this.serverOptions = {
      serverHost: serverOptions.serverHost ?? Settings.getDefaultHost(),
      serverPort: serverOptions.serverPort ?? Settings.getDefaultAppPort(communicationProtocol),
      communicationProtocol: communicationProtocol,
      maxBodySizeMb: serverOptions.maxBodySizeMb,
      serverHttp: serverOptions.serverHttp,
      clientOptions: this.client.options,
      logger: serverOptions.logger,
    };
    // Create a client to interface with the sidecar from the server side

    // If DAPR_SERVER_PORT was not set, we set it
    process.env.DAPR_SERVER_PORT = this.serverOptions.serverPort;
    process.env.DAPR_CLIENT_PORT = this.client.options.daprPort;

    // Validation on port
    if (!/^[0-9]+$/.test(this.serverOptions.serverPort)) {
      throw new Error("DAPR_INCORRECT_SERVER_PORT");
    }

    // Builder
    switch (serverOptions.communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const server = new GRPCServer(this.client, this.serverOptions);
        this.daprServer = server;

        this.pubsub = new GRPCServerPubSub(server);
        this.binding = new GRPCServerBinding(server);
        this.invoker = new GRPCServerInvoker(server);
        this.actor = new GRPCServerActor(server);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const server = new HTTPServer(this.client, this.serverOptions);
        this.daprServer = server;

        this.pubsub = new HTTPServerPubSub(server);
        this.binding = new HTTPServerBinding(server);
        this.invoker = new HTTPServerInvoker(server);
        this.actor = new HTTPServerActor(server, this.client);
        break;
      }
    }
  }

  async start(): Promise<void> {
    // First start the server as we need to initialize routes for PubSub, Bindings, ...
    await this.daprServer.start(this.serverOptions.serverHost, this.serverOptions.serverPort.toString());

    // Ensure our sidecar starts and the client is ready
    await this.client.start();
  }

  async stop(): Promise<void> {
    await this.daprServer.stop();
  }

  getDaprClient(): IServer {
    return this.daprServer;
  }
}

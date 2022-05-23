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

import IServer from '../../interfaces/Server/IServer';
import IServerPubSub from '../../interfaces/Server/IServerPubSub';
import IServerBinding from '../../interfaces/Server/IServerBinding';
import IServerInvoker from '../../interfaces/Server/IServerInvoker';
import IServerActor from '../../interfaces/Server/IServerActor';

import CommunicationProtocolEnum from '../../enum/CommunicationProtocol.enum';
import GRPCServer from './GRPCServer/GRPCServer';
import GRPCServerPubSub from './GRPCServer/pubsub';
import GRPCServerBinding from './GRPCServer/binding';
import GRPCServerInvoker from './GRPCServer/invoker';
import GRPCServerActor from './GRPCServer/actor';

import HTTPServer from './HTTPServer/HTTPServer';
import HTTPServerPubSub from './HTTPServer/pubsub';
import HTTPServerBinding from './HTTPServer/binding';
import HTTPServerInvoker from './HTTPServer/invoker';
import HTTPServerActor from './HTTPServer/actor';
import { DaprClientOptions } from '../../types/DaprClientOptions';
import { DaprClient } from '../..';
import { Settings } from '../../utils/Settings.util';
import * as NodeJSUtils from "../../utils/NodeJS.util";

export default class DaprServer {
  // App details
  private readonly serverHost: string;
  private readonly serverPort: string;
  // Dapr Sidecar
  private readonly daprHost: string;
  private readonly daprPort: string;

  readonly daprServer: IServer;
  readonly pubsub: IServerPubSub;
  readonly binding: IServerBinding;
  readonly invoker: IServerInvoker;
  readonly actor: IServerActor;
  readonly client: DaprClient;

  readonly daprSidecarPollingDelayMs = 1000;

  constructor(
    serverHost?: string
    , serverPort?: string
    , daprHost?: string
    , daprPort?: string
    , communicationProtocol: CommunicationProtocolEnum = CommunicationProtocolEnum.HTTP
    , clientOptions: DaprClientOptions = {
      isKeepAlive: true
    }
  ) {
    this.serverHost = serverHost ?? Settings.getDefaultHost();
    this.serverPort = serverPort ?? Settings.getDefaultAppPort(communicationProtocol);
    this.daprHost = daprHost ?? Settings.getDefaultHost();
    this.daprPort = daprPort ?? Settings.getDefaultPort(communicationProtocol);

    // Create a client to interface with the sidecar from the server side
    this.client = new DaprClient(daprHost, daprPort, communicationProtocol, clientOptions);

    // If DAPR_SERVER_PORT was not set, we set it
    process.env.DAPR_SERVER_PORT = this.serverPort;
    process.env.DAPR_CLIENT_PORT = this.daprPort;

    // Validation on port
    if (!/^[0-9]+$/.test(this.serverPort)) {
      throw new Error('DAPR_INCORRECT_SERVER_PORT');
    }

    if (!/^[0-9]+$/.test(this.daprPort)) {
      throw new Error('DAPR_INCORRECT_SIDECAR_PORT');
    }

    // Builder
    switch (communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const server = new GRPCServer(this.client);
        this.daprServer = server;

        this.pubsub = new GRPCServerPubSub(server);
        this.binding = new GRPCServerBinding(server);
        this.invoker = new GRPCServerInvoker(server);
        this.actor = new GRPCServerActor(server);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const server = new HTTPServer(this.client);
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
    await this.daprServer.start(this.serverHost, this.serverPort.toString());

    // Ensure our sidecar starts
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    let isHealthy = false;
    let isHealthyRetryCount = 0;
    const isHealthyMaxRetryCount = 60; // 1s startup delay and we try max for 60s

    console.log(`[Dapr-JS][Server] Awaiting Sidecar to be Started`);
    while (!isHealthy) {
      console.log(`[Dapr-JS][Server] Waiting till Dapr Sidecar Started (#${isHealthyRetryCount})`);
      await NodeJSUtils.sleep(this.daprSidecarPollingDelayMs);
      isHealthy = await this.client.getDaprClient().isSidecarStarted();
      isHealthyRetryCount++;

      if (isHealthyRetryCount > isHealthyMaxRetryCount) {
        throw new Error("DAPR_SIDECAR_COULD_NOT_BE_STARTED");
      }
    }

    // We are initialized
    console.log(`[Dapr-JS][Server] Sidecar Started`);
  }

  async stop(): Promise<void> {
    await this.daprServer.stop();
  }

  getDaprClient(): IServer {
    return this.daprServer;
  }

  getDaprHost(): string {
    return this.daprHost;
  }

  getDaprPort(): string {
    return this.daprPort;
  }
}
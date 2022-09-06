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

import * as grpc from "@grpc/grpc-js";
import { DaprClient as GrpcDaprClient } from "../../../proto/dapr/proto/runtime/v1/dapr_grpc_pb"
import IClient from "../../../interfaces/Client/IClient";
import CommunicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from '../../../utils/Settings.util';
import { Logger } from "../../../logger/Logger";
import GRPCClientSidecar from "./sidecar";
import DaprClient from "../DaprClient";
import { GrpcOptions } from '../../../types/GrpcOptions';

export default class GRPCClient implements IClient {
  private isInitialized: boolean;

  private readonly client: GrpcDaprClient;
  private readonly clientCredentials: grpc.ChannelCredentials;
  private readonly clientHost: string;
  private readonly clientPort: string;
  private readonly options: DaprClientOptions;
  private readonly logger: Logger;

  constructor(
    host = Settings.getDefaultHost()
    , port = Settings.getDefaultGrpcPort()
    , options: DaprClientOptions = {},
  ) {
    this.clientHost = host;
    this.clientPort = port;
    this.options = options;
    this.clientCredentials = this.generateCredentials();
    this.logger = new Logger("GRPCClient", "GRPCClient", options.logger);
    this.isInitialized = false;

    this.logger.info(`Opening connection to ${this.clientHost}:${this.clientPort}`);
    this.client = this.generateClient(this.clientHost, this.clientPort, this.clientCredentials, options.grpc);
  }

  getClientHost(): string {
    return this.clientHost;
  }

  getClientPort(): string {
    return this.clientPort;
  }

  async getClient(requiresInitialization = true): Promise<GrpcDaprClient> {
    // Ensure the sidecar has been started
    if (!this.isInitialized && requiresInitialization) {
      await this.start();
    }

    return this.client;
  }

  getClientCommunicationProtocol(): CommunicationProtocolEnum {
    return CommunicationProtocolEnum.GRPC;
  }

  getClientCredentials(): grpc.ChannelCredentials {
    return this.clientCredentials;
  }

  private generateClient(host: string, port: string, credentials: grpc.ChannelCredential, options?: GrpcOptions): GrpcDaprClient {
    const client = new GrpcDaprClient(`${host}:${port}`, credentials, options);
    return client;
  }

  // @todo: look into making secure credentials
  private generateCredentials(): grpc.ChannelCredentials {
    const credsChannel = grpc.ChannelCredentials.createInsecure();
    return credsChannel;
  }

  getOptions(): DaprClientOptions {
    return this.options;
  }

  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  async stop(): Promise<void> {
    this.client.close();
  }

  async _startWaitForClientReady(): Promise<void> {
    const deadline = Date.now() + Settings.getDaprSidecarStartupTimeoutMs();

    return new Promise((resolve, reject) => {
      this.client.waitForReady(deadline, (err?) => {
        if (err) {
          this.logger.error(`Error waiting for client to be ready: ${err}`);
          return reject();
        }

        return resolve();
      });
    })
  }

  async _startAwaitSidecarStarted(): Promise<void> {
    await DaprClient.awaitSidecarStarted(async () => await GRPCClientSidecar.isStarted(this));
  }

  /**
   * Ensure the client is started, this takes care of:
   * 1. Making sure the sidecar is started
   * 2. Making sure the connection is established (e.g. in gRPC)
   * 3. Making sure the client is ready to be used
   */
  async start(): Promise<void> {
    await this._startAwaitSidecarStarted();
    await this._startWaitForClientReady();
    this.isInitialized = true;
  }
}
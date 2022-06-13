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
import { DaprClient } from "../../../proto/dapr/proto/runtime/v1/dapr_grpc_pb"
import IClient from "../../../interfaces/Client/IClient";
import CommunicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from '../../../utils/Settings.util';
import { Logger } from "../../../logger/Logger";

export default class GRPCClient implements IClient {
  private isInitialized: boolean;

  private readonly client: DaprClient;
  private readonly clientCredentials: grpc.ChannelCredentials;
  private readonly clientHost: string;
  private readonly clientPort: string;
  private readonly options: DaprClientOptions;
  private readonly logger: Logger;

  constructor(
    host = Settings.getDefaultHost()
    , port = Settings.getDefaultGrpcPort()
    , options: DaprClientOptions = {
      isKeepAlive: true
    },
  ) {
    this.clientHost = host;
    this.clientPort = port;
    this.options = options;
    this.clientCredentials = this.generateCredentials(host, port, options);
    this.logger = new Logger("GRPCClient", "GRPCClient", options.logger);
    this.isInitialized = false;

    this.logger.info(`Opening connection to ${this.clientHost}:${this.clientPort}`);
    this.client = new DaprClient(`${this.clientHost}:${this.clientPort}`, this.clientCredentials);
  }

  getClientHost(): string {
    return this.clientHost;
  }

  getClientPort(): string {
    return this.clientPort;
  }

  getClient(): DaprClient {
    return this.client;
  }

  getClientCommunicationProtocol(): CommunicationProtocolEnum {
    return CommunicationProtocolEnum.GRPC;
  }

  getClientCredentials(): grpc.ChannelCredentials {
    return this.clientCredentials;
  }

  private generateCredentials(host: string, port: string, options: DaprClientOptions): grpc.ChannelCredentials {
    let credsChannel = grpc.ChannelCredentials.createInsecure();

    if (options.daprAppId !== undefined) {
      const credsMetadata = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
        const metadata = new grpc.Metadata();
        metadata.add('dapr-app-id', `${options.daprAppId}`);
        callback(null, metadata);
      });

      credsChannel = grpc.credentials.combineChannelCredentials(credsChannel, credsMetadata);
    }

    return credsChannel;
  }

  getOptions(): DaprClientOptions {
    return this.options;
  }

  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
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

  async start(): Promise<void> {
    await this._startWaitForClientReady();
  }
}
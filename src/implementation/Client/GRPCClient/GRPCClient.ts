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

import { createClient, type Client, type Interceptor } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { Dapr } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClient from "../../../interfaces/Client/IClient";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from "../../../utils/Settings.util";
import { Logger } from "../../../logger/Logger";
import GRPCClientSidecar from "./sidecar";
import DaprClient from "../DaprClient";
import communicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { GrpcEndpoint } from "../../../network/GrpcEndpoint";

export default class GRPCClient implements IClient {
  readonly options: DaprClientOptions;

  private isInitialized: boolean;
  private readonly client: Client<typeof Dapr>;
  private readonly logger: Logger;
  private daprEndpoint: GrpcEndpoint;

  constructor(options: Partial<DaprClientOptions>) {
    this.daprEndpoint = this.generateEndpoint(options);

    this.options = {
      daprHost: this.daprEndpoint.hostname,
      daprPort: this.daprEndpoint.port,
      communicationProtocol: communicationProtocolEnum.GRPC,
      isKeepAlive: options?.isKeepAlive,
      logger: options?.logger,
      actor: options?.actor,
      daprApiToken: options?.daprApiToken,
      maxBodySizeMb: options?.maxBodySizeMb,
    };

    this.logger = new Logger("GRPCClient", "GRPCClient", options.logger);
    this.isInitialized = false;

    const maxBytes = (this.options.maxBodySizeMb ?? 4) * 1024 * 1024;
    const interceptors: Interceptor[] = [];

    if (this.options.daprApiToken) {
      interceptors.push(this.generateInterceptor());
    }

    const baseUrl = `${this.daprEndpoint.tls ? "https" : "http"}://${this.daprEndpoint.hostname}:${
      this.daprEndpoint.port
    }`;
    this.logger.info(`Opening connection to ${this.options.daprHost}:${this.options.daprPort}`);

    const transport = createGrpcTransport({
      baseUrl,
      interceptors,
      readMaxBytes: maxBytes,
      writeMaxBytes: maxBytes,
    });

    this.client = createClient(Dapr, transport);
  }

  async getClient(requiresInitialization = true): Promise<Client<typeof Dapr>> {
    if (!this.isInitialized && requiresInitialization) {
      await this.start();
    }
    return this.client;
  }

  private generateEndpoint(options: Partial<DaprClientOptions>): GrpcEndpoint {
    const host = options?.daprHost ?? Settings.getDefaultHost();
    const port = options?.daprPort ?? Settings.getDefaultGrpcPort();
    let uri = `${host}:${port}`;

    if (!(options?.daprHost || options?.daprPort)) {
      const endpoint = Settings.getDefaultGrpcEndpoint();
      if (endpoint != "") {
        uri = endpoint;
      }
    }

    return new GrpcEndpoint(uri);
  }

  private generateInterceptor(): Interceptor {
    const token = this.options.daprApiToken as string;
    return (next) => async (req) => {
      if (!req.header.has("dapr-api-token")) {
        req.header.set("dapr-api-token", token);
      }
      return await next(req);
    };
  }

  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  async stop(): Promise<void> {
    // No explicit connection to close with ConnectRPC transport
  }

  async _startWaitForClientReady(): Promise<void> {
    // Not needed with ConnectRPC - connection is established on first request
  }

  async _startAwaitSidecarStarted(): Promise<void> {
    await DaprClient.awaitSidecarStarted(async () => await GRPCClientSidecar.isStarted(this), this.logger);
  }

  async start(): Promise<void> {
    await this._startAwaitSidecarStarted();
    await this._startWaitForClientReady();
    this.isInitialized = true;
  }
}

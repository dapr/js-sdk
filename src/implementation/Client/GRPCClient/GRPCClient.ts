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

import { Dapr } from "../../../proto/dapr/proto/runtime/v1/dapr_pb"
import IClient from "../../../interfaces/Client/IClient";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from "../../../utils/Settings.util";
import { Logger } from "../../../logger/Logger";
import GRPCClientSidecar from "./sidecar";
import DaprClient from "../DaprClient";
import { SDK_VERSION } from "../../../version";
import communicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { GrpcEndpoint } from "../../../network/GrpcEndpoint";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { createClient, Client } from "@connectrpc/connect";

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

    this.logger.info(`Opening connection to ${this.options.daprHost}:${this.options.daprPort}`);

    const transport = createGrpcTransport({
      baseUrl: this.daprEndpoint.endpoint,
      interceptors: this.generateInterceptors(),
    });

    this.client = createClient(Dapr, transport);
  }

  async getClient(requiresInitialization = true): Promise<Client<typeof Dapr>> {
    // Ensure the sidecar has been started
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
      // If neither host nor port are specified, check the endpoint environment variable.
      const endpoint = Settings.getDefaultGrpcEndpoint();
      if (endpoint != "") {
        uri = endpoint;
      }
    }

    return new GrpcEndpoint(uri);
  }

  private generateInterceptors(): any[] {
    const interceptors: any[] = [];

    // Add interceptors if we have an API token
    if (this.options.daprApiToken !== "") {
      const interceptorDaprApiToken = (next: any) => async (req: any) => {
        req.header.set("dapr-api-token", this.options.daprApiToken);
        return await next(req);
      };
      interceptors.push(interceptorDaprApiToken);
    }

    return interceptors;
  }

  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  async stop(): Promise<void> {
    // Connect clients don't have a close method on the client itself, 
    // but the transport can be managed. For now, we'll just leave it empty
    // as createGrpcTransport doesn't expose a simple close()
  }

  async _startWaitForClientReady(): Promise<void> {
    // For Connect/gRPC, we can just check if we can get metadata
    await GRPCClientSidecar.isStarted(this);
  }

  async _startAwaitSidecarStarted(): Promise<void> {
    await DaprClient.awaitSidecarStarted(async () => await GRPCClientSidecar.isStarted(this), this.logger);
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

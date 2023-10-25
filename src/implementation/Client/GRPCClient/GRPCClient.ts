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
import { DaprClient as GrpcDaprClient } from "../../../proto/dapr/proto/runtime/v1/dapr_grpc_pb";
import IClient from "../../../interfaces/Client/IClient";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from "../../../utils/Settings.util";
import { Logger } from "../../../logger/Logger";
import GRPCClientSidecar from "./sidecar";
import DaprClient from "../DaprClient";
import { SDK_VERSION } from "../../../version";
import CommunicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import {GrpcEndpoint, HttpEndpoint} from "../../../utils/Client.util";

export default class GRPCClient implements IClient {
  readonly options: DaprClientOptions;

  private isInitialized: boolean;
  private readonly client: GrpcDaprClient;
  private readonly clientCredentials: grpc.ChannelCredentials;
  private readonly logger: Logger;
  private readonly grpcClientOptions: Partial<grpc.ClientOptions>;

  constructor(options: DaprClientOptions) {
    this.options = options;

    // If the instantiation was done directly, through GRPCClient(), and not through DaprClient()
    // we need to set the endpoint object
    if (this.options.daprEndpoint === undefined) {
      this.options.daprEndpoint = new GrpcEndpoint(`${this.options.daprHost}:${this.options.daprPort}`);
    }

    this.clientCredentials = this.generateCredentials();
    this.grpcClientOptions = this.generateChannelOptions();

    this.logger = new Logger("GRPCClient", "GRPCClient", options.logger);
    this.isInitialized = false;

    this.logger.info(`Opening connection to ${this.options.daprHost}:${this.options.daprPort}`);
    this.client = new GrpcDaprClient(
      this.options.daprEndpoint.endpoint,
      this.getClientCredentials(),
      this.getGrpcClientOptions(),
    );
  }

  async getClient(requiresInitialization = true): Promise<GrpcDaprClient> {
    // Ensure the sidecar has been started
    if (!this.isInitialized && requiresInitialization) {
      await this.start();
    }

    return this.client;
  }

  getClientCredentials(): grpc.ChannelCredentials {
    return this.clientCredentials;
  }

  getGrpcClientOptions(): grpc.ClientOptions {
    return this.grpcClientOptions;
  }

  private generateCredentials(): grpc.ChannelCredentials {
    if (this.options.daprEndpoint?.tls) {
      return grpc.ChannelCredentials.createSsl();
    }
    return grpc.ChannelCredentials.createInsecure();
  }

  private generateChannelOptions(): Partial<grpc.ClientOptions> {
    // const options: Record<string, string | number> = {};
    let options: Partial<grpc.ClientOptions> = {};

    // See: GRPC_ARG_MAX_SEND_MESSAGE_LENGTH, it is in bytes
    // https://grpc.github.io/grpc/core/group__grpc__arg__keys.html#ga813f94f9ac3174571dd712c96cdbbdc1
    // Default is 4Mb
    options["grpc.max_send_message_length"] = (this.options.maxBodySizeMb ?? 4) * 1024 * 1024;

    // There was an issue that there was no default set in grpc-node, so we set it here
    // https://github.com/grpc/grpc-node/issues/1158#issuecomment-1137023216
    options["grpc-node.max_session_memory"] = Number.MAX_SAFE_INTEGER;

    // Add user agent
    options["grpc.primary_user_agent"] = "dapr-sdk-js/v" + SDK_VERSION;

    // Add interceptors if we have an API token
    if (this.options.daprApiToken !== "") {
      options = {
        interceptors: [this.generateInterceptors()],
        ...options,
      };
    }

    return options;
  }

  private generateInterceptors(): (options: any, nextCall: any) => grpc.InterceptingCall {
    return (options: any, nextCall: any) => {
      return new grpc.InterceptingCall(nextCall(options), {
        start: (metadata, listener, next) => {
          if (metadata.get("dapr-api-token").length == 0) {
            metadata.add("dapr-api-token", this.options.daprApiToken as grpc.MetadataValue);
          }
          next(metadata, listener);
        },
      });
    };
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
    });
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

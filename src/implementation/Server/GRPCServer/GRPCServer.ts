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
import GRPCServerImpl from "./GRPCServerImpl";
import { AppCallbackService } from "../../../proto/dapr/proto/runtime/v1/appcallback_grpc_pb";
import IServer from "../../../interfaces/Server/IServer";
import { DaprClient } from "../../..";
import { Logger } from "../../../logger/Logger";
import { DaprServerOptions } from "../../../types/DaprServerOptions";

// eslint-disable-next-line
export interface IServerType extends grpc.Server {}
// eslint-disable-next-line
export interface IServerImplType extends GRPCServerImpl {}

export default class GRPCServer implements IServer {
  isInitialized: boolean;
  serverHost: string;
  serverPort: string;
  serverOptions: DaprServerOptions;
  server: IServerType;
  serverImpl: IServerImplType;
  serverCredentials: grpc.ServerCredentials;
  client: DaprClient;
  private readonly logger: Logger;

  constructor(client: DaprClient, options: DaprServerOptions) {
    this.isInitialized = false;

    this.serverHost = "";
    this.serverPort = "";
    this.serverOptions = options;
    this.client = client;
    this.logger = new Logger("GRPCServer", "GRPCServer", client.options.logger);

    // Create Server
    const grpcChannelOptions = this.generateChannelOptions();
    this.server = new grpc.Server(grpcChannelOptions);
    this.serverCredentials = grpc.ServerCredentials.createInsecure();
    this.serverImpl = new GRPCServerImpl(this.server, client.options.logger);

    // Add our implementation
    this.logger.info("Adding Service Implementation - AppCallbackService");
    // @ts-ignore
    this.server.addService(AppCallbackService, this.serverImpl);
  }

  // See: https://cs.github.com/nestjs/nest/blob/f4e9ac6208f3e7ee7ad44c3de713c9086f657977/packages/microservices/external/grpc-options.interface.ts
  generateChannelOptions(): Record<string, string | number> {
    const options: Record<string, string | number> = {};

    // See: GRPC_ARG_MAX_SEND_MESSAGE_LENGTH, it is in bytes
    // https://grpc.github.io/grpc/core/group__grpc__arg__keys.html#ga813f94f9ac3174571dd712c96cdbbdc1
    // Default is 4Mb
    options["grpc.max_receive_message_length"] = (this.serverOptions.maxBodySizeMb ?? 4) * 1024 * 1024;

    // There was an issue that there was no default set in grpc-node, so we set it here
    // https://github.com/grpc/grpc-node/issues/1158#issuecomment-1137023216
    options["grpc-node.max_session_memory"] = Number.MAX_SAFE_INTEGER;

    return options;
  }

  getServerAddress(): string {
    if (!this.isInitialized) {
      throw new Error(
        JSON.stringify({
          error: "GRPC_SERVER_NOT_INITIALIZED",
          error_message: "The gRPC server was not initialized, did you call `await GRPCServerSingleton.initialize()`?",
        }),
      );
    }

    return `${this.serverHost}:${this.serverPort}`;
  }

  getServer(): IServerType {
    if (!this.isInitialized) {
      throw new Error(
        JSON.stringify({
          error: "GRPC_SERVER_NOT_INITIALIZED",
          error_message: "The gRPC server was not initialized, did you call `await GRPCServerSingleton.initialize()`?",
        }),
      );
    }

    return this.server as IServerType;
  }

  // We allow this, since this will register the routes and handlers!
  getServerImpl(): IServerImplType {
    return this.serverImpl;
  }

  async start(host: string, port: string): Promise<void> {
    this.serverHost = host;
    this.serverPort = port;

    await this.initializeBind();
    this.server.start();

    // We are initialized
    this.isInitialized = true;
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.tryShutdown((err) => {
        if (err) {
          return reject(err);
        }

        this.isInitialized = false;
        return resolve();
      });
    });
  }

  private async initializeBind(): Promise<void> {
    this.logger.info(`Starting to listen on ${this.serverHost}:${this.serverPort}`);
    return new Promise((resolve, reject) => {
      this.server.bindAsync(`${this.serverHost}:${this.serverPort}`, this.serverCredentials, (err, _port) => {
        if (err) {
          return reject(err);
        }

        this.logger.info(`Listening on ${this.serverHost}:${this.serverPort}`);
        return resolve();
      });
    });
  }
}

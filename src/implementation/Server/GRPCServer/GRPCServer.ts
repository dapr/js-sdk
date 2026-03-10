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

import { createServer } from "http";
import { Server as HttpServer } from "http";
import GRPCServerImpl from "./GRPCServerImpl";
import { AppCallback, AppCallbackAlpha } from "../../../proto/dapr/proto/runtime/v1/appcallback_connect";
import IServer from "../../../interfaces/Server/IServer";
import { DaprClient } from "../../..";
import { Logger } from "../../../logger/Logger";
import { DaprServerOptions } from "../../../types/DaprServerOptions";
import { ConnectRouter, ServiceImpl } from "@connectrpc/connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";

export type IServerType = HttpServer;
export type IServerImplType = GRPCServerImpl;

export default class GRPCServer implements IServer {
  isInitialized: boolean;
  serverHost: string;
  serverPort: string;
  serverOptions: DaprServerOptions;
  server: IServerType;
  serverImpl: IServerImplType;
  client: DaprClient;
  private readonly logger: Logger;

  constructor(client: DaprClient, options: DaprServerOptions) {
    this.isInitialized = false;

    this.serverHost = "";
    this.serverPort = "";
    this.serverOptions = options;
    this.client = client;
    this.logger = new Logger("GRPCServer", "GRPCServer", client.options.logger);

    this.serverImpl = new GRPCServerImpl(client.options.logger);

    // Create Connect routes
    const routes = (router: ConnectRouter) => {
      this.logger.info("Adding Service Implementation - AppCallback");
      // @ts-ignore - AppCallback service definition compatibility with Connect
      router.service(AppCallback as any, {
        onInvoke: this.serverImpl.onInvoke.bind(this.serverImpl) as any,
        listTopicSubscriptions: this.serverImpl.listTopicSubscriptions.bind(this.serverImpl) as any,
        onTopicEvent: this.serverImpl.onTopicEvent.bind(this.serverImpl) as any,
        listInputBindings: this.serverImpl.listInputBindings.bind(this.serverImpl) as any,
        onBindingEvent: this.serverImpl.onBindingEvent.bind(this.serverImpl) as any,
      } as any);

      this.logger.info("Adding Service Implementation - AppCallbackAlpha");
      // @ts-ignore - AppCallbackAlpha service definition compatibility with Connect
      router.service(AppCallbackAlpha as any, {
        onBulkTopicEventAlpha1: this.serverImpl.onBulkTopicEventAlpha1.bind(this.serverImpl) as any,
      } as any);
    };

    // Create HTTP/2 server with Connect adapter
    this.server = createServer(
      connectNodeAdapter({ routes })
    );
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

    return new Promise((resolve, reject) => {
      this.logger.info(`Starting to listen on ${this.serverHost}:${this.serverPort}`);

      this.server.listen(parseInt(port), host, () => {
        this.logger.info(`Listening on ${this.serverHost}:${this.serverPort}`);
        this.isInitialized = true;
        resolve();
      });

      this.server.on("error", (err) => {
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          return reject(err);
        }

        this.isInitialized = false;
        return resolve();
      });
    });
  }
}

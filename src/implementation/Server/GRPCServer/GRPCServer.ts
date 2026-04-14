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

import * as http2 from "http2";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import { AppCallback, AppCallbackAlpha, AppCallbackHealthCheck } from "../../../proto/dapr/proto/runtime/v1/appcallback_pb";
import GRPCServerImpl from "./GRPCServerImpl";
import IServer from "../../../interfaces/Server/IServer";
import { DaprClient } from "../../..";
import { Logger } from "../../../logger/Logger";
import { DaprServerOptions } from "../../../types/DaprServerOptions";

export type IServerType = http2.Http2Server;
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

    this.serverImpl = new GRPCServerImpl(null as any, client.options.logger);

    const impl = this.serverImpl;

    const handler = connectNodeAdapter({
      routes: (router) => {
        router.service(AppCallback, {
          onInvoke: (req, ctx) => impl.onInvoke(req, ctx),
          listTopicSubscriptions: (req, ctx) => impl.listTopicSubscriptions(req, ctx),
          onTopicEvent: (req, ctx) => impl.onTopicEvent(req, ctx),
          listInputBindings: (req, ctx) => impl.listInputBindings(req, ctx),
          onBindingEvent: (req, ctx) => impl.onBindingEvent(req, ctx),
        });
        router.service(AppCallbackAlpha, {
          onBulkTopicEventAlpha1: (req, ctx) => impl.onBulkTopicEventAlpha1(req, ctx),
          onJobEventAlpha1: (req, ctx) => impl.onJobEventAlpha1(req, ctx),
        });
        router.service(AppCallbackHealthCheck, {
          healthCheck: (req, ctx) => impl.healthCheck(req, ctx),
        });
      },
    });

    this.server = http2.createServer(handler as any);
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

  getServerImpl(): IServerImplType {
    return this.serverImpl;
  }

  async start(host: string, port: string): Promise<void> {
    this.serverHost = host;
    this.serverPort = port;

    await this.initializeBind();
    this.isInitialized = true;
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

  private async initializeBind(): Promise<void> {
    this.logger.info(`Starting to listen on ${this.serverHost}:${this.serverPort}`);
    return new Promise((resolve, reject) => {
      this.server.on("error", (err) => reject(err));
      this.server.listen(parseInt(this.serverPort), this.serverHost, () => {
        this.logger.info(`Listening on ${this.serverHost}:${this.serverPort}`);
        return resolve();
      });
    });
  }
}

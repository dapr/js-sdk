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

import * as http from "http";
import express from "express";
import bodyParser from "body-parser";
import HTTPServerImpl from "./HTTPServerImpl";
import IServer from "../../../interfaces/Server/IServer";
import { DaprClient } from "../../..";
import { createHttpTerminator } from "http-terminator";
import { Logger } from "../../../logger/Logger";
import { DaprServerOptions } from "../../../types/DaprServerOptions";

export type IServerImplType = HTTPServerImpl;
export type IServerType = express.Express;

export default class HTTPServer implements IServer {
  server: IServerType;
  serverInstance: undefined | http.Server; // defined after start()
  serverTerminator: undefined | ReturnType<typeof createHttpTerminator>; // defined after start()
  serverHost: string;
  serverPort: string;
  serverAddress: string;
  serverOptions: DaprServerOptions;
  serverImpl: IServerImplType;
  isInitialized: boolean;
  client: DaprClient;
  private readonly logger: Logger;

  constructor(client: DaprClient, options: DaprServerOptions) {
    this.serverHost = "";
    this.serverPort = "";
    this.serverOptions = options;
    this.client = client;
    this.logger = new Logger("HTTPServer", "HTTPServer", client.options.logger);

    this.isInitialized = false;

    this.server = options.serverHttp ?? express();
    this.server.use(
      bodyParser.text({
        limit: `${this.serverOptions?.maxBodySizeMb ?? 4}mb`,
      }),
    );

    this.server.use(
      bodyParser.raw({
        type: ["application/octet-stream"],
        limit: `${this.serverOptions?.maxBodySizeMb ?? 4}mb`,
      }),
    );

    this.server.use(
      bodyParser.json({
        type: [
          "application/json",

          // Support cloudevents
          // https://github.com/cloudevents/spec/blob/v1.0.1/json-format.md
          "application/cloudevents+json",
          "application/*+json",
        ],
        limit: `${this.serverOptions?.maxBodySizeMb ?? 4}mb`,
      }),
    );

    this.serverImpl = new HTTPServerImpl(this.server, client.options.logger);

    this.serverAddress = "";
  }

  getServerAddress(): string {
    if (!this.isInitialized) {
      throw new Error(
        JSON.stringify({
          error: "HTTP_SERVER_NOT_INITIALIZED",
          error_message: "The HTTP server was not initialized, did you call `await HTTPServerSingleton.initialize()`?",
        }),
      );
    }

    return this.serverAddress;
  }

  getServer(): IServerType {
    return this.server as IServerType;
  }

  getServerPort(): string {
    return this.serverPort;
  }

  getServerHost(): string {
    return this.serverHost;
  }

  // We allow this, since this will register the routes and handlers!
  getServerImpl(): IServerImplType {
    return this.serverImpl;
  }

  async start(host: string, port: string): Promise<void> {
    this.serverHost = host;
    this.serverPort = port;

    // Initialize Server Listener
    this.serverInstance = await this.server.listen(parseInt(port, 10));
    this.logger.info(`Listening on ${port}`);
    this.serverAddress = `http://${host}:${port}`;

    // Create a terminator, as using a normal server.close() will not close the server immediately,
    // but wait for all connections to close.
    this.serverTerminator = createHttpTerminator({ server: this.serverInstance });

    // Add PubSub Routes
    this.logger.info(`Registering ${Object.keys(this.serverImpl.getSubscriptions()).length} PubSub Subscriptions`);
    this.server.get("/dapr/subscribe", (req, res) => {
      res.send(this.serverImpl.generateDaprPubSubSubscriptionList());
      this.logger.info(`Registered ${Object.keys(this.serverImpl.getSubscriptions()).length} PubSub Subscriptions`);
    });

    this.isInitialized = true;
  }

  async stop(): Promise<void> {
    if (this.serverTerminator) {
      await this.serverTerminator.terminate();
    }

    this.isInitialized = false;
  }
}

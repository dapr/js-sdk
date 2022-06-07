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

import Restana from "restana";
import bodyParser from "body-parser";
import HTTPServerImpl from "./HTTPServerImpl";
import IServer from "../../../interfaces/Server/IServer";
import * as NodeJSUtils from "../../../utils/NodeJS.util";
import { DaprClient } from "../../..";
import { createHttpTerminator } from 'http-terminator';
import { Logger } from "../../../logger/Logger";

// eslint-disable-next-line
export interface IServerImplType extends HTTPServerImpl { }
// eslint-disable-next-line
export interface IServerType extends Restana.Service<Restana.Protocol.HTTP> { }

export default class HTTPServer implements IServer {
  serverHost: string;
  serverPort: string;
  isInitialized: boolean;
  server: IServerType;
  serverAddress: string;
  serverImpl: IServerImplType;
  daprSidecarPollingDelayMs = 1000;
  client: DaprClient;
  private readonly logger: Logger;

  private readonly LOG_COMPONENT: string = "HTTPServer";
  private readonly LOG_AREA: string = "HTTPServer";

  constructor(client: DaprClient, logger: Logger) {
    this.serverHost = "";
    this.serverPort = "";
    this.client = client;
    this.logger = logger;

    this.isInitialized = false;

    this.server = Restana();
    this.server.use(bodyParser.text());
    this.server.use(bodyParser.raw());
    this.server.use(bodyParser.json({
      type: [
        "application/json",

        // Support cloudevents 
        // https://github.com/cloudevents/spec/blob/v1.0.1/json-format.md
        "application/cloudevents+json",
        "application/*+json",
      ]
    }));

    // body-parser is not async compatible, so we have to make it
    // this.server.use((req, res, next) => {
    //     return new Promise(resolve => {
    //         bodyParser.json()(req, res, (err) => {
    //             return resolve(next(err))
    //         })
    //     })
    // })

    this.serverImpl = new HTTPServerImpl();

    this.serverAddress = "";
  }

  getServerAddress(): string {
    if (!this.isInitialized) {
      throw new Error(JSON.stringify({
        error: "HTTP_SERVER_NOT_INITIALIZED",
        error_message: "The HTTP server was not initialized, did you call `await HTTPServerSingleton.initialize()`?"
      }));
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
    await this.server.start(parseInt(port, 10));
    this.logger.info(this.LOG_COMPONENT, this.LOG_AREA, `Listening on ${port}`);
    this.serverAddress = `http://${host}:${port}`;

    // Add PubSub Routes
    this.logger.info(this.LOG_COMPONENT, this.LOG_AREA, `Registering ${this.serverImpl.pubSubSubscriptionRoutes.length} PubSub Subscriptions`);
    this.server.get('/dapr/subscribe', (req, res) => {
      res.send(this.serverImpl.pubSubSubscriptionRoutes);
      this.logger.info(this.LOG_COMPONENT, this.LOG_AREA, `Registered ${this.serverImpl.pubSubSubscriptionRoutes.length} PubSub Subscriptions`);
    });

    // We need to call the Singleton to start listening on the port, else Dapr will not pick it up correctly
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    let isHealthy = false;
    let isHealthyRetryCount = 0;
    const isHealthyMaxRetryCount = 60; // 1s startup delay and we try max for 60s

    this.logger.info(this.LOG_COMPONENT, this.LOG_AREA, `Letting Dapr pick-up the server (Maximum 60s wait time)`);
    while (!isHealthy) {
      this.logger.verbose(this.LOG_COMPONENT, this.LOG_AREA, `Waiting for Dapr to start, retry counter is (#${isHealthyRetryCount})`);
      await NodeJSUtils.sleep(this.daprSidecarPollingDelayMs);
      isHealthy = await this.client.health.isHealthy();
      isHealthyRetryCount++;

      if (isHealthyRetryCount > isHealthyMaxRetryCount) {
        throw new Error("DAPR_SIDECAR_COULD_NOT_BE_STARTED");
      }
    }

    // We are initialized
    this.logger.info(this.LOG_COMPONENT, this.LOG_AREA, "Server Started");
    this.isInitialized = true;
  }

  async stop(): Promise<void> {
    const httpTerminator = createHttpTerminator({ server: this.server.getServer() });
    await httpTerminator.terminate();
    // await this.server.close();
    this.isInitialized = false;
  }
}
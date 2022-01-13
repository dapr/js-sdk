import Restana from "restana";
import bodyParser from "body-parser";
import HTTPServerImpl from "./HTTPServerImpl";
import IServer from "../../../interfaces/Server/IServer";
import * as NodeJSUtils from "../../../utils/NodeJS.util";
import { DaprClient } from "../../..";

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
  serverStartupDelay = 1000; // @todo: use health api https://docs.dapr.io/reference/api/health_api/
  client: DaprClient;

  constructor(client: DaprClient) {
    this.serverHost = "";
    this.serverPort = "";
    this.client = client;

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
    console.log(`[Dapr-JS] Listening on ${port}`);
    this.serverAddress = `http://${host}:${port}`;

    // Add PubSub Routes
    console.log(`[Dapr API][PubSub] Registering ${this.serverImpl.pubSubSubscriptionRoutes.length} PubSub Subscriptions`);
    this.server.get('/dapr/subscribe', (req, res) => {
      res.send(this.serverImpl.pubSubSubscriptionRoutes);
      console.log(`[Dapr API][PubSub] Registered ${this.serverImpl.pubSubSubscriptionRoutes.length} PubSub Subscriptions`);
    });

    // We need to call the Singleton to start listening on the port, else Dapr will not pick it up correctly
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    let isHealthy = false;
    let isHealthyRetryCount = 0;
    const isHealthyMaxRetryCount = 60; // 1s startup delay and we try max for 60s

    console.log(`[Dapr-JS] Letting Dapr pick-up the server (Maximum 60s wait time)`);
    while (!isHealthy) {
      console.log(`[Dapr-JS] - Waiting till Dapr Started (#${isHealthyRetryCount})`);
      await NodeJSUtils.sleep(this.serverStartupDelay);
      isHealthy = await this.client.health.isHealthy();
      isHealthyRetryCount++;

      if (isHealthyRetryCount > isHealthyMaxRetryCount) {
        throw new Error("DAPR_SIDECAR_COULD_NOT_BE_STARTED");
      }
    }

    // We are initialized
    console.log(`[Dapr-JS] Server Started`);
    this.isInitialized = true;
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.isInitialized = false;
  }
}
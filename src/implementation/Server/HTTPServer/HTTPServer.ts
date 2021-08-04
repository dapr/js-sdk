import Restana from "restana";
import bodyParser from "body-parser";
import HTTPServerImpl from "./HTTPServerImpl";
import IServer from "../../../interfaces/Server/IServer";
import * as NodeJSUtils from "../../../utils/NodeJS.util";

// tslint:disable-next-line
export interface IServerImplType extends HTTPServerImpl { };
// tslint:disable-next-line
export interface IServerType extends Restana.Service<Restana.Protocol.HTTP> { };

export default class HTTPServer implements IServer {
  serverHost: string;
  serverPort: string;
  isInitialized: boolean;
  server: IServerType;
  serverAddress: string;
  serverImpl: IServerImplType;
  serverStartupDelay: number = 250;

  constructor() {
    this.serverHost = "";
    this.serverPort = "";

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
    // if (!this.isInitialized) {
    //     throw new Error(JSON.stringify({
    //         error: "HTTP_SERVER_NOT_INITIALIZED",
    //         error_message: "The HTTP server was not initialized, did you call `await HTTPServerSingleton.initialize()`?"
    //     }));
    // }

    return this.server as IServerType;
  }

  // We allow this, since this will register the routes and handlers!
  getServerImpl(): IServerImplType {
    return this.serverImpl;
  }

  async close(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(JSON.stringify({
        error: "HTTP_SERVER_NOT_INITIALIZED",
        error_message: "The HTTP server was not initialized, did you call `await HTTPServerSingleton.initialize()`?"
      }));
    }

    await this.server.close();
    this.isInitialized = false;
    console.log(`[Dapr-JS] Closed Server`);
  }

  async startServer(host: string, port: string): Promise<void> {
    // Initialize Server Listener
    await this.server.start(parseInt(port, 10));
    console.log(`[Dapr-JS] Listening on ${port}`);
    this.serverAddress = `http://${host}:${port}`;

    // Add PubSub Routes
    console.log(`[Dapr API][PubSub] Registering ${this.serverImpl.pubSubSubscriptionRoutes.length} PubSub Subscriptions`);
    this.server.get('/dapr/subscribe', (req, res) => {
      res.send(this.serverImpl.pubSubSubscriptionRoutes);
      console.log(`[Dapr API][PubSub] Registered ${this.serverImpl.pubSubSubscriptionRoutes.length} PubSub Subscriptions`);
    })

    // We need to call the Singleton to start listening on the port, else Dapr will not pick it up correctly
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    console.log(`Letting Dapr pick-up the server (${this.serverStartupDelay}ms)`);
    await NodeJSUtils.sleep(this.serverStartupDelay);

    // We are initialized
    this.isInitialized = true;
  }
}
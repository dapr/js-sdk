import IServerInvokerStrategy from '../strategies/IServerInvokerStrategy';
import IServerBindingStrategy from '../strategies/IServerBindingStrategy';
import IServerPubSubStrategy from '../strategies/IServerPubSubStrategy';

import HTTPServerStrategy from '../strategies/HTTPServer/HTTPServer';

import HTTPServerPubSubStrategy from '../strategies/HTTPServer/pubsub';
import HTTPServerBindingStrategy from '../strategies/HTTPServer/binding';
import HTTPServerInvokerStrategy from '../strategies/HTTPServer/invoker';

import ADaprServer from '../abstract/ADaprServer';

export default class DaprServer extends ADaprServer {
  daprServer: HTTPServerStrategy;

  pubsub: IServerPubSubStrategy;
  binding: IServerBindingStrategy;
  invoker: IServerInvokerStrategy;

  constructor(daprHost: string, daprPort: string, daprPortApp: string = "50050") {
    super(daprHost, daprPort, daprPortApp);

    this.daprPortApp = process.env.DAPR_INTERNAL_SERVER_PORT || daprPortApp;
    this.daprServer = new HTTPServerStrategy();

    // If DAPR_INTERNAL_SERVER_PORT was not set, we set it
    // This will be fetched by the HTTPServerSingleton
    process.env.DAPR_INTERNAL_SERVER_PORT = this.daprPort;
    
    // // Get the App Port as set in the Dapr constructor
    // const randomPort = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
    // const appPort = parseInt(process.env.DAPR_INTERNAL_SERVER_PORT || "", 10) || randomPort;

    this.pubsub = new HTTPServerPubSubStrategy(this.daprServer);
    this.binding = new HTTPServerBindingStrategy(this.daprServer);
    this.invoker = new HTTPServerInvokerStrategy(this.daprServer);
  }

  async startServer() {
    await this.daprServer.startServer(this.daprHost, this.daprPortApp.toString());
  }
}
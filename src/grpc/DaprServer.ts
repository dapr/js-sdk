import IServerInvokerStrategy from '../strategies/IServerInvokerStrategy';
import IServerBindingStrategy from '../strategies/IServerBindingStrategy';
import IServerPubSubStrategy from '../strategies/IServerPubSubStrategy';

import GRPCServerStrategy from '../strategies/GRPCServer/GRPCServer';

import GRPCServerPubSubStrategy from '../strategies/GRPCServer/pubsub';
import GRPCServerBindingStrategy from '../strategies/GRPCServer/binding';
import GRPCServerInvokerStrategy from '../strategies/GRPCServer/invoker';

import ADaprServer from '../abstract/ADaprServer';

export default class DaprServer extends ADaprServer {
  daprServer: GRPCServerStrategy;

  pubsub: IServerPubSubStrategy;
  binding: IServerBindingStrategy;
  invoker: IServerInvokerStrategy;

  constructor(daprHost: string, daprPort: string, daprPortApp: string = "50050") {
    super(daprHost, daprPort, daprPortApp);

    this.daprServer = new GRPCServerStrategy();

    // If DAPR_INTERNAL_SERVER_PORT was not set, we set it
    // This will be fetched by the GRPCServerSingleton
    process.env.DAPR_INTERNAL_SERVER_PORT = this.daprPort;
    
    // // Get the App Port as set in the Dapr constructor
    // const randomPort = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
    // const appPort = parseInt(process.env.DAPR_INTERNAL_SERVER_PORT || "", 10) || randomPort;

    this.pubsub = new GRPCServerPubSubStrategy(this.daprServer);
    this.binding = new GRPCServerBindingStrategy(this.daprServer);
    this.invoker = new GRPCServerInvokerStrategy(this.daprServer);
  }

  async startServer() {
    await this.daprServer.startServer(this.daprHost, this.daprPortApp.toString());
  }
}
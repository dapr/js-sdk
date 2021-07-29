import GRPCServer from './GRPCServer/GRPCServer';

import GRPCServerPubSub from './GRPCServer/pubsub';
import GRPCServerBinding from './GRPCServer/binding';
import GRPCServerInvoker from './GRPCServer/invoker';
import GRPCServerActor from './GRPCServer/actor';

export default class DaprServer {
  daprServer: GRPCServer;

  pubsub: GRPCServerPubSub;
  binding: GRPCServerBinding;
  invoker: GRPCServerInvoker;
  actor: GRPCServerActor;

  constructor(serverHost: string = "127.0.0.1", serverPort: string = "50050") {
    this.daprServer = new GRPCServer(serverHost, serverPort);

    this.pubsub = new GRPCServerPubSub(this.daprServer);
    this.binding = new GRPCServerBinding(this.daprServer);
    this.invoker = new GRPCServerInvoker(this.daprServer);
    this.actor = new GRPCServerActor(this.daprServer);
  }

  async startServer() {
    await this.daprServer.startServer();
  }
}
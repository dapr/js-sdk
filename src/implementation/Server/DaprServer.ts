import IServer from '../../interfaces/Server/IServer';
import IServerPubSub from '../../interfaces/Server/IServerPubSub';
import IServerBinding from '../../interfaces/Server/IServerBinding';
import IServerInvoker from '../../interfaces/Server/IServerInvoker';
// import IServerActor from '../../interfaces/Server/IServerActor';

import CommunicationProtocolEnum from '../../enum/CommunicationProtocol.enum';
import GRPCServer from './GRPCServer/GRPCServer';
import GRPCServerPubSub from './GRPCServer/pubsub';
import GRPCServerBinding from './GRPCServer/binding';
import GRPCServerInvoker from './GRPCServer/invoker';
// import GRPCServerActor from '../../../GRPCServer/actor';
import HTTPServer from './HTTPServer/HTTPServer';
import HTTPServerPubSub from './HTTPServer/pubsub';
import HTTPServerBinding from './HTTPServer/binding';
import HTTPServerInvoker from './HTTPServer/invoker';
// import HTTPServerActor from './HTTPServer/actor';

export default class DaprServer {
  readonly daprHost: string;
  readonly daprPort: string;
  readonly communicationProtocol: CommunicationProtocolEnum;

  readonly daprServer: IServer;
  readonly pubsub: IServerPubSub;
  readonly binding: IServerBinding;
  readonly invoker: IServerInvoker;
  // actor: IServerActor;

  constructor(
    serverHost: string = "127.0.0.1"
    , serverPort: string = process.env.DAPR_SERVER_PORT || "50050"
    , communicationProtocol: CommunicationProtocolEnum = CommunicationProtocolEnum.HTTP
  ) {
    this.daprHost = serverHost;
    this.daprPort = serverPort;
    this.communicationProtocol = communicationProtocol;

    // If DAPR_SERVER_PORT was not set, we set it
    process.env.DAPR_SERVER_PORT = this.daprPort;

    // Builder
    switch (communicationProtocol) {
      case CommunicationProtocolEnum.GRPC:  {
        const server = new GRPCServer();

        this.daprServer = server;
        this.pubsub = new GRPCServerPubSub(server);
        this.binding = new GRPCServerBinding(server);
        this.invoker = new GRPCServerInvoker(server);
        // this.actor = new GRPCServerActor(this.daprServer);
        break;
      }
      case CommunicationProtocolEnum.HTTP: 
      default: {
        const server = new HTTPServer();

        this.daprServer = server;
        this.pubsub = new HTTPServerPubSub(server);
        this.binding = new HTTPServerBinding(server);
        this.invoker = new HTTPServerInvoker(server);
        // this.actor = new HTTPServerActor(this.daprServer);
        break;
      }
    }
  }

  async startServer() {
    await this.daprServer.startServer(this.daprHost, this.daprPort.toString());
  }
}
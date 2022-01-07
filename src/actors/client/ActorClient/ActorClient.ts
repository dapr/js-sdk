import CommunicationProtocolEnum from '../../../enum/CommunicationProtocol.enum';
import GRPCClient from '../../../implementation/Client/GRPCClient/GRPCClient';
import HTTPClient from '../../../implementation/Client/HTTPClient/HTTPClient';
import IClientActor from '../../../interfaces/Client/IClientActor';
import { DaprClientOptions } from '../../../types/DaprClientOptions';
import ActorClientGRPC from './ActorClientGRPC';
import ActorClientHTTP from './ActorClientHTTP';

export default class ActorClient {
  readonly daprHost: string;
  readonly daprPort: string;
  readonly communicationProtocol: CommunicationProtocolEnum;
  readonly actor: IClientActor;
  readonly options: DaprClientOptions;

  constructor(daprHost: string, daprPort: string, communicationProtocol: CommunicationProtocolEnum, options: DaprClientOptions = {
    isKeepAlive: true
  }) {
    this.daprHost = daprHost;
    this.daprPort = daprPort;
    this.communicationProtocol = communicationProtocol;
    this.options = options;

    // Builder
    switch (communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const client = new GRPCClient(this.daprHost, this.daprPort, this.options);
        this.actor = new ActorClientGRPC(client);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const client = new HTTPClient(this.daprHost, this.daprPort, this.options);
        this.actor = new ActorClientHTTP(client);
        break;
      }
    }
  }
}
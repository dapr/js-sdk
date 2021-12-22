import CommunicationProtocolEnum from '../../../enum/CommunicationProtocol.enum';
import GRPCClient from '../../../implementation/Client/GRPCClient/GRPCClient';
import HTTPClient from '../../../implementation/Client/HTTPClient/HTTPClient';
import IClientActor from '../../../interfaces/Client/IClientActor';
import ActorClientGRPC from './ActorClientGRPC';
import ActorClientHTTP from './ActorClientHTTP';

export default class ActorClient {
  readonly daprHost: string;
  readonly daprPort: string;
  readonly communicationProtocol: CommunicationProtocolEnum;
  readonly actor: IClientActor;

  constructor(daprHost: string, daprPort: string, communicationProtocol: CommunicationProtocolEnum) {
    this.daprHost = daprHost;
    this.daprPort = daprPort;
    this.communicationProtocol = communicationProtocol;

    // Builder
    switch (communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const client = new GRPCClient(this.daprHost, this.daprPort);
        this.actor = new ActorClientGRPC(client);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const client = new HTTPClient(this.daprHost, this.daprPort);
        this.actor = new ActorClientHTTP(client);
        break;
      }
    }
  }
}
import { DaprClient } from '../../..';
import CommunicationProtocolEnum from '../../../enum/CommunicationProtocol.enum';
import GRPCClient from '../../../implementation/Client/GRPCClient/GRPCClient';
import HTTPClient from '../../../implementation/Client/HTTPClient/HTTPClient';
import IClient from '../../../interfaces/Client/IClient';
import IClientActor from '../../../interfaces/Client/IClientActor';
import ActorClientGRPC from './ActorClientGRPC';
import ActorClientHTTP from './ActorClientHTTP';

export default class ActorClient {
  readonly daprClient: DaprClient;
  readonly actor: IClientActor;

  constructor(daprClient: DaprClient) {
    this.daprClient = daprClient;

    // Builder
    switch (daprClient.communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const client = new GRPCClient(this.daprClient.daprHost, this.daprClient.daprPort);
        this.actor = new ActorClientGRPC(client);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const client = new HTTPClient(this.daprClient.daprHost, this.daprClient.daprPort);
        this.actor = new ActorClientHTTP(client);
        break;
      }
    }
  }

  getDaprClient(): DaprClient {
    return this.daprClient;
  }
}
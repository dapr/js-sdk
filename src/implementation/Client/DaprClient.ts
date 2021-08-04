import IClientBinding from '../../interfaces/Client/IClientBinding';
import IClientPubSub from '../../interfaces/Client/IClientPubSub';
import IClientState from '../../interfaces/Client/IClientState';
import IClientInvoker from '../../interfaces/Client/IClientInvoker';
import IClientSecret from '../../interfaces/Client/IClientSecret';
import IClientActor from '../../interfaces/Client/IClientActor';
import IClient from '../../interfaces/Client/IClient';

import GRPCClientBinding from './GRPCClient/binding';
import GRPCClientPubSub from './GRPCClient/pubsub';
import GRPCClientState from './GRPCClient/state';
import GRPCClientInvoker from './GRPCClient/invoker';
import GRPCClientSecret from './GRPCClient/secret';
import GRPCClientActor from './GRPCClient/actor';
import GRPCClient from './GRPCClient/GRPCClient';

import HTTPClientBinding from './HTTPClient/binding';
import HTTPClientPubSub from './HTTPClient/pubsub';
import HTTPClientState from './HTTPClient/state';
import HTTPClientInvoker from './HTTPClient/invoker';
import HTTPClientSecret from './HTTPClient/secret';
import HTTPClientActor from './HTTPClient/actor';
import HTTPClient from './HTTPClient/HTTPClient';

import CommunicationProtocolEnum from '../../enum/CommunicationProtocol.enum';

export default class DaprClient {
  readonly daprHost: string;
  readonly daprPort: string;
  readonly communicationProtocol: CommunicationProtocolEnum;

  readonly daprClient: IClient;
  readonly pubsub: IClientPubSub;
  readonly state: IClientState;
  readonly binding: IClientBinding;
  readonly invoker: IClientInvoker;
  readonly secret: IClientSecret;
  readonly actor: IClientActor;

  constructor(
    daprHost: string
    , daprPort: string
    , communicationProtocol: CommunicationProtocolEnum = CommunicationProtocolEnum.HTTP
  ) {
    this.daprHost = daprHost;
    this.daprPort = daprPort;
    this.communicationProtocol = communicationProtocol;

    // Builder
    switch (communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const client = new GRPCClient(this.daprHost, this.daprPort);

        this.daprClient = client;
        this.state = new GRPCClientState(client);
        this.pubsub = new GRPCClientPubSub(client);
        this.binding = new GRPCClientBinding(client);
        this.invoker = new GRPCClientInvoker(client);
        this.secret = new GRPCClientSecret(client);
        this.actor = new GRPCClientActor(client);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const client = new HTTPClient(this.daprHost, this.daprPort);

        this.daprClient = client;
        this.state = new HTTPClientState(client);
        this.pubsub = new HTTPClientPubSub(client);
        this.binding = new HTTPClientBinding(client);
        this.invoker = new HTTPClientInvoker(client);
        this.secret = new HTTPClientSecret(client);
        this.actor = new HTTPClientActor(client);
        break;
      }
    }
  }

  static create(client: IClient): DaprClient {
    return new DaprClient(client.getClientHost(), client.getClientPort(), client.getClientCommunicationProtocol());
  }

  getDaprClient(): IClient {
    return this.daprClient;
  }

  getDaprHost(): string {
    return this.daprHost;
  }

  getDaprPort(): string {
    return this.daprPort;
  }
}
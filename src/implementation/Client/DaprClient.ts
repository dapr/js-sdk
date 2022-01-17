import IClientBinding from '../../interfaces/Client/IClientBinding';
import IClientPubSub from '../../interfaces/Client/IClientPubSub';
import IClientState from '../../interfaces/Client/IClientState';
import IClientInvoker from '../../interfaces/Client/IClientInvoker';
import IClientSecret from '../../interfaces/Client/IClientSecret';
import IClientHealth from '../../interfaces/Client/IClientHealth';
import IClientMetadata from '../../interfaces/Client/IClientMetadata';
import IClientConfiguration from '../../interfaces/Client/IClientConfiguration';
import IClient from '../../interfaces/Client/IClient';

import GRPCClientBinding from './GRPCClient/binding';
import GRPCClientPubSub from './GRPCClient/pubsub';
import GRPCClientState from './GRPCClient/state';
import GRPCClientInvoker from './GRPCClient/invoker';
import GRPCClientSecret from './GRPCClient/secret';
import GRPCClientHealth from './GRPCClient/health';
import GRPCClientMetadata from './GRPCClient/metadata';
import GRPCClientConfiguration from './GRPCClient/configuration';
import GRPCClient from './GRPCClient/GRPCClient';

import HTTPClientBinding from './HTTPClient/binding';
import HTTPClientPubSub from './HTTPClient/pubsub';
import HTTPClientState from './HTTPClient/state';
import HTTPClientInvoker from './HTTPClient/invoker';
import HTTPClientSecret from './HTTPClient/secret';
import HTTPClientHealth from './HTTPClient/health';
import HTTPClientMetadata from './HTTPClient/metadata';
import HTTPClientConfiguration from './HTTPClient/configuration';
import HTTPClient from './HTTPClient/HTTPClient';

import CommunicationProtocolEnum from '../../enum/CommunicationProtocol.enum';
import { DaprClientOptions } from '../../types/DaprClientOptions';

export default class DaprClient {
  readonly daprHost: string;
  readonly daprPort: string;
  readonly options: DaprClientOptions;
  readonly communicationProtocol: CommunicationProtocolEnum;

  readonly daprClient: IClient;
  readonly pubsub: IClientPubSub;
  readonly state: IClientState;
  readonly binding: IClientBinding;
  readonly invoker: IClientInvoker;
  readonly secret: IClientSecret;
  readonly health: IClientHealth;
  readonly metadata: IClientMetadata;
  readonly configuration: IClientConfiguration;

  constructor(
    daprHost: string
    , daprPort: string
    , communicationProtocol: CommunicationProtocolEnum = CommunicationProtocolEnum.HTTP
    , options: DaprClientOptions = {
      isKeepAlive: true
    }
  ) {
    this.daprHost = daprHost;
    this.daprPort = daprPort;
    this.communicationProtocol = communicationProtocol;
    this.options = options;

    // Validation on port
    if (!/^[0-9]+$/.test(this.daprPort)) {
      throw new Error('DAPR_CLIENT_INCORRECT_PORT');
    }

    // Builder
    switch (communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const client = new GRPCClient(this.daprHost, this.daprPort, this.options);
        this.daprClient = client;

        this.state = new GRPCClientState(client);
        this.pubsub = new GRPCClientPubSub(client);
        this.binding = new GRPCClientBinding(client);
        this.invoker = new GRPCClientInvoker(client);
        this.secret = new GRPCClientSecret(client);
        this.health = new GRPCClientHealth(client);
        this.metadata = new GRPCClientMetadata(client);
        this.configuration = new GRPCClientConfiguration(client);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const client = new HTTPClient(this.daprHost, this.daprPort, this.options);
        this.daprClient = client;

        this.state = new HTTPClientState(client);
        this.pubsub = new HTTPClientPubSub(client);
        this.binding = new HTTPClientBinding(client);
        this.invoker = new HTTPClientInvoker(client);
        this.secret = new HTTPClientSecret(client);
        this.health = new HTTPClientHealth(client);
        this.metadata = new HTTPClientMetadata(client);
        this.configuration = new HTTPClientConfiguration(client);
        break;
      }
    }
  }

  static create(client: IClient): DaprClient {
    return new DaprClient(client.getClientHost(), client.getClientPort(), client.getClientCommunicationProtocol(), client.getOptions());
  }

  async stop(): Promise<void> {
    await this.daprClient.stop();
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

  getOptions(): DaprClientOptions {
    return this.options;
  }

  getCommunicationProtocol(): CommunicationProtocolEnum {
    return this.communicationProtocol;
  }
}
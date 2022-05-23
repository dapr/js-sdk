/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import IClientBinding from '../../interfaces/Client/IClientBinding';
import IClientPubSub from '../../interfaces/Client/IClientPubSub';
import IClientState from '../../interfaces/Client/IClientState';
import IClientInvoker from '../../interfaces/Client/IClientInvoker';
import IClientSecret from '../../interfaces/Client/IClientSecret';
import IClientHealth from '../../interfaces/Client/IClientHealth';
import IClientMetadata from '../../interfaces/Client/IClientMetadata';
import IClientSidecar from '../../interfaces/Client/IClientSidecar';
import IClientConfiguration from '../../interfaces/Client/IClientConfiguration';
import IClientActorBuilder from '../../interfaces/Client/IClientActorBuilder';
import IClient from '../../interfaces/Client/IClient';

import GRPCClientBinding from './GRPCClient/binding';
import GRPCClientPubSub from './GRPCClient/pubsub';
import GRPCClientState from './GRPCClient/state';
import GRPCClientInvoker from './GRPCClient/invoker';
import GRPCClientSecret from './GRPCClient/secret';
import GRPCClientHealth from './GRPCClient/health';
import GRPCClientMetadata from './GRPCClient/metadata';
import GRPCClientSidecar from './GRPCClient/sidecar';
import GRPCClientConfiguration from './GRPCClient/configuration';
import GRPCClientActor from './GRPCClient/actor';
import GRPCClient from './GRPCClient/GRPCClient';

import HTTPClientBinding from './HTTPClient/binding';
import HTTPClientPubSub from './HTTPClient/pubsub';
import HTTPClientState from './HTTPClient/state';
import HTTPClientInvoker from './HTTPClient/invoker';
import HTTPClientSecret from './HTTPClient/secret';
import HTTPClientHealth from './HTTPClient/health';
import HTTPClientMetadata from './HTTPClient/metadata';
import HTTPClientSidecar from './HTTPClient/sidecar';
import HTTPClientConfiguration from './HTTPClient/configuration';
import HTTPClientActor from './HTTPClient/actor';
import HTTPClient from './HTTPClient/HTTPClient';

import CommunicationProtocolEnum from '../../enum/CommunicationProtocol.enum';
import { DaprClientOptions } from '../../types/DaprClientOptions';
import { Settings } from '../../utils/Settings.util';

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
  readonly sidecar: IClientSidecar;
  readonly configuration: IClientConfiguration;
  readonly actor: IClientActorBuilder;

  constructor(
    daprHost?: string
    , daprPort?: string
    , communicationProtocol: CommunicationProtocolEnum = CommunicationProtocolEnum.HTTP
    , options: DaprClientOptions = {
      isKeepAlive: true
    }
  ) {
    this.daprHost = daprHost ?? Settings.getDefaultHost();
    this.daprPort = daprPort ?? Settings.getDefaultPort(communicationProtocol);
    this.communicationProtocol = communicationProtocol;
    this.options = options;

    // Validation on port
    if (!/^[0-9]+$/.test(this.daprPort)) {
      throw new Error('DAPR_INCORRECT_SIDECAR_PORT');
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
        this.sidecar = new GRPCClientSidecar(client);
        this.configuration = new GRPCClientConfiguration(client);
        this.actor = new GRPCClientActor(client); // we use a abstractor here since we interface through a builder with the Actor Runtime
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
        this.sidecar = new HTTPClientSidecar(client);
        this.configuration = new HTTPClientConfiguration(client);
        this.actor = new HTTPClientActor(client); // we use a abstractor here since we interface through a builder with the Actor Runtime
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

  /**
   * Ensure the sidecar connection has been initialized
   * this method is not mandatory to be utilized as we will 
   * ensure the sidecar connection is initialized in the methods that require it
   */
  async start(): Promise<void> {
    await this.daprClient.start();
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
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
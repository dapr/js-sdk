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

import IClientBinding from "../../interfaces/Client/IClientBinding";
import IClientPubSub from "../../interfaces/Client/IClientPubSub";
import IClientState from "../../interfaces/Client/IClientState";
import IClientInvoker from "../../interfaces/Client/IClientInvoker";
import IClientSecret from "../../interfaces/Client/IClientSecret";
import IClientHealth from "../../interfaces/Client/IClientHealth";
import IClientMetadata from "../../interfaces/Client/IClientMetadata";
import IClientSidecar from "../../interfaces/Client/IClientSidecar";
import IClientConfiguration from "../../interfaces/Client/IClientConfiguration";
import IClientProxy from "../../interfaces/Client/IClientProxy";
import IClientLock from "../../interfaces/Client/IClientLock";
import IClientActorBuilder from "../../interfaces/Client/IClientActorBuilder";
import IClient from "../../interfaces/Client/IClient";

import GRPCClientBinding from "./GRPCClient/binding";
import GRPCClientPubSub from "./GRPCClient/pubsub";
import GRPCClientState from "./GRPCClient/state";
import GRPCClientInvoker from "./GRPCClient/invoker";
import GRPCClientSecret from "./GRPCClient/secret";
import GRPCClientHealth from "./GRPCClient/health";
import GRPCClientMetadata from "./GRPCClient/metadata";
import GRPCClientSidecar from "./GRPCClient/sidecar";
import GRPCClientConfiguration from "./GRPCClient/configuration";
import GRPCClientLock from "./GRPCClient/lock";
import GRPCClientActor from "./GRPCClient/actor";
import GRPCClient from "./GRPCClient/GRPCClient";

import HTTPClientBinding from "./HTTPClient/binding";
import HTTPClientPubSub from "./HTTPClient/pubsub";
import HTTPClientState from "./HTTPClient/state";
import HTTPClientInvoker from "./HTTPClient/invoker";
import HTTPClientSecret from "./HTTPClient/secret";
import HTTPClientHealth from "./HTTPClient/health";
import HTTPClientMetadata from "./HTTPClient/metadata";
import HTTPClientSidecar from "./HTTPClient/sidecar";
import HTTPClientConfiguration from "./HTTPClient/configuration";
import HTTPClientProxy from "./HTTPClient/proxy";
import HTTPClientLock from "./HTTPClient/lock";
import HTTPClientActor from "./HTTPClient/actor";
import HTTPClient from "./HTTPClient/HTTPClient";

import CommunicationProtocolEnum from "../../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "../../types/DaprClientOptions";
import { Settings } from "../../utils/Settings.util";
import { Logger } from "../../logger/Logger";
import GRPCClientProxy from "./GRPCClient/proxy";
import * as NodeJSUtils from "../../utils/NodeJS.util";
import { getClientOptions } from "../../utils/Client.util";

export default class DaprClient {
  readonly options: DaprClientOptions;
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
  readonly proxy: IClientProxy;
  readonly lock: IClientLock;
  readonly actor: IClientActorBuilder;

  private readonly logger: Logger;

  constructor(options: Partial<DaprClientOptions> = {}) {
    this.options = getClientOptions(options, Settings.getDefaultCommunicationProtocol(), undefined);
    this.logger = new Logger("DaprClient", "DaprClient", this.options.logger);

    // Validation on port
    if (this.options.daprPort && !/^[0-9]+$/.test(this.options.daprPort)) {
      throw new Error("DAPR_INCORRECT_SIDECAR_PORT");
    }

    // Builder
    switch (options.communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const client = new GRPCClient(this.options);
        this.daprClient = client;

        this.state = new GRPCClientState(client);
        this.pubsub = new GRPCClientPubSub(client);
        this.binding = new GRPCClientBinding(client);
        this.invoker = new GRPCClientInvoker(client);
        this.secret = new GRPCClientSecret(client);
        this.health = new GRPCClientHealth(client);
        this.metadata = new GRPCClientMetadata(client);
        this.sidecar = new GRPCClientSidecar(client);
        this.proxy = new GRPCClientProxy(client);
        this.configuration = new GRPCClientConfiguration(client);
        this.lock = new GRPCClientLock(client);
        this.actor = new GRPCClientActor(client); // we use an abstractor here since we interface through a builder with the Actor Runtime
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const client = new HTTPClient(this.options);
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
        this.proxy = new HTTPClientProxy(client);
        this.lock = new HTTPClientLock(client);
        this.actor = new HTTPClientActor(client); // we use an abstractor here since we interface through a builder with the Actor Runtime
        break;
      }
    }
  }

  static create(client: IClient): DaprClient {
    return new DaprClient(client.options);
  }

  static async awaitSidecarStarted(fnIsSidecarStarted: () => Promise<boolean>, logger: Logger): Promise<void> {
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    let isStarted = await fnIsSidecarStarted();
    let isStartedRetryCount = 0;
    const isStartedMaxRetryCount = 60; // 1s startup delay and we try max for 60s

    if (isStarted) {
      return;
    }

    logger.info(`Awaiting Sidecar to be Started`);
    while (!isStarted) {
      logger.verbose(`Waiting for the Dapr Sidecar to start, retry count: (#${isStartedRetryCount})`);
      await NodeJSUtils.sleep(Settings.getDaprSidecarPollingDelayMs());

      // Implement API call manually as we need to enable calling without initialization
      // everything routes through the `execute` method
      // to check health, we just ping the /metadata endpoint and see if we get a response
      isStarted = await fnIsSidecarStarted();

      // Finally, Handle the retry logic
      isStartedRetryCount++;

      if (isStartedRetryCount > isStartedMaxRetryCount) {
        throw new Error("DAPR_SIDECAR_COULD_NOT_BE_STARTED");
      }
    }
  }

  async stop(): Promise<void> {
    await this.daprClient.stop();
  }

  async start(): Promise<void> {
    await this.daprClient.start();
  }

  getIsInitialized(): boolean {
    return this.daprClient.getIsInitialized();
  }
}

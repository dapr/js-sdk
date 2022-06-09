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

import GRPCServer from "./GRPCServer";
import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";
import IServerPubSub from "../../../interfaces/Server/IServerPubSub";
import { Logger } from "../../../logger/Logger";

// https://docs.dapr.io/reference/api/pubsub_api/
export default class DaprPubSub implements IServerPubSub {
  server: GRPCServer;
  private readonly logger: Logger;

  constructor(server: GRPCServer) {
    this.server = server;
    this.logger = new Logger("GRPCServer", "PubSub", server.client.options.logger);
  }

  async subscribe(pubSubName: string, topic: string, cb: TypeDaprPubSubCallback): Promise<void> {
    this.logger.info(`Registering onTopicEvent Handler: PubSub = ${pubSubName}; Topic = ${topic}`)
    this.server.getServerImpl().registerPubSubSubscriptionHandler(pubSubName, topic, cb);
  }
}

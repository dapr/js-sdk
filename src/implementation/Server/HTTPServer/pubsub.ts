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

import { TypeDaprPubSubCallback } from '../../../types/DaprPubSubCallback.type';
import IServerPubSub from '../../../interfaces/Server/IServerPubSub';
import HTTPServer from './HTTPServer';
import { Logger } from '../../../logger/Logger';
import { PubSubSubscriptionOptionsType } from '../../../types/pubsub/PubSubSubscriptionOptions.type'
import { DaprPubSubSubscriptionType } from '../../../types/pubsub/DaprPubSubSubscription.type';

// https://docs.dapr.io/reference/api/pubsub_api/
export default class HTTPServerPubSub implements IServerPubSub {
  private readonly server: HTTPServer;
  private readonly logger: Logger;

  constructor(server: HTTPServer) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "PubSub", server.client.options.logger);
  }

  _generateRouteName(pubsubName: string, topic: string, path: string = "default"): string {
    return `${pubsubName}-${topic}-${path}`;
  }

  async subscribe(pubsubName: string, topic: string, cb: TypeDaprPubSubCallback, route: string = ""): Promise<void> {
    this.server.getServerImpl().registerPubsubSubscription(pubsubName, topic, { route });

    // Add the callback to the event handlers manually
    // @todo: we will deprecate this way of working? and require subscribeOnEvent?
    this.subscribeOnEvent(pubsubName, topic, route, cb)
  }

  async subscribeWithOptions(pubsubName: string, topic: string, cb: TypeDaprPubSubCallback
    , options: PubSubSubscriptionOptionsType = {}): Promise<void> {
    this.server.getServerImpl().registerPubsubSubscription(pubsubName, topic, options);
  }

  subscribeOnEvent(pubsubName: string, topic: string, route: string, cb: TypeDaprPubSubCallback): void {
    const routeEventHandlerKey = this.server.getServerImpl().generatePubsubSubscriptionEventHandlerKey(pubsubName, topic, route);
    this.server.getServerImpl().pubsubSubscriptionEventHandlers[routeEventHandlerKey].push(cb);
  }

  getSubscriptions(): DaprPubSubSubscriptionType[] {
    return this.server.getServerImpl().pubsubSubscriptions;
  }

  getSubscriptionEventHandlers(): { [key: string]: TypeDaprPubSubCallback[] } {
    return this.server.getServerImpl().pubsubSubscriptionEventHandlers;
  }
}
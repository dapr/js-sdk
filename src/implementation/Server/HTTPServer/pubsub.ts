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
import { DaprPubSubType } from '../../../types/pubsub/DaprPubSub.type';
import { DaprPubSubRouteType } from '../../../types/pubsub/DaprPubSubRouteType.type';

// https://docs.dapr.io/reference/api/pubsub_api/
export default class HTTPServerPubSub implements IServerPubSub {
  private readonly server: HTTPServer;
  private readonly logger: Logger;

  constructor(server: HTTPServer) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "PubSub", server.client.options.logger);
  }

  async subscribe(pubsubName: string, topic: string, cb: TypeDaprPubSubCallback
    , route: string | DaprPubSubRouteType = ""): Promise<void> {
    this.server.getServerImpl().registerPubsubSubscription(pubsubName, topic, { route });

    // Add the callback to the event handlers manually
    // @todo: we will deprecate this way of working? and require subscribeOnEvent?
    this.subscribeOnEvent(pubsubName, topic, route, cb)
  }

  async subscribeWithOptions(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): Promise<void> {
    this.server.getServerImpl().registerPubsubSubscription(pubsubName, topic, options);
  }

  getRoutes(): { [key: string]: any } {
    // We group it by pubsubName, topic, route
    let routes: { [key: string]: any } = {};

    for (const eventHandlerName of Object.keys(this.server.getServerImpl().pubsubRouteEventHandlers)) {
      const [pubsubName, topicName, route] = eventHandlerName.split("--");

      if (!routes[pubsubName]) {
        routes[pubsubName] = {};
      }

      if (!routes[pubsubName][topicName]) {
        routes[pubsubName][topicName] = [];
      }

      if (route === "default") {
        routes[pubsubName][topicName].push("");
      } else {
        routes[pubsubName][topicName].push(route);
      }
    }

    return routes;
  }

  subscribeOnEvent(pubsubName: string, topic: string, route: string | DaprPubSubRouteType, cb: TypeDaprPubSubCallback): void {
    if (typeof route === "string") {
      this.subscribeOnEventStringType(pubsubName, topic, route, cb);
    } else {
      this.subscribeOnEventDaprPubSubRouteType(pubsubName, topic, route, cb);
    }
  }

  subscribeOnEventDaprPubSubRouteType(pubsubName: string, topic: string
    , route: DaprPubSubRouteType, cb: TypeDaprPubSubCallback): void {
    // Register the default
    if (route.default) {
      const routeEventHandlerKey = this.server.getServerImpl().generatePubsubRouteEventHandlerKey(pubsubName, topic, route.default);
      this.subscribeOnEventWithRouteEventHandlerKey(pubsubName, topic, routeEventHandlerKey, cb);
    }

    // Register the rules
    if (route.rules) {
      for (const rule of route.rules) {
        const routeEventHandlerKey = this.server.getServerImpl().generatePubsubRouteEventHandlerKey(pubsubName, topic, rule);
        this.subscribeOnEventWithRouteEventHandlerKey(pubsubName, topic, routeEventHandlerKey, cb);
      }
    }
  }

  subscribeOnEventStringType(pubsubName: string, topic: string, route: string, cb: TypeDaprPubSubCallback): void {
    const routeEventHandlerKey = this.server.getServerImpl().generatePubsubRouteEventHandlerKey(pubsubName, topic, route);
    this.subscribeOnEventWithRouteEventHandlerKey(pubsubName, topic, routeEventHandlerKey, cb);
  }

  subscribeOnEventWithRouteEventHandlerKey(pubsubName: string, topic: string, routeEventHandlerKey: string, cb: TypeDaprPubSubCallback) {
    if (!this.server.getServerImpl().pubsubRouteEventHandlers[routeEventHandlerKey]) {
      throw new Error(`[PubSub: ${pubsubName}] no subscription found for topic: ${topic}`);
    }

    this.server.getServerImpl().pubsubRouteEventHandlers[routeEventHandlerKey].push(cb);
  }

  getSubscriptions(): DaprPubSubType[] {
    return this.server.getServerImpl().pubsubSubscriptions;
  }

  getSubscriptionEventHandlers(): { [key: string]: TypeDaprPubSubCallback[] } {
    return this.server.getServerImpl().pubsubRouteEventHandlers;
  }
}
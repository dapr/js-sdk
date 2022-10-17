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

import SubscribedMessageHttpResponse from "../../../enum/SubscribedMessageHttpResponse.enum";
import { Logger } from "../../../logger/Logger";
import { LoggerOptions } from "../../../types/logger/LoggerOptions";
import { DaprPubSubType } from "../../../types/pubsub/DaprPubSub.type";
import { PubSubSubscriptionsType } from "../../../types/pubsub/PubSubSubscriptions.type";
import { PubSubSubscriptionOptionsType } from "../../../types/pubsub/PubSubSubscriptionOptions.type";
import { PubSubSubscriptionTopicRoutesType } from "../../../types/pubsub/PubSubSubscriptionTopicRoutes.type";
import { IServerType } from "./HTTPServer";
import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";

export default class HTTPServerImpl {
  private readonly PUBSUB_DEFAULT_ROUTE_NAME = "default";
  private readonly PUBSUB_DEFAULT_ROUTE_NAME_DEADLETTER = "deadletter";
  private readonly server: IServerType;
  private readonly logger: Logger;

  // pubsubSubscriptions: DaprPubSubType[];
  // pubsubRouteEventHandlers: { [key: string]: TypeDaprPubSubCallback[] };

  // Contains all our event handlers and routes
  pubSubSubscriptions: PubSubSubscriptionsType;

  constructor(server: IServerType, loggerOptions?: LoggerOptions) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "HTTPServerImpl", loggerOptions);

    this.pubSubSubscriptions = {};
  }

  /**
   * When we subscribe, we subscribe to a topic
   * For this topic we can define "routes" which route to a certain callback depending on the event content
   * Each of these topics are handled by a EventHandler but there can be multiple handlers per pubsubname-topic-route combination
   *
   * We don't create the EventHandlers here but we ensure that the routes are registered and can receive POST events
   * -> we create POST /<route> endpoints for each, but we create them uniquely!
   * -> to ensure uniqueness, we just check if this.pubsubRouteEventHandlers[route] is set
   *
   * @param pubSubName
   * @param topicName
   * @param cb
   * @param options
   */
  registerPubsubSubscription(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): void {
    if (
      this.pubSubSubscriptions[pubsubName] &&
      this.pubSubSubscriptions[pubsubName][topic] &&
      this.pubSubSubscriptions[pubsubName][topic]
    ) {
      throw new Error(
        `The topic '${topic}' is already being subscribed to on PubSub '${pubsubName}', there can only be one topic registered.`,
      );
    }

    // Create pubsub subscription it if it doesn't exist
    if (!this.pubSubSubscriptions[pubsubName]) {
      this.pubSubSubscriptions[pubsubName] = {};
    }

    // Add the routes and dapr representation to the topic
    if (!this.pubSubSubscriptions[pubsubName][topic]) {
      this.pubSubSubscriptions[pubsubName][topic] = {
        routes: this.generatePubSubSubscriptionTopicRoutes(pubsubName, topic, options),
        dapr: this.generateDaprPubSubSubscription(pubsubName, topic, options),
      };
    }

    // Listen to the created endpoints on the HTTP Server
    for (const route of Object.keys(this.pubSubSubscriptions[pubsubName][topic].routes)) {
      const routeObj = this.pubSubSubscriptions[pubsubName][topic].routes[route];

      // Add a server POST handler
      this.server.post(`/${routeObj.path}`, async (req, res) => {
        // @ts-ignore
        // Parse the data of the body, we prioritize fetching the data key in body if possible
        // i.e. Redis returns { data: {} } and other services return {}
        // @todo: This will be deprecated in an upcoming major version and only req.body will be returned
        const data = req?.body?.data || req?.body;
        const headers = req.headers;

        // Process our callback
        try {
          const eventHandlers = routeObj.eventHandlers;
          await Promise.all(eventHandlers.map((cb) => cb(data, headers)));
        } catch (e) {
          this.logger.error(`[route-${routeObj.path}] Message processing failed, dropping: ${e}`);
          return res.send({ status: SubscribedMessageHttpResponse.DROP });
        }

        // Let Dapr know that the message was processed correctly
        this.logger.debug(`[route-${routeObj.path}] Ack'ing the message`);
        return res.send({ status: SubscribedMessageHttpResponse.SUCCESS });
      });
    }

    this.logger.info(
      `[Topic = ${topic}] Registered Subscription with routes: ${Object.keys(
        this.pubSubSubscriptions[pubsubName][topic].routes,
      ).join(", ")}`,
    );
  }

  registerPubSubSubscriptionEventHandler(
    pubsubName: string,
    topic: string,
    route: string | undefined,
    cb: TypeDaprPubSubCallback,
  ): void {
    route = this.generatePubSubSubscriptionTopicRouteName(route);
    this.pubSubSubscriptions[pubsubName][topic].routes[route ?? this.PUBSUB_DEFAULT_ROUTE_NAME].eventHandlers.push(cb);
  }

  generatePubSubSubscriptionTopicRouteName(route = "default") {
    return (route || this.PUBSUB_DEFAULT_ROUTE_NAME).replace("/", "");
  }

  generatePubSubSubscriptionTopicRoutes(
    pubsubName: string,
    topic: string,
    options: PubSubSubscriptionOptionsType = {},
  ): PubSubSubscriptionTopicRoutesType {
    const routes: PubSubSubscriptionTopicRoutesType = {};

    // options.route == DaprPubSubRouteType
    if (typeof options.route === "object") {
      // Add default
      if (options.route.default) {
        const routeName = this.generatePubSubSubscriptionTopicRouteName(options.route.default);

        routes[routeName] = {
          eventHandlers: [],
          path: this.generatePubsubPath(pubsubName, topic, routeName),
        };
      }

      // Add rules
      if (options.route.rules) {
        for (const rule of options.route.rules) {
          if (!routes[rule.path]) {
            const routeName = this.generatePubSubSubscriptionTopicRouteName(rule.path);

            routes[routeName] = {
              eventHandlers: [],
              path: this.generatePubsubPath(pubsubName, topic, routeName),
            };
          }
        }
      }
    }
    // options.route == String | undefined
    else {
      const routeName = this.generatePubSubSubscriptionTopicRouteName(options?.route);

      routes[routeName] = {
        eventHandlers: [],
        path: this.generatePubsubPath(pubsubName, topic, routeName),
      };
    }

    // Deadletter Support
    if (options.deadLetterTopic || options.deadLetterCallback) {
      const routeName = this.generatePubSubSubscriptionTopicRouteName(
        options?.deadLetterTopic ?? this.PUBSUB_DEFAULT_ROUTE_NAME_DEADLETTER,
      );

      // Initialize the route
      routes[routeName] = {
        eventHandlers: [],
        path: this.generatePubsubPath(pubsubName, topic, routeName),
      };

      // Add a callback if we have one provided
      if (options.deadLetterCallback) {
        routes[routeName].eventHandlers.push(options.deadLetterCallback);
      }
    }

    return routes;
  }

  generateDaprSubscriptionRoute(
    pubsubName: string,
    topic: string,
    route: string = this.PUBSUB_DEFAULT_ROUTE_NAME,
  ): string {
    return `/${this.generatePubsubPath(pubsubName, topic, route)}`;
  }

  /**
   * Generate a subscription object that will be used in the /dapr/subscribe endpoint
   * this will let dapr know that we have subscriptions and how they map to routes / deadletter
   *
   * Important: we internally translate the provided /example to -> /<pubsubname>-<topic>-example
   *            or if empty to /<pubsubname>-<topic>-default
   *            this is to ensure that HTTP Server endpoints are unique
   *
   * @param pubsubName
   * @param topic
   * @param options
   * @returns
   */
  generateDaprPubSubSubscription(
    pubsubName: string,
    topic: string,
    options: PubSubSubscriptionOptionsType = {},
  ): DaprPubSubType {
    // Process metadata
    let metadata: { [key: string]: any } | undefined;

    if (options.metadata) {
      metadata = {};

      for (const [key, value] of Object.entries(options.metadata)) {
        metadata[key] = JSON.stringify(value);
      }
    }

    // Process the route
    if (!options || !options?.route) {
      return {
        pubsubname: pubsubName,
        topic: topic,
        metadata: metadata,
        route: this.generateDaprSubscriptionRoute(pubsubName, topic),
        deadLetterTopic: options.deadLetterTopic,
      };
    } else if (typeof options.route === "string") {
      return {
        pubsubname: pubsubName,
        topic: topic,
        metadata: metadata,
        route: this.generateDaprSubscriptionRoute(pubsubName, topic, options.route),
        deadLetterTopic: options.deadLetterTopic,
      };
    } else {
      return {
        pubsubname: pubsubName,
        topic: topic,
        metadata: metadata,
        routes: options.route && {
          default: this.generateDaprSubscriptionRoute(pubsubName, topic, options.route?.default),
          rules: options.route?.rules?.map((rule) => ({
            match: rule.match,
            path: this.generateDaprSubscriptionRoute(pubsubName, topic, rule.path),
          })),
        },
        deadLetterTopic: options.deadLetterTopic,
      };
    }
  }

  generateDaprPubSubSubscriptionList(): DaprPubSubType[] {
    const dapr = [];

    for (const pubsub of Object.keys(this.pubSubSubscriptions)) {
      for (const topic of Object.keys(this.pubSubSubscriptions[pubsub])) {
        dapr.push(this.pubSubSubscriptions[pubsub][topic].dapr);
      }
    }

    return dapr;
  }

  /**
   * We generate a event handler key based on the path or the route
   * If the route is just a string, that is the path
   * Else the path is configured through a rule of DaprPubSubRuleType
   *
   * @param pubsubName
   * @param topic
   * @param route
   * @returns
   */
  generatePubsubPath(pubsubName: string, topic: string, route: string): string {
    let routeParsed = "";

    // First parse the route based on if it was a Rule or a String
    if (!route) {
      routeParsed = this.PUBSUB_DEFAULT_ROUTE_NAME;
    } else {
      routeParsed = route;
    }

    // Then, process it
    // Remove leading slashes
    if (routeParsed.startsWith("/")) {
      routeParsed = routeParsed.replace("/", ""); // will only remove first occurence
    }

    return `${pubsubName.toLowerCase()}--${topic.toLowerCase()}--${routeParsed}`;
  }
}

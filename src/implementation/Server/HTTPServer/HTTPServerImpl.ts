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

    // this.pubsubSubscriptions = []
    // this.pubsubRouteEventHandlers = {};
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
    if (this.pubSubSubscriptions[pubsubName] && this.pubSubSubscriptions[pubsubName][topic] && this.pubSubSubscriptions[pubsubName][topic]) {
      throw new Error(`The topic '${topic}' is already being subscribed to on PubSub '${pubsubName}', there can only be one topic registered.`);
    }

    // Create pubsub subscription it if it doesn't exist
    if (!this.pubSubSubscriptions[pubsubName]) {
      this.pubSubSubscriptions[pubsubName] = {};
    }

    // Add the routes and dapr representation to the topic
    if (!this.pubSubSubscriptions[pubsubName][topic]) {
      this.pubSubSubscriptions[pubsubName][topic] = {
        routes: this.generatePubSubSubscriptionTopicRoutes(pubsubName, topic, options),
        dapr: this.generateDaprPubSubSubscription(pubsubName, topic, options)
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

        // Process our callback
        try {
          const eventHandlers = routeObj.eventHandlers;
          await Promise.all(eventHandlers.map(cb => cb(data)));
        } catch (e) {
          this.logger.error(`[route-${routeObj.path}] Message processing failed, dropping: ${e}`);
          return res.send({ status: SubscribedMessageHttpResponse.DROP });
        }

        // Let Dapr know that the message was processed correctly
        this.logger.debug(`[route-${routeObj.path}] Ack'ing the message`);
        return res.send({ status: SubscribedMessageHttpResponse.SUCCESS });
      });
    }

    this.logger.info(`[Topic = ${topic}] Registered Subscription with routes: ${Object.keys(this.pubSubSubscriptions[pubsubName][topic].routes).join(", ")}`);
  }

  /**
   * Dapr accepts Pub Sub subscriptions based on PubSub Name, Topic Name, Route (based on rules)
   * We thus want to add each route to the HTTP server so Dapr can discover it and send events to it
   * This method takes care of:
   * 1. Registering the route on the HTTP Server
   * 2. Registering the subscription internally so we can keep track of it 
   *    - Including event handlers
   * 
   * @param pubsubName 
   * @param topic 
   * @param route 
   * @returns 
   */
  registerPubsubSubscriptionRouteStringType(pubsubName: string, topic: string, route: string = "default"): void {
    // Already set, nothing to do
    if (this.pubSubSubscriptions[pubsubName] && this.pubSubSubscriptions[pubsubName][topic] && this.pubSubSubscriptions[pubsubName][topic].routes[route]) {
      return;
    }

    const path = this.generatePubsubPath(pubsubName, topic, route);
    this.logger.info(`Registering Event Handler: ${path}`)

    // Create it if it doesn't exist
    if (!this.pubSubSubscriptions[pubsubName]) {
      this.pubSubSubscriptions[pubsubName] = {};
    }

    if (!this.pubSubSubscriptions[pubsubName][topic]) {
      this.pubSubSubscriptions[pubsubName][topic].routes = {};
    }

    if (!this.pubSubSubscriptions[pubsubName][route]) {
      this.pubSubSubscriptions[pubsubName][topic].routes[route] = {
        eventHandlers: [],
        path: path
      };
    }

    // Add a server POST handler
    this.server.post(`/${path}`, async (req, res) => {
      // @ts-ignore
      // Parse the data of the body, we prioritize fetching the data key in body if possible
      // i.e. Redis returns { data: {} } and other services return {}
      // @todo: This will be deprecated in an upcoming major version and only req.body will be returned
      const data = req?.body?.data || req?.body;

      // Process our callback
      try {
        const eventHandlers = this.pubSubSubscriptions[pubsubName][topic].routes[route].eventHandlers;
        await Promise.all(eventHandlers.map(cb => cb(data)));
      } catch (e) {
        this.logger.error(`[route-${path}] Message processing failed, dropping: ${e}`);
        return res.send({ status: SubscribedMessageHttpResponse.DROP });
      }

      // Let Dapr know that the message was processed correctly
      this.logger.debug(`[route-${path}] Ack'ing the message`);
      return res.send({ status: SubscribedMessageHttpResponse.SUCCESS });
    });
  }

  registerPubSubSubscriptionEventHandler(pubsubName: string, topic: string, route: string, cb: TypeDaprPubSubCallback): void {
    this.pubSubSubscriptions[pubsubName][topic].routes[route].eventHandlers.push(cb);
  }

  generatePubSubSubscriptionTopicRoutes(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): PubSubSubscriptionTopicRoutesType {
    let routes: PubSubSubscriptionTopicRoutesType = {};

    // options.route == DaprPubSubRouteType
    if (typeof options.route === "object") {
      // Add default
      if (options.route.default) {
        routes[options.route.default ?? "default"] = {
          eventHandlers: [],
          path: this.generatePubsubPath(pubsubName, topic, options.route.default ?? "default")
        }
      }

      // Add rules
      if (options.route.rules) {
        for (const rule of options.route.rules) {
          if (!routes[rule.path]) {
            routes[rule.path] = {
              eventHandlers: [],
              path: this.generatePubsubPath(pubsubName, topic, rule.path)
            }
          }
        }
      }
    }
    // options.route == String | undefined
    else {
      routes[options?.route ?? "default"] = {
        eventHandlers: [],
        path: this.generatePubsubPath(pubsubName, topic, options.route ?? "default")
      }
    }

    return routes;
  }

  generateDaprSubscriptionRoute(pubsubName: string, topic: string, route: string = "default"): string {
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
  generateDaprPubSubSubscription(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): DaprPubSubType {
    if (!options || !options?.route) {
      return {
        pubsubname: pubsubName,
        topic: topic,
        metadata: options.metadata,
        route: this.generateDaprSubscriptionRoute(pubsubName, topic),
        deadLetterTopic: options.deadLetterTopic
      }
    } else if (typeof options.route === "string") {
      return {
        pubsubname: pubsubName,
        topic: topic,
        metadata: options.metadata,
        route: this.generateDaprSubscriptionRoute(pubsubName, topic, options.route),
        deadLetterTopic: options.deadLetterTopic
      }
    } else {
      return {
        pubsubname: pubsubName,
        topic: topic,
        metadata: options.metadata,
        routes: options.route && {
          default: `${options.route?.default}`,
          rules: options.route?.rules?.map(rule => ({
            match: rule.match,
            path: this.generateDaprSubscriptionRoute(pubsubName, topic, rule.path),
          }))
        },
        deadLetterTopic: options.deadLetterTopic
      }
    }
  }

  generateDaprPubSubSubscriptionList(): DaprPubSubType[] {
    let dapr = [];

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
      routeParsed = "default";
    } else {
      routeParsed = route;
    }

    // Then, process it
    // Remove leading slashes
    if (routeParsed.startsWith('/')) {
      routeParsed = routeParsed.replace('/', ''); // will only remove first occurence
    }

    return `${pubsubName.toLowerCase()}--${topic.toLowerCase()}--${routeParsed}`;
  }
}
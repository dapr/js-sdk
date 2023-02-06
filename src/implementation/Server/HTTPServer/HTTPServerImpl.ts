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
import DaprPubSubStatusEnum from "../../../enum/DaprPubSubStatus.enum";
import { IncomingHttpHeaders } from "http";
import { PubSubSubscriptionTopicRouteType } from "../../../types/pubsub/PubSubSubscriptionTopicRoute.type";

export default class HTTPServerImpl {
  private readonly PUBSUB_DEFAULT_ROUTE_NAME = "default";
  private readonly PUBSUB_DEFAULT_ROUTE_NAME_DEADLETTER = "deadletter";
  private readonly server: IServerType;
  private readonly logger: Logger;

  // Contains all our event handlers and routes
  pubSubSubscriptions: PubSubSubscriptionsType;

  constructor(server: IServerType, loggerOptions?: LoggerOptions) {
    this.server = server;
    this.logger = new Logger("HTTPServer", "HTTPServerImpl", loggerOptions);

    this.pubSubSubscriptions = {};
  }

  /**
   * Extracts data from the subscribe request body.
   * Data should be present in req.body.data or req.body.data_base64 depending on the rawPayload metadata.
   * If the data is not found, the request body is returned as-is.
   * @param req HTTP Request
   * @returns Data from the request body.
   */
  extractDataFromSubscribeRequest(req: any): any {
    const payload = req.body ?? "";

    // The payload should be an object with string keys and any values.
    if (!(payload instanceof Object) || payload instanceof Array || payload instanceof Buffer) {
      this.logger.warn(`Could not extract data from request body ${JSON.stringify(payload)}, returning it as-is.`);
      return payload;
    }

    // Use data from req.body.data if present.
    if (payload.data) {
      return payload.data;
    }

    // In case of rawPayload, data is present in req.body.data_base64 as base64 encoded string.
    if (payload.data_base64 && typeof payload.data_base64 === "string") {
      const parsedBase64 = Buffer.from(payload.data_base64, "base64").toString();

      try {
        // This can be JSON, so try to parse it.
        return JSON.parse(parsedBase64);
      } catch (_e) {
        // If it's not JSON, use the string as-is.
        return parsedBase64;
      }
    }

    // If we can't find the data, return the request body as-is.
    this.logger.warn(`Could not extract data from request body ${JSON.stringify(payload)}, returning it as-is.`);
    return payload;
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
        const headers = req.headers;
        const data = this.extractDataFromSubscribeRequest(req);

        // Process the callbacks
        // we handle priority of status on `RETRY` > `DROP` > `SUCCESS` and default to `SUCCESS`
        const status = await this.processPubSubCallbacks(routeObj, data, headers);
        return res.send({ status });
      });
    }

    this.logger.info(
      `[Topic = ${topic}] Registered Subscription with routes: ${Object.keys(
        this.pubSubSubscriptions[pubsubName][topic].routes,
      ).join(", ")}`,
    );
  }

  async processPubSubCallbacks(
    routeObj: PubSubSubscriptionTopicRouteType,
    data: any,
    headers: IncomingHttpHeaders,
  ): Promise<DaprPubSubStatusEnum> {
    const eventHandlers = routeObj.eventHandlers;
    let statuses = [];

    // Process the callbacks (default: SUCCESS)
    for (const cb of eventHandlers) {
      let status = DaprPubSubStatusEnum.SUCCESS;

      try {
        status = await cb(data, headers);
      } catch (e) {
        // We catch and log an error, but we don't do anything with it as the statuses should define that
        this.logger.error(`[route-${routeObj.path}] Message processing failed, ${e}`);

        if (status === DaprPubSubStatusEnum.SUCCESS) {
          status = DaprPubSubStatusEnum.RETRY;
        }
      }

      statuses.push(status ?? DaprPubSubStatusEnum.SUCCESS);
    }

    // Look at the statuses and return the highest priority
    // we handle priority of status on `RETRY` > `DROP` > `SUCCESS`
    if (statuses.includes(DaprPubSubStatusEnum.RETRY)) {
      this.logger.debug(`[route-${routeObj.path}] Retrying message`);
      return DaprPubSubStatusEnum.RETRY;
    } else if (statuses.includes(DaprPubSubStatusEnum.DROP)) {
      this.logger.debug(`[route-${routeObj.path}] Dropping message`);
      return DaprPubSubStatusEnum.DROP;
    } else {
      this.logger.debug(`[route-${routeObj.path}] Acknowledging message`);
      return DaprPubSubStatusEnum.SUCCESS;
    }
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

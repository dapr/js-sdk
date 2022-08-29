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

import * as grpc from "@grpc/grpc-js";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Any } from "google-protobuf/google/protobuf/any_pb";

import { IAppCallbackServer } from "../../../proto/dapr/proto/runtime/v1/appcallback_grpc_pb";
import { HTTPExtension, InvokeRequest, InvokeResponse } from '../../../proto/dapr/proto/common/v1/common_pb';
import { BindingEventRequest, BindingEventResponse, ListInputBindingsResponse, ListTopicSubscriptionsResponse, TopicEventRequest, TopicEventResponse, TopicRoutes, TopicRule, TopicSubscription } from "../../../proto/dapr/proto/runtime/v1/appcallback_pb";
import { TypeDaprInvokerCallback } from "../../../types/DaprInvokerCallback.type";
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import { TypeDaprBindingCallback } from "../../../types/DaprBindingCallback.type";
import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";
import { Logger } from "../../../logger/Logger";
import { LoggerOptions } from "../../../types/logger/LoggerOptions";
import { PubSubSubscriptionOptionsType } from "../../../types/pubsub/PubSubSubscriptionOptions.type";
import { IServerType } from "./GRPCServer";
import { PubSubSubscriptionsType } from "../../../types/pubsub/PubSubSubscriptions.type";
import { DaprPubSubType } from "../../../types/pubsub/DaprPubSub.type";
import { PubSubSubscriptionTopicRoutesType } from "../../../types/pubsub/PubSubSubscriptionTopicRoutes.type";
import SubscribedMessageHttpResponse from "../../../enum/SubscribedMessageHttpResponse.enum";


// https://github.com/badsyntax/grpc-js-typescript/issues/1#issuecomment-705419742
// @ts-ignore
export default class GRPCServerImpl implements IAppCallbackServer {
  private readonly PUBSUB_DEFAULT_ROUTE_NAME = "default";
  private readonly logger: Logger;
  private readonly server: IServerType;

  handlersInvoke: { [key: string]: TypeDaprInvokerCallback };
  handlersBindings: { [key: string]: TypeDaprBindingCallback };
  pubSubSubscriptions: PubSubSubscriptionsType;

  constructor(server: IServerType, loggerOptions?: LoggerOptions) {
    this.server = server;
    this.logger = new Logger("GRPCServer", "GRPCServerImpl", loggerOptions);

    this.handlersInvoke = {};
    this.handlersBindings = {};
    this.pubSubSubscriptions = {};
  }

  createPubSubSubscriptionHandlerKey(pubSubName: string, topicName: string): string {
    return `${pubSubName.toLowerCase()}|${topicName.toLowerCase()}`;
  }

  createInputBindingHandlerKey(bindingName: string): string {
    return `${bindingName.toLowerCase()}`;
  }

  createOnInvokeHandlerKey(httpMethod: string, methodName: string): string {
    return `${httpMethod.toLowerCase()}|${methodName.toLowerCase()}`;
  }

  registerOnInvokeHandler(httpMethod: string, methodName: string, cb: TypeDaprInvokerCallback): void {
    const handlerKey = this.createOnInvokeHandlerKey(httpMethod, methodName);
    this.handlersInvoke[handlerKey] = cb;
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

    this.logger.info(`[Topic = ${topic}] Registered Subscription with routes: ${Object.keys(this.pubSubSubscriptions[pubsubName][topic].routes).join(", ")}`);
  }

  registerPubSubSubscriptionEventHandler(pubsubName: string, topic: string, route: string, cb: TypeDaprPubSubCallback): void {
    route = (route || this.PUBSUB_DEFAULT_ROUTE_NAME).replace("/", "");
    this.pubSubSubscriptions[pubsubName][topic].routes[route ?? this.PUBSUB_DEFAULT_ROUTE_NAME].eventHandlers.push(cb);
  }

  generatePubSubSubscriptionTopicRouteName(route: string = "default") {
    return (route || this.PUBSUB_DEFAULT_ROUTE_NAME).replace("/", "");
  }

  generatePubSubSubscriptionTopicRoutes(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType = {}): PubSubSubscriptionTopicRoutesType {
    let routes: PubSubSubscriptionTopicRoutesType = {};

    // options.route == DaprPubSubRouteType
    if (typeof options.route === "object") {
      // Add default
      if (options.route.default) {
        const routeName = this.generatePubSubSubscriptionTopicRouteName(options.route.default);

        routes[routeName] = {
          eventHandlers: [],
          path: this.generatePubsubPath(pubsubName, topic, routeName)
        }
      }

      // Add rules
      if (options.route.rules) {
        for (const rule of options.route.rules) {
          if (!routes[rule.path]) {
            const routeName = this.generatePubSubSubscriptionTopicRouteName(rule.path);

            routes[routeName] = {
              eventHandlers: [],
              path: this.generatePubsubPath(pubsubName, topic, routeName)
            }
          }
        }
      }
    }
    // options.route == String | undefined
    else {
      const routeName = this.generatePubSubSubscriptionTopicRouteName(options?.route);

      routes[routeName] = {
        eventHandlers: [],
        path: this.generatePubsubPath(pubsubName, topic, routeName)
      }
    }

    // Deadletter Support
    if (options.deadLetterTopic) {
      const routeName = this.generatePubSubSubscriptionTopicRouteName(options?.deadLetterTopic);

      routes[routeName] = {
        eventHandlers: [],
        path: this.generatePubsubPath(pubsubName, topic, routeName)
      }
    }

    return routes;
  }

  generateDaprSubscriptionRoute(pubsubName: string, topic: string, route: string = this.PUBSUB_DEFAULT_ROUTE_NAME): string {
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
      routeParsed = this.PUBSUB_DEFAULT_ROUTE_NAME;
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

  registerInputBindingHandler(bindingName: string, cb: TypeDaprInvokerCallback): void {
    const handlerKey = this.createInputBindingHandlerKey(bindingName);
    this.handlersBindings[handlerKey] = cb;
  }

  // '(call: ServerUnaryCall<InvokeRequest, InvokeResponse>, callback: sendUnaryData<InvokeResponse>) => Promise<...>'
  // handleUnaryCall<InvokeRequest, InvokeResponse>'.

  async onInvoke(call: grpc.ServerUnaryCall<InvokeRequest, InvokeResponse>, callback: grpc.sendUnaryData<InvokeResponse>): Promise<void> {
    const method = call.request.getMethod();
    const query = (call.request.getHttpExtension() as HTTPExtension).toObject();
    const methodStr = HttpVerbUtil.convertHttpVerbNumberToString(query.verb);
    const handlersInvokeKey = `${methodStr.toLowerCase()}|${method.toLowerCase()}`;

    if (!this.handlersInvoke[handlersInvokeKey]) {
      this.logger.warn(`${methodStr} /${method} was not handled`)
      return;
    }

    const body = Buffer.from((call.request.getData() as Any).getValue()).toString();
    const contentType = call.request.getContentType();

    // Invoke the Method Callback
    // @TODO add call.metadata, it has headers of original HTTP request.
    const invokeResponseData = await this.handlersInvoke[handlersInvokeKey]({
      body,
      query: query.querystring,
      metadata: {
        contentType
      }
    });

    // Generate Response
    const res = new InvokeResponse();
    res.setContentType("application/json");

    if (invokeResponseData) {
      const msgSerialized = new Any();
      msgSerialized.setValue(Buffer.from(JSON.stringify(invokeResponseData), "utf-8"));
      res.setData(msgSerialized);
    }
    // @TODO add Error Handleling, for ex if service returned error with status code
    // also maybe we can map GRPC error codes in a enum

    return callback(null, res);
  }

  // @todo: WIP
  async onBindingEvent(call: grpc.ServerUnaryCall<BindingEventRequest, BindingEventResponse>, callback: grpc.sendUnaryData<BindingEventResponse>): Promise<void> {
    const req = call.request;
    const handlerKey = this.createInputBindingHandlerKey(req.getName());

    if (!this.handlersBindings[handlerKey]) {
      this.logger.warn(`Event for binding: "${handlerKey}" was not handled`);
      return;
    }

    const data = Buffer.from(req.getData()).toString();

    let dataParsed;

    try {
      dataParsed = JSON.parse(data);
    } catch (e) {
      dataParsed = data;
    }

    await this.handlersBindings[handlerKey](dataParsed);

    // @todo: we should add the state store or output binding binding
    // see: https://docs.dapr.io/reference/api/bindings_api/#binding-endpoints
    const res = new BindingEventResponse();
    return callback(null, res);
  }

  // @todo: WIP
  async onTopicEvent(call: grpc.ServerUnaryCall<TopicEventRequest, TopicEventResponse>, callback: grpc.sendUnaryData<TopicEventResponse>): Promise<void> {
    const req = call.request;
    const pubsubName = req.getPubsubName();
    const topic = req.getTopic();

    // Route is unique to pubsub and topic and has format pubsub--topic--route so we strip it since else we can't find the route
    const route = this.generatePubSubSubscriptionTopicRouteName(req.getPath().replace(`${pubsubName}--${topic}--`, ""));

    if (!this.pubSubSubscriptions[pubsubName] || !this.pubSubSubscriptions[pubsubName][topic] || !this.pubSubSubscriptions[pubsubName][topic].routes[route]) {
      this.logger.warn(`The topic '${topic}' is not being subscribed to on PubSub '${pubsubName}' for route '${route}'.`);
      return;
    }

    const data = Buffer.from(req.getData()).toString();
    let dataParsed: any;

    try {
      dataParsed = JSON.parse(data);
    } catch (e) {
      dataParsed = data;
    }

    const res = new TopicEventResponse();

    try {
      const eventHandlers = this.pubSubSubscriptions[pubsubName][topic].routes[route].eventHandlers;
      await Promise.all(eventHandlers.map(cb => cb(dataParsed)));
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.SUCCESS);
    } catch (e) {
      // @todo: for now we drop, maybe we should allow retrying as well more easily?
      this.logger.error(`Error handling topic event: ${e}`);
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.DROP);
    }

    return callback(null, res);
  }

  // Dapr will call this on startup to see which topics it is subscribed to
  async listTopicSubscriptions(call: grpc.ServerUnaryCall<Empty, ListTopicSubscriptionsResponse>, callback: grpc.sendUnaryData<ListTopicSubscriptionsResponse>): Promise<void> {
    const res = new ListTopicSubscriptionsResponse();

    const subscriptions = [];

    for (const pubsub of Object.keys(this.pubSubSubscriptions)) {
      for (const topic of Object.keys(this.pubSubSubscriptions[pubsub])) {
        const topicSubscription = new TopicSubscription();
        topicSubscription.setPubsubName(pubsub);
        topicSubscription.setTopic(topic);

        // Dapr routes
        const daprConfig = this.pubSubSubscriptions[pubsub][topic].dapr;

        if (daprConfig?.deadLetterTopic) {
          topicSubscription.setDeadLetterTopic(daprConfig.deadLetterTopic);
        }

        if (daprConfig?.routes) {
          let routes = new TopicRoutes();

          if (daprConfig?.routes?.default) {
            routes.setDefault(daprConfig?.routes?.default);
          }

          if (daprConfig?.routes?.rules) {
            for (const ruleItem of daprConfig?.routes?.rules) {
              let rule = new TopicRule();
              rule.setMatch(ruleItem.match);
              rule.setPath(ruleItem.path);
              routes.addRules(rule);
            }
          }

          topicSubscription.setRoutes(routes);
        } else {
          let routes = new TopicRoutes();
          routes.setDefault(daprConfig?.route || this.PUBSUB_DEFAULT_ROUTE_NAME);
          topicSubscription.setRoutes(routes);
        }

        subscriptions.push(topicSubscription);
      }
    }

    res.setSubscriptionsList(subscriptions);

    return callback(null, res);
  }

  // @todo: WIP
  async listInputBindings(call: grpc.ServerUnaryCall<Empty, ListInputBindingsResponse>, callback: grpc.sendUnaryData<ListInputBindingsResponse>): Promise<void> {
    const res = new ListInputBindingsResponse();
    res.setBindingsList(Object.keys(this.handlersBindings));
    return callback(null, res);
  }
}
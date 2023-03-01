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
import { HTTPExtension, InvokeRequest, InvokeResponse } from "../../../proto/dapr/proto/common/v1/common_pb";
import {
  BindingEventRequest,
  BindingEventResponse,
  BulkSubscribeConfig,
  ListInputBindingsResponse,
  ListTopicSubscriptionsResponse,
  TopicEventRequest,
  TopicEventResponse,
  TopicRoutes,
  TopicRule,
  TopicSubscription,
  TopicEventBulkRequest,
  TopicEventBulkResponse,
  TopicEventBulkResponseEntry,
  TopicEventCERequest,
} from "../../../proto/dapr/proto/runtime/v1/appcallback_pb";
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
import { DaprInvokerCallbackFunction } from "../../../types/DaprInvokerCallback.type";
import { PubSubSubscriptionTopicRouteType } from "../../../types/pubsub/PubSubSubscriptionTopicRoute.type";
import DaprPubSubStatusEnum from "../../../enum/DaprPubSubStatus.enum";
import { deserializeGrpc } from "../../../utils/Deserializer.util";

// https://github.com/badsyntax/grpc-js-typescript/issues/1#issuecomment-705419742
// @ts-ignore
export default class GRPCServerImpl implements IAppCallbackServer {
  private readonly PUBSUB_DEFAULT_ROUTE_NAME = "default";
  private readonly PUBSUB_DEFAULT_ROUTE_NAME_DEADLETTER = "deadletter";
  private readonly logger: Logger;
  private readonly server: IServerType;

  handlersInvoke: { [key: string]: DaprInvokerCallbackFunction };
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

  registerOnInvokeHandler(httpMethod: string, methodName: string, cb: DaprInvokerCallbackFunction): void {
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
        bulkSubscribe: options.bulkSubscribe,
      };
    } else if (typeof options.route === "string") {
      return {
        pubsubname: pubsubName,
        topic: topic,
        metadata: metadata,
        route: this.generateDaprSubscriptionRoute(pubsubName, topic, options.route),
        deadLetterTopic: options.deadLetterTopic,
        bulkSubscribe: options.bulkSubscribe,
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
        bulkSubscribe: options.bulkSubscribe,
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

  registerInputBindingHandler(bindingName: string, cb: DaprInvokerCallbackFunction): void {
    const handlerKey = this.createInputBindingHandlerKey(bindingName);
    this.handlersBindings[handlerKey] = cb;
  }

  // '(call: ServerUnaryCall<InvokeRequest, InvokeResponse>, callback: sendUnaryData<InvokeResponse>) => Promise<...>'
  // handleUnaryCall<InvokeRequest, InvokeResponse>'.

  async onInvoke(
    call: grpc.ServerUnaryCall<InvokeRequest, InvokeResponse>,
    callback: grpc.sendUnaryData<InvokeResponse>,
  ): Promise<void> {
    const method = call.request.getMethod();
    const query = (call.request.getHttpExtension() as HTTPExtension).toObject();
    const methodStr = HttpVerbUtil.convertHttpVerbNumberToString(query.verb);
    const handlersInvokeKey = `${methodStr.toLowerCase()}|${method.toLowerCase()}`;

    if (!this.handlersInvoke[handlersInvokeKey]) {
      this.logger.warn(`${methodStr} /${method} was not handled`);
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
        contentType,
      },
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
  async onBindingEvent(
    call: grpc.ServerUnaryCall<BindingEventRequest, BindingEventResponse>,
    callback: grpc.sendUnaryData<BindingEventResponse>,
  ): Promise<void> {
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

  async onTopicEvent(
    call: grpc.ServerUnaryCall<TopicEventRequest, TopicEventResponse>,
    callback: grpc.sendUnaryData<TopicEventResponse>,
  ): Promise<void> {
    const req = call.request;

    const pubsubName = req.getPubsubName();
    const topic = req.getTopic();

    // Route is unique to pubsub and topic and has format pubsub--topic--route so we strip it since else we can't find the route
    const route = this.generatePubSubSubscriptionTopicRouteName(req.getPath().replace(`${pubsubName}--${topic}--`, ""));

    if (
      !this.pubSubSubscriptions[pubsubName] ||
      !this.pubSubSubscriptions[pubsubName][topic] ||
      !this.pubSubSubscriptions[pubsubName][topic].routes[route]
    ) {
      this.logger.warn(
        `The topic '${topic}' is not being subscribed to on PubSub '${pubsubName}' for route '${route}'.`,
      );
      return;
    }

    const data = deserializeGrpc(req.getDataContentType(), req.getData());

    const res = new TopicEventResponse();

    // Get the headers
    const headers: { [key: string]: string } = {};

    for (const [key, value] of Object.entries(call.metadata.toHttp2Headers())) {
      if (value) {
        headers[key] = value.toString();
      }
    }

    // Process the callbacks
    // we handle priority of status on `RETRY` > `DROP` > `SUCCESS` and default to `SUCCESS`
    const routeObj = this.pubSubSubscriptions[pubsubName][topic].routes[route];
    const status = await this.processPubSubCallbacks(routeObj, data, headers);

    switch (status) {
      case DaprPubSubStatusEnum.RETRY:
        res.setStatus(TopicEventResponse.TopicEventResponseStatus.RETRY);
        break;
      case DaprPubSubStatusEnum.DROP:
        res.setStatus(TopicEventResponse.TopicEventResponseStatus.DROP);
        break;
      case DaprPubSubStatusEnum.SUCCESS:
      default:
        res.setStatus(TopicEventResponse.TopicEventResponseStatus.SUCCESS);
        break;
    }

    return callback(null, res);
  }

  async onBulkTopicEventAlpha1(
    call: grpc.ServerUnaryCall<TopicEventBulkRequest, TopicEventBulkResponse>,
    callback: grpc.sendUnaryData<TopicEventBulkResponse>,
  ): Promise<void> {
    const req = call.request;
    const pubsubName = req.getPubsubName();
    const topic = req.getTopic();

    // Route is unique to pubsub and topic and has format pubsub--topic--route so we strip it since else we can't find the route
    const route = this.generatePubSubSubscriptionTopicRouteName(req.getPath().replace(`${pubsubName}--${topic}--`, ""));

    if (
      !this.pubSubSubscriptions[pubsubName] ||
      !this.pubSubSubscriptions[pubsubName][topic] ||
      !this.pubSubSubscriptions[pubsubName][topic].routes[route]
    ) {
      this.logger.warn(
        `The topic '${topic}' is not being subscribed to on PubSub '${pubsubName}' for route '${route}'.`,
      );
      return;
    }

    const resArr: TopicEventBulkResponseEntry[] = [];
    const entries = req.getEntriesList();

    for (const ind in entries) {
      const event = entries[ind];
      let data: any;
      if (event.hasBytes()) {
        data = Buffer.from(event.getBytes()).toString();
      } else if (event.hasCloudEvent()) {
        const cloudEvent = event.getCloudEvent();
        if (cloudEvent instanceof TopicEventCERequest) {
          data = Buffer.from(cloudEvent.getData()).toString();
        }
      }
      let dataParsed: any;
      try {
        dataParsed = JSON.parse(data);
      } catch (e) {
        dataParsed = data;
      }

      const res = new TopicEventBulkResponseEntry();

      // Get the headers
      const headers: { [key: string]: string } = {};

      for (const [key, value] of Object.entries(call.metadata.toHttp2Headers())) {
        if (value) {
          headers[key] = value.toString();
        }
      }

      try {
        const eventHandlers = this.pubSubSubscriptions[pubsubName][topic].routes[route].eventHandlers;
        await Promise.all(eventHandlers.map((cb) => cb(dataParsed, headers)));
        res.setStatus(TopicEventResponse.TopicEventResponseStatus.SUCCESS);
      } catch (e) {
        this.logger.error(`Error handling topic event: ${e}`);
        res.setStatus(TopicEventResponse.TopicEventResponseStatus.DROP);
      }

      res.setEntryId(event.getEntryId());
      resArr.push(res);
    }

    const totalRes = new TopicEventBulkResponse();
    totalRes.setStatusesList(resArr);

    return callback(null, totalRes);
  }
  
  async processPubSubCallbacks(
    routeObj: PubSubSubscriptionTopicRouteType,
    data: any,
    headers: { [key: string]: string },
  ): Promise<DaprPubSubStatusEnum> {
    const eventHandlers = routeObj.eventHandlers;
    const statuses = [];

    // Process the callbacks (default: SUCCESS)
    for (const cb of eventHandlers) {
      let status = DaprPubSubStatusEnum.SUCCESS;

      try {
        status = await cb(data, headers);
      } catch (e) {
        // We catch and log an error, but we don't do anything with it as the statuses should define that
        this.logger.error(`[route-${routeObj.path}] Message processing failed, ${e}`);
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

  // Dapr will call this on startup to see which topics it is subscribed to
  async listTopicSubscriptions(
    call: grpc.ServerUnaryCall<Empty, ListTopicSubscriptionsResponse>,
    callback: grpc.sendUnaryData<ListTopicSubscriptionsResponse>,
  ): Promise<void> {
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

        if (daprConfig?.bulkSubscribe) {
          const bulkSubscribe = new BulkSubscribeConfig();
          bulkSubscribe.setEnabled(daprConfig.bulkSubscribe.enabled);

          if (daprConfig?.bulkSubscribe?.maxMessagesCount) {
            bulkSubscribe.setMaxMessagesCount(daprConfig.bulkSubscribe.maxMessagesCount);
          }

          if (daprConfig?.bulkSubscribe?.maxAwaitDurationMs) {
            bulkSubscribe.setMaxAwaitDurationMs(daprConfig.bulkSubscribe.maxAwaitDurationMs);
          }

          topicSubscription.setBulkSubscribe(bulkSubscribe);
        }

        if (daprConfig?.metadata) {
          for (const [mKey, mValue] of Object.entries(daprConfig.metadata)) {
            topicSubscription.getMetadataMap().set(mKey, mValue);
          }
        }

        if (daprConfig?.routes) {
          const routes = new TopicRoutes();

          if (daprConfig?.routes?.default) {
            routes.setDefault(daprConfig?.routes?.default);
          }

          if (daprConfig?.routes?.rules) {
            for (const ruleItem of daprConfig.routes.rules) {
              const rule = new TopicRule();
              rule.setMatch(ruleItem.match);
              rule.setPath(ruleItem.path);
              routes.addRules(rule);
            }
          }

          topicSubscription.setRoutes(routes);
        } else {
          const routes = new TopicRoutes();
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
  async listInputBindings(
    call: grpc.ServerUnaryCall<Empty, ListInputBindingsResponse>,
    callback: grpc.sendUnaryData<ListInputBindingsResponse>,
  ): Promise<void> {
    const res = new ListInputBindingsResponse();
    res.setBindingsList(Object.keys(this.handlersBindings));
    return callback(null, res);
  }
}

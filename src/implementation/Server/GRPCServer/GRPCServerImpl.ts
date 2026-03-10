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

import {
  HTTPExtension,
  InvokeRequest,
  InvokeResponse,
  InvokeResponseSchema
} from "../../../proto/dapr/proto/common/v1/common_pb";
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import { TypeDaprBindingCallback } from "../../../types/DaprBindingCallback.type";
import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";
import { Logger } from "../../../logger/Logger";
import { LoggerOptions } from "../../../types/logger/LoggerOptions";
import { PubSubSubscriptionOptionsType } from "../../../types/pubsub/PubSubSubscriptionOptions.type";
import { DaprInvokerCallbackFunction } from "../../../types/DaprInvokerCallback.type";
import { PubSubSubscriptionTopicRouteType } from "../../../types/pubsub/PubSubSubscriptionTopicRoute.type";
import DaprPubSubStatusEnum from "../../../enum/DaprPubSubStatus.enum";
import { deserializeGrpc } from "../../../utils/Deserializer.util";
import { Settings } from "../../../utils/Settings.util";
import { SubscriptionManager } from "../../../pubsub/subscriptionManager";
import { PubSubSubscriptionsType } from "../../../types/pubsub/PubSubSubscriptions.type";
import { create } from "@bufbuild/protobuf";
import { AnySchema } from "@bufbuild/protobuf/wkt";
import {
  AppCallback,
  BindingEventRequest,
  BindingEventResponse,
  BindingEventResponseSchema,
  BulkSubscribeConfigSchema,
  ListInputBindingsResponse,
  ListInputBindingsResponseSchema,
  ListTopicSubscriptionsResponse,
  ListTopicSubscriptionsResponseSchema,
  TopicEventBulkRequest,
  TopicEventBulkResponse,
  TopicEventBulkResponseEntry,
  TopicEventBulkResponseEntrySchema,
  TopicEventBulkResponseSchema,
  TopicEventRequest,
  TopicEventResponse,
  TopicEventResponseSchema,
  TopicRuleSchema,
  TopicSubscription,
  TopicSubscriptionSchema,
  TopicRoutesSchema,
  TopicEventResponse_TopicEventResponseStatus,
} from "../../../proto/dapr/proto/runtime/v1/appcallback_pb";
import { Empty } from "@bufbuild/protobuf/wkt";

// https://github.com/badsyntax/grpc-js-typescript/issues/1#issuecomment-705419742
export default class GRPCServerImpl {
  private readonly logger: Logger;
  private readonly subscriptionManager: SubscriptionManager;

  handlersInvoke: { [key: string]: DaprInvokerCallbackFunction };
  handlersBindings: { [key: string]: TypeDaprBindingCallback };

  constructor(loggerOptions?: LoggerOptions) {
    this.logger = new Logger("GRPCServer", "GRPCServerImpl", loggerOptions);
    this.subscriptionManager = new SubscriptionManager();

    this.handlersInvoke = {};
    this.handlersBindings = {};
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
    this.subscriptionManager.registerSubscription(pubsubName, topic, options);

    this.logger.info(
      `[Topic = ${topic}] Registered Subscription with routes: ${Object.keys(
        this.subscriptionManager.getSubscription(pubsubName, topic).routes,
      ).join(", ")}`,
    );
  }

  registerPubSubSubscriptionEventHandler(
    pubsubName: string,
    topic: string,
    route: string | undefined,
    cb: TypeDaprPubSubCallback,
  ): void {
    this.subscriptionManager.addEventHandlerToSubscription(pubsubName, topic, cb, route);
  }

  registerInputBindingHandler(bindingName: string, cb: DaprInvokerCallbackFunction): void {
    const handlerKey = this.createInputBindingHandlerKey(bindingName);
    this.handlersBindings[handlerKey] = cb;
  }

  getSubscriptions(): PubSubSubscriptionsType {
    return this.subscriptionManager.getSubscriptions();
  }

  async onInvoke(
    req: InvokeRequest,
  ): Promise<InvokeResponse> {
    const method = req.method;
    const query = (req.httpExtension as HTTPExtension);
    const methodStr = HttpVerbUtil.convertHttpVerbNumberToString(query.verb);
    const handlersInvokeKey = `${methodStr.toLowerCase()}|${method.toLowerCase()}`;

    if (!this.handlersInvoke[handlersInvokeKey]) {
      this.logger.warn(`${methodStr} /${method} was not handled`);
      return create(InvokeResponseSchema);
    }

    const body = Buffer.from((req.data as any).value ?? "").toString();
    const contentType = req.contentType;

    // Invoke the Method Callback
    const invokeResponseData = await this.handlersInvoke[handlersInvokeKey]({
      body,
      query: query.querystring,
      metadata: {
        contentType,
      },
    });

    // Generate Response
    const res = create(InvokeResponseSchema);
    res.contentType = "application/json";

    if (invokeResponseData) {
      const msgSerialized = create(AnySchema, {
        value: Buffer.from(JSON.stringify(invokeResponseData), "utf-8")
      });
      res.data = msgSerialized;
    }

    return res;
  }

  async onBindingEvent(
    req: BindingEventRequest,
  ): Promise<BindingEventResponse> {
    const handlerKey = this.createInputBindingHandlerKey(req.name);

    if (!this.handlersBindings[handlerKey]) {
      this.logger.warn(`Event for binding: "${handlerKey}" was not handled`);
      return create(BindingEventResponseSchema);
    }

    const data = Buffer.from(req.data).toString();

    let dataParsed;

    try {
      dataParsed = JSON.parse(data);
    } catch (e) {
      dataParsed = data;
    }

    await this.handlersBindings[handlerKey](dataParsed);

    return create(BindingEventResponseSchema);
  }

  async onTopicEvent(
    req: TopicEventRequest,
  ): Promise<TopicEventResponse> {
    const pubsub = req.pubsubName;

    if (!this.subscriptionManager.isPubSubRegistered(pubsub)) {
      this.logger.warn(`PubSub '${pubsub}' has not been registered, ignoring event.`);
      return create(TopicEventResponseSchema);
    }

    const [topic, route] = this.subscriptionManager.lookupTopicWildcard(pubsub, req.topic, req.path);
    if (topic == "") {
      this.logger.warn(`Topic '${topic}' has not been subscribed to pubsub '${pubsub}', ignoring event.`);
      return create(TopicEventResponseSchema);
    }

    const subscription = this.subscriptionManager.getSubscription(pubsub, topic);
    if (!subscription.routes[route]) {
      this.logger.warn(
        `Route '${route}' has not been subscribed to topic '${topic}' on pubsub '${pubsub}', ignoring event.`,
      );
      return create(TopicEventResponseSchema);
    }

    const data = deserializeGrpc(req.dataContentType, req.data);
    const res = create(TopicEventResponseSchema);

    // Note: Headers are usually handled via context/metadata in Connect,
    // but if you need them from the transport layer, they are passed differently now.
    const headers: { [key: string]: string } = {};

    // Process the callbacks
    const routeObj = subscription.routes[route];
    const status = await this.processPubSubCallbacks(routeObj, data, headers);

    switch (status) {
      case DaprPubSubStatusEnum.RETRY:
        res.status = TopicEventResponse_TopicEventResponseStatus.RETRY;
        break;
      case DaprPubSubStatusEnum.DROP:
        res.status = TopicEventResponse_TopicEventResponseStatus.DROP;
        break;
      case DaprPubSubStatusEnum.SUCCESS:
      default:
        res.status = TopicEventResponse_TopicEventResponseStatus.SUCCESS
        break;
    }

    return res;
  }

  async onBulkTopicEventAlpha1(
    req: TopicEventBulkRequest,
  ): Promise<TopicEventBulkResponse> {
    const pubsub = req.pubsubName;
    if (!this.subscriptionManager.isPubSubRegistered(pubsub)) {
      this.logger.warn(`PubSub '${pubsub}' has not been registered, ignoring bulk event.`);
      return create(TopicEventBulkResponseSchema);
    }

    const [topic, route] = this.subscriptionManager.lookupTopicWildcard(pubsub, req.topic, req.path);
    if (topic == "") {
      this.logger.warn(`Topic '${topic}' has not been subscribed to pubsub '${pubsub}', ignoring bulk event.`);
      return create(TopicEventBulkResponseSchema);
    }

    const subscription = this.subscriptionManager.getSubscription(pubsub, topic);
    if (!subscription.routes[route]) {
      this.logger.warn(
        `Route '${route}' has not been subscribed to topic '${topic}' on pubsub '${pubsub}', ignoring bulk event.`,
      );
      return create(TopicEventBulkResponseSchema);
    }

    const resArr: TopicEventBulkResponseEntry[] = [];
    const entries = req.entries;

    for (const event of entries) {
      let data: any;
      if (event.event.case === "bytes") {
        data = deserializeGrpc(event.contentType, event.event.value);
      } else if (event.event.case === "cloudEvent") {
        data = deserializeGrpc(event.contentType, event.event.value.data);
      }

      const res = create(TopicEventBulkResponseEntrySchema);
      const headers: { [key: string]: string } = {};

      const routeObj = subscription.routes[route];
      const status = await this.processPubSubCallbacks(routeObj, data, headers);

      switch (status) {
        case DaprPubSubStatusEnum.RETRY:
          res.status = TopicEventResponse_TopicEventResponseStatus.RETRY;
          break;
        case DaprPubSubStatusEnum.DROP:
          res.status = TopicEventResponse_TopicEventResponseStatus.DROP;
          break;
        case DaprPubSubStatusEnum.SUCCESS:
        default:
          res.status = TopicEventResponse_TopicEventResponseStatus.SUCCESS
          break;
      }

      res.entryId = event.entryId;
      resArr.push(res);
    }

    return create(TopicEventBulkResponseSchema, { statuses: resArr });
  }

  async processPubSubCallbacks(
    routeObj: PubSubSubscriptionTopicRouteType,
    data: any,
    headers: { [key: string]: string },
  ): Promise<DaprPubSubStatusEnum> {
    const eventHandlers = routeObj.eventHandlers;
    const statuses: DaprPubSubStatusEnum[] = [];

    // Process the callbacks (default: SUCCESS)
    for (const cb of eventHandlers) {
      let status = DaprPubSubStatusEnum.SUCCESS;

      try {
        status = await cb(data, headers);
      } catch (e) {
        // We catch and log an error, but we don't do anything with it as the statuses should define that
        this.logger.error(`[route - ${routeObj.path}]Message processing failed, ${e}`);
      }

      statuses.push(status ?? DaprPubSubStatusEnum.SUCCESS);
    }

    // Look at the statuses and return the highest priority
    // we handle priority of status on `RETRY` > `DROP` > `SUCCESS`
    if (statuses.includes(DaprPubSubStatusEnum.RETRY)) {
      this.logger.debug(`[route - ${routeObj.path}]Retrying message`);
      return DaprPubSubStatusEnum.RETRY;
    } else if (statuses.includes(DaprPubSubStatusEnum.DROP)) {
      this.logger.debug(`[route - ${routeObj.path}]Dropping message`);
      return DaprPubSubStatusEnum.DROP;
    } else {
      this.logger.debug(`[route - ${routeObj.path}]Acknowledging message`);
      return DaprPubSubStatusEnum.SUCCESS;
    }
  }

  // Dapr will call this on startup to see which topics it is subscribed to
  async listTopicSubscriptions(
    _req: Empty,
  ): Promise<ListTopicSubscriptionsResponse> {
    const subscriptions: TopicSubscription[] = [];

    for (const pubsub of this.subscriptionManager.getRegisteredPubSubs()) {
      for (const topic of this.subscriptionManager.getRegisteredTopics(pubsub)) {
        const topicSubscription = create(TopicSubscriptionSchema);
        topicSubscription.pubsubName = pubsub;
        topicSubscription.topic = topic;

        // Dapr routes
        const daprConfig = this.subscriptionManager.getSubscription(pubsub, topic).dapr;

        if (daprConfig?.deadLetterTopic) {
          topicSubscription.deadLetterTopic = daprConfig.deadLetterTopic;
        }

        if (daprConfig?.bulkSubscribe) {
          const bulkSubscribe = create (BulkSubscribeConfigSchema);
          bulkSubscribe.enabled = daprConfig.bulkSubscribe.enabled;

          if (daprConfig?.bulkSubscribe?.maxMessagesCount) {
            bulkSubscribe.maxMessagesCount = daprConfig.bulkSubscribe.maxMessagesCount;
          }

          if (daprConfig?.bulkSubscribe?.maxAwaitDurationMs) {
            bulkSubscribe.maxAwaitDurationMs = daprConfig.bulkSubscribe.maxAwaitDurationMs;
          }

          topicSubscription.bulkSubscribe = bulkSubscribe;
        }

        if (daprConfig?.metadata) {
          for (const [mKey, mValue] of Object.entries(daprConfig.metadata)) {
            topicSubscription.metadata[mKey] = mValue;
          }
        }

        if (daprConfig?.routes) {
          const routes = create(TopicRoutesSchema);

          if (daprConfig?.routes?.default) {
            routes.default = daprConfig?.routes?.default;
          }

          if (daprConfig?.routes?.rules) {
            for (const ruleItem of daprConfig.routes.rules) {
              const rule = create(TopicRuleSchema, {
                match: ruleItem.match,
                path: ruleItem.path,
              });
              routes.rules.push(rule);
            }
          }

          topicSubscription.routes = routes;
        } else {
          const routes = create(TopicRoutesSchema, {
            default: daprConfig?.route || Settings.getDefaultPubSubRouteName()
          });
          topicSubscription.routes = routes;
        }

        subscriptions.push(topicSubscription);
      }
    }

    return create(ListTopicSubscriptionsResponseSchema, { subscriptions });
  }

  // @todo: WIP
  async listInputBindings(
    _req: Empty,
  ): Promise<ListInputBindingsResponse> {
    return create(ListInputBindingsResponseSchema, {
      bindings: Object.keys(this.handlersBindings)
    });
  }
}

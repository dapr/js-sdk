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

import { create } from "@bufbuild/protobuf";
import { AnySchema } from "@bufbuild/protobuf/wkt";
import { type HandlerContext } from "@connectrpc/connect";

import { InvokeRequest, InvokeResponse, InvokeResponseSchema } from "../../../proto/dapr/proto/common/v1/common_pb";
import {
  BindingEventRequest,
  BindingEventResponse,
  BindingEventResponseSchema,
  BulkSubscribeConfig,
  BulkSubscribeConfigSchema,
  HealthCheckResponse,
  HealthCheckResponseSchema,
  JobEventRequest,
  JobEventResponse,
  JobEventResponseSchema,
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
  TopicEventResponse_TopicEventResponseStatus,
  TopicRoutes,
  TopicRoutesSchema,
  TopicRule,
  TopicRuleSchema,
  TopicSubscription,
  TopicSubscriptionSchema,
} from "../../../proto/dapr/proto/runtime/v1/appcallback_pb";
import { Empty } from "@bufbuild/protobuf/wkt";
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import { TypeDaprBindingCallback } from "../../../types/DaprBindingCallback.type";
import { TypeDaprPubSubCallback } from "../../../types/DaprPubSubCallback.type";
import { Logger } from "../../../logger/Logger";
import { LoggerOptions } from "../../../types/logger/LoggerOptions";
import { PubSubSubscriptionOptionsType } from "../../../types/pubsub/PubSubSubscriptionOptions.type";
import { IServerType } from "./GRPCServer";
import { DaprInvokerCallbackFunction } from "../../../types/DaprInvokerCallback.type";
import { PubSubSubscriptionTopicRouteType } from "../../../types/pubsub/PubSubSubscriptionTopicRoute.type";
import DaprPubSubStatusEnum from "../../../enum/DaprPubSubStatus.enum";
import { deserializeGrpc } from "../../../utils/Deserializer.util";
import { Settings } from "../../../utils/Settings.util";
import { SubscriptionManager } from "../../../pubsub/subscriptionManager";
import { PubSubSubscriptionsType } from "../../../types/pubsub/PubSubSubscriptions.type";

export default class GRPCServerImpl {
  private readonly logger: Logger;
  private readonly subscriptionManager: SubscriptionManager;

  handlersInvoke: { [key: string]: DaprInvokerCallbackFunction };
  handlersBindings: { [key: string]: TypeDaprBindingCallback };

  constructor(_server: IServerType, loggerOptions?: LoggerOptions) {
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

  async onInvoke(request: InvokeRequest, _context: HandlerContext): Promise<InvokeResponse> {
    const method = request.method;
    const httpExtension = request.httpExtension;
    const methodStr = HttpVerbUtil.convertHttpVerbNumberToString(httpExtension?.verb ?? 0);
    const handlersInvokeKey = `${methodStr.toLowerCase()}|${method.toLowerCase()}`;

    if (!this.handlersInvoke[handlersInvokeKey]) {
      this.logger.warn(`${methodStr} /${method} was not handled`);
      return create(InvokeResponseSchema);
    }

    const body = request.data ? Buffer.from(request.data.value).toString() : "";
    const contentType = request.contentType;

    const invokeResponseData = await this.handlersInvoke[handlersInvokeKey]({
      body,
      query: httpExtension?.querystring,
      metadata: {
        contentType,
      },
    });

    const res = create(InvokeResponseSchema, { contentType: "application/json" });

    if (invokeResponseData) {
      res.data = create(AnySchema, { value: Buffer.from(JSON.stringify(invokeResponseData), "utf-8") });
    }

    return res;
  }

  async onBindingEvent(request: BindingEventRequest, _context: HandlerContext): Promise<BindingEventResponse> {
    const handlerKey = this.createInputBindingHandlerKey(request.name);

    if (!this.handlersBindings[handlerKey]) {
      this.logger.warn(`Event for binding: "${handlerKey}" was not handled`);
      return create(BindingEventResponseSchema);
    }

    const data = Buffer.from(request.data).toString();

    let dataParsed;

    try {
      dataParsed = JSON.parse(data);
    } catch (e) {
      dataParsed = data;
    }

    await this.handlersBindings[handlerKey](dataParsed);

    return create(BindingEventResponseSchema);
  }

  async onTopicEvent(request: TopicEventRequest, context: HandlerContext): Promise<TopicEventResponse> {
    const pubsub = request.pubsubName;

    if (!this.subscriptionManager.isPubSubRegistered(pubsub)) {
      this.logger.warn(`PubSub '${pubsub}' has not been registered, ignoring event.`);
      return create(TopicEventResponseSchema);
    }

    const [topic, route] = this.subscriptionManager.lookupTopicWildcard(pubsub, request.topic, request.path);
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

    const data = deserializeGrpc(request.dataContentType, request.data);

    const res = create(TopicEventResponseSchema);

    // Get the headers
    const headers: { [key: string]: string } = {};
    context.requestHeader.forEach((value: string, key: string) => {
      headers[key] = value;
    });

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
        res.status = TopicEventResponse_TopicEventResponseStatus.SUCCESS;
        break;
    }

    return res;
  }

  async onBulkTopicEventAlpha1(
    request: TopicEventBulkRequest,
    context: HandlerContext,
  ): Promise<TopicEventBulkResponse> {
    const pubsub = request.pubsubName;
    if (!this.subscriptionManager.isPubSubRegistered(pubsub)) {
      this.logger.warn(`PubSub '${pubsub}' has not been registered, ignoring bulk event.`);
      return create(TopicEventBulkResponseSchema);
    }

    const [topic, route] = this.subscriptionManager.lookupTopicWildcard(pubsub, request.topic, request.path);
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

    for (const event of request.entries) {
      let data: any;
      if (event.event.case === "bytes") {
        data = deserializeGrpc(event.contentType, event.event.value);
      } else if (event.event.case === "cloudEvent") {
        const cloudEvent = event.event.value;
        data = deserializeGrpc(cloudEvent.dataContentType, cloudEvent.data);
      }

      const res = create(TopicEventBulkResponseEntrySchema);

      // Get the headers
      const headers: { [key: string]: string } = {};
      context.requestHeader.forEach((value: string, key: string) => {
        headers[key] = value;
      });

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
          res.status = TopicEventResponse_TopicEventResponseStatus.SUCCESS;
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
    const statuses = [];

    for (const cb of eventHandlers) {
      let status = DaprPubSubStatusEnum.SUCCESS;

      try {
        status = await cb(data, headers);
      } catch (e) {
        this.logger.error(`[route - ${routeObj.path}]Message processing failed, ${e}`);
      }

      statuses.push(status ?? DaprPubSubStatusEnum.SUCCESS);
    }

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

  async listTopicSubscriptions(_request: Empty, _context: HandlerContext): Promise<ListTopicSubscriptionsResponse> {
    const res = create(ListTopicSubscriptionsResponseSchema);
    const subscriptions: TopicSubscription[] = [];

    for (const pubsub of this.subscriptionManager.getRegisteredPubSubs()) {
      for (const topic of this.subscriptionManager.getRegisteredTopics(pubsub)) {
        const topicSubscription = create(TopicSubscriptionSchema, {
          pubsubName: pubsub,
          topic,
        });

        const daprConfig = this.subscriptionManager.getSubscription(pubsub, topic).dapr;

        if (daprConfig?.deadLetterTopic) {
          topicSubscription.deadLetterTopic = daprConfig.deadLetterTopic;
        }

        if (daprConfig?.bulkSubscribe) {
          const bulkSubscribe = create(BulkSubscribeConfigSchema, {
            enabled: daprConfig.bulkSubscribe.enabled,
            maxMessagesCount: daprConfig.bulkSubscribe.maxMessagesCount ?? 0,
            maxAwaitDurationMs: daprConfig.bulkSubscribe.maxAwaitDurationMs ?? 0,
          });
          topicSubscription.bulkSubscribe = bulkSubscribe;
        }

        if (daprConfig?.metadata) {
          for (const [mKey, mValue] of Object.entries(daprConfig.metadata)) {
            topicSubscription.metadata[mKey] = mValue;
          }
        }

        if (daprConfig?.routes) {
          const routes = create(TopicRoutesSchema, {
            default: daprConfig.routes.default ?? "",
          });

          if (daprConfig?.routes?.rules) {
            for (const ruleItem of daprConfig.routes.rules) {
              routes.rules.push(create(TopicRuleSchema, {
                match: ruleItem.match,
                path: ruleItem.path,
              }));
            }
          }

          topicSubscription.routes = routes;
        } else {
          topicSubscription.routes = create(TopicRoutesSchema, {
            default: daprConfig?.route || Settings.getDefaultPubSubRouteName(),
          });
        }

        subscriptions.push(topicSubscription);
      }
    }

    res.subscriptions = subscriptions;

    return res;
  }

  async listInputBindings(_request: Empty, _context: HandlerContext): Promise<ListInputBindingsResponse> {
    return create(ListInputBindingsResponseSchema, { bindings: Object.keys(this.handlersBindings) });
  }

  async healthCheck(_request: Empty, _context: HandlerContext): Promise<HealthCheckResponse> {
    return create(HealthCheckResponseSchema);
  }

  async onJobEventAlpha1(_request: JobEventRequest, _context: HandlerContext): Promise<JobEventResponse> {
    return create(JobEventResponseSchema);
  }
}

import * as grpc from "grpc";
import { IAppCallbackServer } from "../../proto/dapr/proto/runtime/v1/appcallback_grpc_pb";
import { HTTPExtension, InvokeRequest, InvokeResponse } from '../../proto/dapr/proto/common/v1/common_pb';
import { TypeDaprInvokerCallback } from "../../types/DaprInvokerCallback.type";
import * as HttpVerbUtil from "../../utils/HttpVerb.util";
import { BindingEventRequest, BindingEventResponse, ListInputBindingsResponse, ListTopicSubscriptionsResponse, TopicEventRequest, TopicEventResponse, TopicSubscription } from "../../proto/dapr/proto/runtime/v1/appcallback_pb";
import { TypeDaprBindingCallback } from "../../types/DaprBindingCallback.type";
import { TypeDaprPubSubCallback } from "../../types/DaprPubSubCallback.type";

import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Any } from "google-protobuf/google/protobuf/any_pb";

export default class GRPCServerImpl implements IAppCallbackServer {
    handlersInvoke: { [key: string]: TypeDaprInvokerCallback };
    handlersBindings: { [key: string]: TypeDaprBindingCallback };
    handlersTopics: { [key: string]: TypeDaprPubSubCallback };

    constructor() {
        this.handlersInvoke = {};
        this.handlersBindings = {};
        this.handlersTopics = {};
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

    registerPubSubSubscriptionHandler(pubSubName: string, topicName: string, cb: TypeDaprInvokerCallback): void {
        const handlerKey = this.createPubSubSubscriptionHandlerKey(pubSubName, topicName);
        this.handlersTopics[handlerKey] = cb;
    }

    registerInputBindingHandler(bindingName: string, cb: TypeDaprInvokerCallback): void {
        const handlerKey = this.createInputBindingHandlerKey(bindingName);
        this.handlersBindings[handlerKey] = cb;
    }

    // '(call: ServerUnaryCall<InvokeRequest, InvokeResponse>, callback: sendUnaryData<InvokeResponse>) => Promise<...>'
    // handleUnaryCall<InvokeRequest, InvokeResponse>'.

    async onInvoke(call: grpc.ServerUnaryCall<InvokeRequest>, callback: grpc.sendUnaryData<InvokeResponse>): Promise<void> {
        const method = call.request.getMethod();
        const query = (call.request.getHttpExtension() as HTTPExtension).toObject();
        const methodStr = HttpVerbUtil.convertHttpVerbNumberToString(query.verb);
        const handlersInvokeKey = `${methodStr.toLowerCase()}|${method.toLowerCase()}`;

        if (!this.handlersInvoke[handlersInvokeKey]) {
            console.warn(`[Dapr-JS][gRPC][Invoke] ${methodStr} /${method} was not handled`);
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
    async onBindingEvent(call: grpc.ServerUnaryCall<BindingEventRequest>, callback: grpc.sendUnaryData<BindingEventResponse>): Promise<void> {
        const req = call.request;
        const handlerKey = this.createInputBindingHandlerKey(req.getName());
        
        if (!this.handlersBindings[handlerKey]) {
            console.warn(`[Dapr-JS][gRPC][Bindings] Event for binding: "${handlerKey}" was not handled`);
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
    async onTopicEvent(call: grpc.ServerUnaryCall<TopicEventRequest>, callback: grpc.sendUnaryData<TopicEventResponse>): Promise<void> {
        const req = call.request;
        const handlerKey = this.createPubSubSubscriptionHandlerKey(req.getPubsubName(), req.getTopic());
        
        if (!this.handlersTopics[handlerKey]) {
            console.warn(`[Dapr-JS][gRPC][PubSub] Event from topic: "${handlerKey}" was not handled`);
            return;
        }

        const data = Buffer.from(req.getData()).toString();
        let dataParsed;

        try {
            dataParsed = JSON.parse(data);
        } catch (e) {
            dataParsed = data;
        }

        const res = new TopicEventResponse();

        try {
            await this.handlersTopics[handlerKey](dataParsed);
            res.setStatus(TopicEventResponse.TopicEventResponseStatus.SUCCESS);
        } catch (e) {
            // @todo: for now we drop, maybe we should allow retrying as well more easily?
            console.error(e);
            res.setStatus(TopicEventResponse.TopicEventResponseStatus.DROP);
        }

        return callback(null, res);
    }

    // @todo: WIP
    async listTopicSubscriptions(call: grpc.ServerUnaryCall<Empty>, callback: grpc.sendUnaryData<ListTopicSubscriptionsResponse>): Promise<void> {
        const res = new ListTopicSubscriptionsResponse();

        const values = Object.keys(this.handlersTopics).map((i) => {
            const handlerTopic = i.split("|");

            const topicSubscription = new TopicSubscription();
            topicSubscription.setPubsubName(handlerTopic[0]);
            topicSubscription.setTopic(handlerTopic[1]);

            return topicSubscription;
        });

        res.setSubscriptionsList(values);

        return callback(null, res);
    }

    // @todo: WIP
    async listInputBindings(call: grpc.ServerUnaryCall<Empty>, callback: grpc.sendUnaryData<ListInputBindingsResponse>): Promise<void> {
        const res = new ListInputBindingsResponse();
        res.setBindingsList(Object.keys(this.handlersBindings));
        return callback(null, res);
    }
}
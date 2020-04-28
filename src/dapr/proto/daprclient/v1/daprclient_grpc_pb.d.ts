// package: dapr.proto.daprclient.v1
// file: dapr/proto/daprclient/v1/daprclient.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as dapr_proto_daprclient_v1_daprclient_pb from "../../../../dapr/proto/daprclient/v1/daprclient_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

interface IDaprClientService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    onInvoke: IDaprClientService_IOnInvoke;
    getTopicSubscriptions: IDaprClientService_IGetTopicSubscriptions;
    getBindingsSubscriptions: IDaprClientService_IGetBindingsSubscriptions;
    onBindingEvent: IDaprClientService_IOnBindingEvent;
    onTopicEvent: IDaprClientService_IOnTopicEvent;
}

interface IDaprClientService_IOnInvoke extends grpc.MethodDefinition<dapr_proto_common_v1_common_pb.InvokeRequest, dapr_proto_common_v1_common_pb.InvokeResponse> {
    path: string; // "/dapr.proto.daprclient.v1.DaprClient/OnInvoke"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_common_v1_common_pb.InvokeRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_common_v1_common_pb.InvokeRequest>;
    responseSerialize: grpc.serialize<dapr_proto_common_v1_common_pb.InvokeResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_common_v1_common_pb.InvokeResponse>;
}
interface IDaprClientService_IGetTopicSubscriptions extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope> {
    path: string; // "/dapr.proto.daprclient.v1.DaprClient/GetTopicSubscriptions"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope>;
    responseDeserialize: grpc.deserialize<dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope>;
}
interface IDaprClientService_IGetBindingsSubscriptions extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope> {
    path: string; // "/dapr.proto.daprclient.v1.DaprClient/GetBindingsSubscriptions"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope>;
    responseDeserialize: grpc.deserialize<dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope>;
}
interface IDaprClientService_IOnBindingEvent extends grpc.MethodDefinition<dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope> {
    path: string; // "/dapr.proto.daprclient.v1.DaprClient/OnBindingEvent"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope>;
    responseSerialize: grpc.serialize<dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope>;
    responseDeserialize: grpc.deserialize<dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope>;
}
interface IDaprClientService_IOnTopicEvent extends grpc.MethodDefinition<dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.daprclient.v1.DaprClient/OnTopicEvent"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}

export const DaprClientService: IDaprClientService;

export interface IDaprClientServer {
    onInvoke: grpc.handleUnaryCall<dapr_proto_common_v1_common_pb.InvokeRequest, dapr_proto_common_v1_common_pb.InvokeResponse>;
    getTopicSubscriptions: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope>;
    getBindingsSubscriptions: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope>;
    onBindingEvent: grpc.handleUnaryCall<dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope>;
    onTopicEvent: grpc.handleUnaryCall<dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, google_protobuf_empty_pb.Empty>;
}

export interface IDaprClientClient {
    onInvoke(request: dapr_proto_common_v1_common_pb.InvokeRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    onInvoke(request: dapr_proto_common_v1_common_pb.InvokeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    onInvoke(request: dapr_proto_common_v1_common_pb.InvokeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    getTopicSubscriptions(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    getTopicSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    getTopicSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    getBindingsSubscriptions(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    getBindingsSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    getBindingsSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    onBindingEvent(request: dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope) => void): grpc.ClientUnaryCall;
    onBindingEvent(request: dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope) => void): grpc.ClientUnaryCall;
    onBindingEvent(request: dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope) => void): grpc.ClientUnaryCall;
    onTopicEvent(request: dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    onTopicEvent(request: dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    onTopicEvent(request: dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class DaprClientClient extends grpc.Client implements IDaprClientClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public onInvoke(request: dapr_proto_common_v1_common_pb.InvokeRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public onInvoke(request: dapr_proto_common_v1_common_pb.InvokeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public onInvoke(request: dapr_proto_common_v1_common_pb.InvokeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public getTopicSubscriptions(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    public getTopicSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    public getTopicSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    public getBindingsSubscriptions(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    public getBindingsSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    public getBindingsSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope) => void): grpc.ClientUnaryCall;
    public onBindingEvent(request: dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope) => void): grpc.ClientUnaryCall;
    public onBindingEvent(request: dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope) => void): grpc.ClientUnaryCall;
    public onBindingEvent(request: dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope) => void): grpc.ClientUnaryCall;
    public onTopicEvent(request: dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public onTopicEvent(request: dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public onTopicEvent(request: dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

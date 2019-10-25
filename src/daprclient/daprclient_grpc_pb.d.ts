// GENERATED CODE -- DO NOT EDIT!

// package: daprclient
// file: daprclient/daprclient.proto

import * as daprclient_daprclient_pb from "../daprclient/daprclient_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as grpc from "grpc";

interface IDaprClientService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  onInvoke: grpc.MethodDefinition<daprclient_daprclient_pb.InvokeEnvelope, google_protobuf_any_pb.Any>;
  getTopicSubscriptions: grpc.MethodDefinition<google_protobuf_empty_pb.Empty, daprclient_daprclient_pb.GetTopicSubscriptionsEnvelope>;
  getBindingsSubscriptions: grpc.MethodDefinition<google_protobuf_empty_pb.Empty, daprclient_daprclient_pb.GetBindingsSubscriptionsEnvelope>;
  onBindingEvent: grpc.MethodDefinition<daprclient_daprclient_pb.BindingEventEnvelope, daprclient_daprclient_pb.BindingResponseEnvelope>;
  onTopicEvent: grpc.MethodDefinition<daprclient_daprclient_pb.CloudEventEnvelope, google_protobuf_empty_pb.Empty>;
}

export const DaprClientService: IDaprClientService;

export class DaprClientClient extends grpc.Client {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  onInvoke(argument: daprclient_daprclient_pb.InvokeEnvelope, callback: grpc.requestCallback<google_protobuf_any_pb.Any>): grpc.ClientUnaryCall;
  onInvoke(argument: daprclient_daprclient_pb.InvokeEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_any_pb.Any>): grpc.ClientUnaryCall;
  onInvoke(argument: daprclient_daprclient_pb.InvokeEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_any_pb.Any>): grpc.ClientUnaryCall;
  getTopicSubscriptions(argument: google_protobuf_empty_pb.Empty, callback: grpc.requestCallback<daprclient_daprclient_pb.GetTopicSubscriptionsEnvelope>): grpc.ClientUnaryCall;
  getTopicSubscriptions(argument: google_protobuf_empty_pb.Empty, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<daprclient_daprclient_pb.GetTopicSubscriptionsEnvelope>): grpc.ClientUnaryCall;
  getTopicSubscriptions(argument: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<daprclient_daprclient_pb.GetTopicSubscriptionsEnvelope>): grpc.ClientUnaryCall;
  getBindingsSubscriptions(argument: google_protobuf_empty_pb.Empty, callback: grpc.requestCallback<daprclient_daprclient_pb.GetBindingsSubscriptionsEnvelope>): grpc.ClientUnaryCall;
  getBindingsSubscriptions(argument: google_protobuf_empty_pb.Empty, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<daprclient_daprclient_pb.GetBindingsSubscriptionsEnvelope>): grpc.ClientUnaryCall;
  getBindingsSubscriptions(argument: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<daprclient_daprclient_pb.GetBindingsSubscriptionsEnvelope>): grpc.ClientUnaryCall;
  onBindingEvent(argument: daprclient_daprclient_pb.BindingEventEnvelope, callback: grpc.requestCallback<daprclient_daprclient_pb.BindingResponseEnvelope>): grpc.ClientUnaryCall;
  onBindingEvent(argument: daprclient_daprclient_pb.BindingEventEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<daprclient_daprclient_pb.BindingResponseEnvelope>): grpc.ClientUnaryCall;
  onBindingEvent(argument: daprclient_daprclient_pb.BindingEventEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<daprclient_daprclient_pb.BindingResponseEnvelope>): grpc.ClientUnaryCall;
  onTopicEvent(argument: daprclient_daprclient_pb.CloudEventEnvelope, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  onTopicEvent(argument: daprclient_daprclient_pb.CloudEventEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  onTopicEvent(argument: daprclient_daprclient_pb.CloudEventEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
}

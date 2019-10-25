// GENERATED CODE -- DO NOT EDIT!

// package: dapr
// file: dapr/dapr.proto

import * as dapr_dapr_pb from "../dapr/dapr_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as grpc from "grpc";

interface IDaprService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  publishEvent: grpc.MethodDefinition<dapr_dapr_pb.PublishEventEnvelope, google_protobuf_empty_pb.Empty>;
  invokeService: grpc.MethodDefinition<dapr_dapr_pb.InvokeServiceEnvelope, dapr_dapr_pb.InvokeServiceResponseEnvelope>;
  invokeBinding: grpc.MethodDefinition<dapr_dapr_pb.InvokeBindingEnvelope, google_protobuf_empty_pb.Empty>;
  getState: grpc.MethodDefinition<dapr_dapr_pb.GetStateEnvelope, dapr_dapr_pb.GetStateResponseEnvelope>;
  saveState: grpc.MethodDefinition<dapr_dapr_pb.SaveStateEnvelope, google_protobuf_empty_pb.Empty>;
  deleteState: grpc.MethodDefinition<dapr_dapr_pb.DeleteStateEnvelope, google_protobuf_empty_pb.Empty>;
}

export const DaprService: IDaprService;

export class DaprClient extends grpc.Client {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  publishEvent(argument: dapr_dapr_pb.PublishEventEnvelope, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  publishEvent(argument: dapr_dapr_pb.PublishEventEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  publishEvent(argument: dapr_dapr_pb.PublishEventEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  invokeService(argument: dapr_dapr_pb.InvokeServiceEnvelope, callback: grpc.requestCallback<dapr_dapr_pb.InvokeServiceResponseEnvelope>): grpc.ClientUnaryCall;
  invokeService(argument: dapr_dapr_pb.InvokeServiceEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<dapr_dapr_pb.InvokeServiceResponseEnvelope>): grpc.ClientUnaryCall;
  invokeService(argument: dapr_dapr_pb.InvokeServiceEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<dapr_dapr_pb.InvokeServiceResponseEnvelope>): grpc.ClientUnaryCall;
  invokeBinding(argument: dapr_dapr_pb.InvokeBindingEnvelope, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  invokeBinding(argument: dapr_dapr_pb.InvokeBindingEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  invokeBinding(argument: dapr_dapr_pb.InvokeBindingEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  getState(argument: dapr_dapr_pb.GetStateEnvelope, callback: grpc.requestCallback<dapr_dapr_pb.GetStateResponseEnvelope>): grpc.ClientUnaryCall;
  getState(argument: dapr_dapr_pb.GetStateEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<dapr_dapr_pb.GetStateResponseEnvelope>): grpc.ClientUnaryCall;
  getState(argument: dapr_dapr_pb.GetStateEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<dapr_dapr_pb.GetStateResponseEnvelope>): grpc.ClientUnaryCall;
  saveState(argument: dapr_dapr_pb.SaveStateEnvelope, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  saveState(argument: dapr_dapr_pb.SaveStateEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  saveState(argument: dapr_dapr_pb.SaveStateEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  deleteState(argument: dapr_dapr_pb.DeleteStateEnvelope, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  deleteState(argument: dapr_dapr_pb.DeleteStateEnvelope, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  deleteState(argument: dapr_dapr_pb.DeleteStateEnvelope, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
}

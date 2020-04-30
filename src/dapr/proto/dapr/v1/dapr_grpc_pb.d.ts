// package: dapr.proto.dapr.v1
// file: dapr/proto/dapr/v1/dapr.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as dapr_proto_dapr_v1_dapr_pb from "../../../../dapr/proto/dapr/v1/dapr_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

interface IDaprService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    publishEvent: IDaprService_IPublishEvent;
    invokeService: IDaprService_IInvokeService;
    invokeBinding: IDaprService_IInvokeBinding;
    getState: IDaprService_IGetState;
    getSecret: IDaprService_IGetSecret;
    saveState: IDaprService_ISaveState;
    deleteState: IDaprService_IDeleteState;
}

interface IDaprService_IPublishEvent extends grpc.MethodDefinition<dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.dapr.v1.Dapr/PublishEvent"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IDaprService_IInvokeService extends grpc.MethodDefinition<dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, dapr_proto_common_v1_common_pb.InvokeResponse> {
    path: string; // "/dapr.proto.dapr.v1.Dapr/InvokeService"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest>;
    responseSerialize: grpc.serialize<dapr_proto_common_v1_common_pb.InvokeResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_common_v1_common_pb.InvokeResponse>;
}
interface IDaprService_IInvokeBinding extends grpc.MethodDefinition<dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.dapr.v1.Dapr/InvokeBinding"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IDaprService_IGetState extends grpc.MethodDefinition<dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope> {
    path: string; // "/dapr.proto.dapr.v1.Dapr/GetState"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope>;
    responseSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope>;
    responseDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope>;
}
interface IDaprService_IGetSecret extends grpc.MethodDefinition<dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope> {
    path: string; // "/dapr.proto.dapr.v1.Dapr/GetSecret"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope>;
    responseSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope>;
    responseDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope>;
}
interface IDaprService_ISaveState extends grpc.MethodDefinition<dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.dapr.v1.Dapr/SaveState"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IDaprService_IDeleteState extends grpc.MethodDefinition<dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.dapr.v1.Dapr/DeleteState"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope>;
    requestDeserialize: grpc.deserialize<dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}

export const DaprService: IDaprService;

export interface IDaprServer {
    publishEvent: grpc.handleUnaryCall<dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, google_protobuf_empty_pb.Empty>;
    invokeService: grpc.handleUnaryCall<dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, dapr_proto_common_v1_common_pb.InvokeResponse>;
    invokeBinding: grpc.handleUnaryCall<dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, google_protobuf_empty_pb.Empty>;
    getState: grpc.handleUnaryCall<dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope>;
    getSecret: grpc.handleUnaryCall<dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope>;
    saveState: grpc.handleUnaryCall<dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, google_protobuf_empty_pb.Empty>;
    deleteState: grpc.handleUnaryCall<dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, google_protobuf_empty_pb.Empty>;
}

export interface IDaprClient {
    publishEvent(request: dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    publishEvent(request: dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    publishEvent(request: dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    invokeService(request: dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    invokeService(request: dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    invokeService(request: dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    invokeBinding(request: dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    invokeBinding(request: dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    invokeBinding(request: dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    getState(request: dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope) => void): grpc.ClientUnaryCall;
    getState(request: dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope) => void): grpc.ClientUnaryCall;
    getState(request: dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope) => void): grpc.ClientUnaryCall;
    getSecret(request: dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope) => void): grpc.ClientUnaryCall;
    getSecret(request: dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope) => void): grpc.ClientUnaryCall;
    getSecret(request: dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope) => void): grpc.ClientUnaryCall;
    saveState(request: dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    saveState(request: dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    saveState(request: dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteState(request: dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteState(request: dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteState(request: dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class DaprClient extends grpc.Client implements IDaprClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public publishEvent(request: dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public publishEvent(request: dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public publishEvent(request: dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public invokeService(request: dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public invokeService(request: dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public invokeService(request: dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public invokeBinding(request: dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public invokeBinding(request: dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public invokeBinding(request: dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public getState(request: dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope) => void): grpc.ClientUnaryCall;
    public getState(request: dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope) => void): grpc.ClientUnaryCall;
    public getState(request: dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope) => void): grpc.ClientUnaryCall;
    public getSecret(request: dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope) => void): grpc.ClientUnaryCall;
    public getSecret(request: dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope) => void): grpc.ClientUnaryCall;
    public getSecret(request: dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope) => void): grpc.ClientUnaryCall;
    public saveState(request: dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public saveState(request: dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public saveState(request: dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteState(request: dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteState(request: dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteState(request: dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
}

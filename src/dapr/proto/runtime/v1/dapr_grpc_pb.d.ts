// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/dapr.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as dapr_proto_runtime_v1_dapr_pb from "../../../../dapr/proto/runtime/v1/dapr_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

interface IDaprService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    invokeService: IDaprService_IInvokeService;
    getState: IDaprService_IGetState;
    saveState: IDaprService_ISaveState;
    deleteState: IDaprService_IDeleteState;
    publishEvent: IDaprService_IPublishEvent;
    invokeBinding: IDaprService_IInvokeBinding;
    getSecret: IDaprService_IGetSecret;
}

interface IDaprService_IInvokeService extends grpc.MethodDefinition<dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, dapr_proto_common_v1_common_pb.InvokeResponse> {
    path: string; // "/dapr.proto.runtime.v1.Dapr/InvokeService"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest>;
    responseSerialize: grpc.serialize<dapr_proto_common_v1_common_pb.InvokeResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_common_v1_common_pb.InvokeResponse>;
}
interface IDaprService_IGetState extends grpc.MethodDefinition<dapr_proto_runtime_v1_dapr_pb.GetStateRequest, dapr_proto_runtime_v1_dapr_pb.GetStateResponse> {
    path: string; // "/dapr.proto.runtime.v1.Dapr/GetState"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.GetStateRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.GetStateRequest>;
    responseSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.GetStateResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.GetStateResponse>;
}
interface IDaprService_ISaveState extends grpc.MethodDefinition<dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.runtime.v1.Dapr/SaveState"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.SaveStateRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.SaveStateRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IDaprService_IDeleteState extends grpc.MethodDefinition<dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.runtime.v1.Dapr/DeleteState"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IDaprService_IPublishEvent extends grpc.MethodDefinition<dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.runtime.v1.Dapr/PublishEvent"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.PublishEventRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.PublishEventRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IDaprService_IInvokeBinding extends grpc.MethodDefinition<dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, google_protobuf_empty_pb.Empty> {
    path: string; // "/dapr.proto.runtime.v1.Dapr/InvokeBinding"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface IDaprService_IGetSecret extends grpc.MethodDefinition<dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, dapr_proto_runtime_v1_dapr_pb.GetSecretResponse> {
    path: string; // "/dapr.proto.runtime.v1.Dapr/GetSecret"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.GetSecretRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.GetSecretRequest>;
    responseSerialize: grpc.serialize<dapr_proto_runtime_v1_dapr_pb.GetSecretResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_runtime_v1_dapr_pb.GetSecretResponse>;
}

export const DaprService: IDaprService;

export interface IDaprServer {
    invokeService: grpc.handleUnaryCall<dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, dapr_proto_common_v1_common_pb.InvokeResponse>;
    getState: grpc.handleUnaryCall<dapr_proto_runtime_v1_dapr_pb.GetStateRequest, dapr_proto_runtime_v1_dapr_pb.GetStateResponse>;
    saveState: grpc.handleUnaryCall<dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, google_protobuf_empty_pb.Empty>;
    deleteState: grpc.handleUnaryCall<dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, google_protobuf_empty_pb.Empty>;
    publishEvent: grpc.handleUnaryCall<dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, google_protobuf_empty_pb.Empty>;
    invokeBinding: grpc.handleUnaryCall<dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, google_protobuf_empty_pb.Empty>;
    getSecret: grpc.handleUnaryCall<dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, dapr_proto_runtime_v1_dapr_pb.GetSecretResponse>;
}

export interface IDaprClient {
    invokeService(request: dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    invokeService(request: dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    invokeService(request: dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    getState(request: dapr_proto_runtime_v1_dapr_pb.GetStateRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetStateResponse) => void): grpc.ClientUnaryCall;
    getState(request: dapr_proto_runtime_v1_dapr_pb.GetStateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetStateResponse) => void): grpc.ClientUnaryCall;
    getState(request: dapr_proto_runtime_v1_dapr_pb.GetStateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetStateResponse) => void): grpc.ClientUnaryCall;
    saveState(request: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    saveState(request: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    saveState(request: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteState(request: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteState(request: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteState(request: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    publishEvent(request: dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    publishEvent(request: dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    publishEvent(request: dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    invokeBinding(request: dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    invokeBinding(request: dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    invokeBinding(request: dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    getSecret(request: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    getSecret(request: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    getSecret(request: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
}

export class DaprClient extends grpc.Client implements IDaprClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public invokeService(request: dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public invokeService(request: dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public invokeService(request: dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_common_v1_common_pb.InvokeResponse) => void): grpc.ClientUnaryCall;
    public getState(request: dapr_proto_runtime_v1_dapr_pb.GetStateRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetStateResponse) => void): grpc.ClientUnaryCall;
    public getState(request: dapr_proto_runtime_v1_dapr_pb.GetStateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetStateResponse) => void): grpc.ClientUnaryCall;
    public getState(request: dapr_proto_runtime_v1_dapr_pb.GetStateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetStateResponse) => void): grpc.ClientUnaryCall;
    public saveState(request: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public saveState(request: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public saveState(request: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteState(request: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteState(request: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteState(request: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public publishEvent(request: dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public publishEvent(request: dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public publishEvent(request: dapr_proto_runtime_v1_dapr_pb.PublishEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public invokeBinding(request: dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public invokeBinding(request: dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public invokeBinding(request: dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public getSecret(request: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    public getSecret(request: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    public getSecret(request: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
}

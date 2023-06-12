// package: dapr.proto.internals.v1
// file: dapr/proto/internals/v1/service_invocation.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as dapr_proto_internals_v1_service_invocation_pb from "../../../../dapr/proto/internals/v1/service_invocation_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";
import * as dapr_proto_internals_v1_apiversion_pb from "../../../../dapr/proto/internals/v1/apiversion_pb";
import * as dapr_proto_internals_v1_status_pb from "../../../../dapr/proto/internals/v1/status_pb";

interface IServiceInvocationService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    callActor: IServiceInvocationService_ICallActor;
    callLocal: IServiceInvocationService_ICallLocal;
    callLocalStream: IServiceInvocationService_ICallLocalStream;
}

interface IServiceInvocationService_ICallActor extends grpc.MethodDefinition<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse> {
    path: "/dapr.proto.internals.v1.ServiceInvocation/CallActor";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest>;
    responseSerialize: grpc.serialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse>;
}
interface IServiceInvocationService_ICallLocal extends grpc.MethodDefinition<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse> {
    path: "/dapr.proto.internals.v1.ServiceInvocation/CallLocal";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest>;
    responseSerialize: grpc.serialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse>;
}
interface IServiceInvocationService_ICallLocalStream extends grpc.MethodDefinition<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream> {
    path: "/dapr.proto.internals.v1.ServiceInvocation/CallLocalStream";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream>;
    requestDeserialize: grpc.deserialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream>;
    responseSerialize: grpc.serialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
    responseDeserialize: grpc.deserialize<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
}

export const ServiceInvocationService: IServiceInvocationService;

export interface IServiceInvocationServer extends grpc.UntypedServiceImplementation {
    callActor: grpc.handleUnaryCall<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse>;
    callLocal: grpc.handleUnaryCall<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse>;
    callLocalStream: grpc.handleBidiStreamingCall<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
}

export interface IServiceInvocationClient {
    callActor(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    callActor(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    callActor(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    callLocal(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    callLocal(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    callLocal(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    callLocalStream(): grpc.ClientDuplexStream<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
    callLocalStream(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
    callLocalStream(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
}

export class ServiceInvocationClient extends grpc.Client implements IServiceInvocationClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public callActor(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    public callActor(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    public callActor(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    public callLocal(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    public callLocal(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    public callLocal(request: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse) => void): grpc.ClientUnaryCall;
    public callLocalStream(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
    public callLocalStream(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequestStream, dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponseStream>;
}

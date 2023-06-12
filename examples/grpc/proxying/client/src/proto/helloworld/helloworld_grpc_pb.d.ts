// package: helloworld
// file: helloworld/helloworld.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as helloworld_helloworld_pb from "../helloworld/helloworld_pb";

interface IGreeterService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    sayHello: IGreeterService_ISayHello;
}

interface IGreeterService_ISayHello extends grpc.MethodDefinition<helloworld_helloworld_pb.HelloRequest, helloworld_helloworld_pb.HelloReply> {
    path: "/helloworld.Greeter/SayHello";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<helloworld_helloworld_pb.HelloRequest>;
    requestDeserialize: grpc.deserialize<helloworld_helloworld_pb.HelloRequest>;
    responseSerialize: grpc.serialize<helloworld_helloworld_pb.HelloReply>;
    responseDeserialize: grpc.deserialize<helloworld_helloworld_pb.HelloReply>;
}

export const GreeterService: IGreeterService;

export interface IGreeterServer extends grpc.UntypedServiceImplementation {
    sayHello: grpc.handleUnaryCall<helloworld_helloworld_pb.HelloRequest, helloworld_helloworld_pb.HelloReply>;
}

export interface IGreeterClient {
    sayHello(request: helloworld_helloworld_pb.HelloRequest, callback: (error: grpc.ServiceError | null, response: helloworld_helloworld_pb.HelloReply) => void): grpc.ClientUnaryCall;
    sayHello(request: helloworld_helloworld_pb.HelloRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: helloworld_helloworld_pb.HelloReply) => void): grpc.ClientUnaryCall;
    sayHello(request: helloworld_helloworld_pb.HelloRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: helloworld_helloworld_pb.HelloReply) => void): grpc.ClientUnaryCall;
}

export class GreeterClient extends grpc.Client implements IGreeterClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public sayHello(request: helloworld_helloworld_pb.HelloRequest, callback: (error: grpc.ServiceError | null, response: helloworld_helloworld_pb.HelloReply) => void): grpc.ClientUnaryCall;
    public sayHello(request: helloworld_helloworld_pb.HelloRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: helloworld_helloworld_pb.HelloReply) => void): grpc.ClientUnaryCall;
    public sayHello(request: helloworld_helloworld_pb.HelloRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: helloworld_helloworld_pb.HelloReply) => void): grpc.ClientUnaryCall;
}

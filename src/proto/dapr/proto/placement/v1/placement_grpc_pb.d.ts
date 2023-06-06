// package: dapr.proto.placement.v1
// file: dapr/proto/placement/v1/placement.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as dapr_proto_placement_v1_placement_pb from "../../../../dapr/proto/placement/v1/placement_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

interface IPlacementService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getPlacementTables: IPlacementService_IGetPlacementTables;
    reportDaprStatus: IPlacementService_IReportDaprStatus;
}

interface IPlacementService_IGetPlacementTables extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse> {
    path: "/dapr.proto.placement.v1.Placement/GetPlacementTables";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse>;
}
interface IPlacementService_IReportDaprStatus extends grpc.MethodDefinition<dapr_proto_placement_v1_placement_pb.Host, dapr_proto_placement_v1_placement_pb.PlacementOrder> {
    path: "/dapr.proto.placement.v1.Placement/ReportDaprStatus";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<dapr_proto_placement_v1_placement_pb.Host>;
    requestDeserialize: grpc.deserialize<dapr_proto_placement_v1_placement_pb.Host>;
    responseSerialize: grpc.serialize<dapr_proto_placement_v1_placement_pb.PlacementOrder>;
    responseDeserialize: grpc.deserialize<dapr_proto_placement_v1_placement_pb.PlacementOrder>;
}

export const PlacementService: IPlacementService;

export interface IPlacementServer extends grpc.UntypedServiceImplementation {
    getPlacementTables: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse>;
    reportDaprStatus: grpc.handleBidiStreamingCall<dapr_proto_placement_v1_placement_pb.Host, dapr_proto_placement_v1_placement_pb.PlacementOrder>;
}

export interface IPlacementClient {
    getPlacementTables(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse) => void): grpc.ClientUnaryCall;
    getPlacementTables(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse) => void): grpc.ClientUnaryCall;
    getPlacementTables(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse) => void): grpc.ClientUnaryCall;
    reportDaprStatus(): grpc.ClientDuplexStream<dapr_proto_placement_v1_placement_pb.Host, dapr_proto_placement_v1_placement_pb.PlacementOrder>;
    reportDaprStatus(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_placement_v1_placement_pb.Host, dapr_proto_placement_v1_placement_pb.PlacementOrder>;
    reportDaprStatus(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_placement_v1_placement_pb.Host, dapr_proto_placement_v1_placement_pb.PlacementOrder>;
}

export class PlacementClient extends grpc.Client implements IPlacementClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getPlacementTables(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse) => void): grpc.ClientUnaryCall;
    public getPlacementTables(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse) => void): grpc.ClientUnaryCall;
    public getPlacementTables(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_placement_v1_placement_pb.GetPlacementTablesResponse) => void): grpc.ClientUnaryCall;
    public reportDaprStatus(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_placement_v1_placement_pb.Host, dapr_proto_placement_v1_placement_pb.PlacementOrder>;
    public reportDaprStatus(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_placement_v1_placement_pb.Host, dapr_proto_placement_v1_placement_pb.PlacementOrder>;
}

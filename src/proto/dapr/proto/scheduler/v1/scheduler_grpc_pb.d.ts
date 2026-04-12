// package: dapr.proto.scheduler.v1
// file: dapr/proto/scheduler/v1/scheduler.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as dapr_proto_scheduler_v1_scheduler_pb from "../../../../dapr/proto/scheduler/v1/scheduler_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

interface ISchedulerService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    scheduleJob: ISchedulerService_IScheduleJob;
    getJob: ISchedulerService_IGetJob;
    deleteJob: ISchedulerService_IDeleteJob;
    watchJobs: ISchedulerService_IWatchJobs;
    listJobs: ISchedulerService_IListJobs;
    watchHosts: ISchedulerService_IWatchHosts;
    deleteByMetadata: ISchedulerService_IDeleteByMetadata;
    deleteByNamePrefix: ISchedulerService_IDeleteByNamePrefix;
}

interface ISchedulerService_IScheduleJob extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/ScheduleJob";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse>;
}
interface ISchedulerService_IGetJob extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/GetJob";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse>;
}
interface ISchedulerService_IDeleteJob extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/DeleteJob";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse>;
}
interface ISchedulerService_IWatchJobs extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/WatchJobs";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
}
interface ISchedulerService_IListJobs extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/ListJobs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse>;
}
interface ISchedulerService_IWatchHosts extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/WatchHosts";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse>;
}
interface ISchedulerService_IDeleteByMetadata extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/DeleteByMetadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse>;
}
interface ISchedulerService_IDeleteByNamePrefix extends grpc.MethodDefinition<dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse> {
    path: "/dapr.proto.scheduler.v1.Scheduler/DeleteByNamePrefix";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest>;
    responseSerialize: grpc.serialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse>;
}

export const SchedulerService: ISchedulerService;

export interface ISchedulerServer extends grpc.UntypedServiceImplementation {
    scheduleJob: grpc.handleUnaryCall<dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse>;
    getJob: grpc.handleUnaryCall<dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse>;
    deleteJob: grpc.handleUnaryCall<dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse>;
    watchJobs: grpc.handleBidiStreamingCall<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
    listJobs: grpc.handleUnaryCall<dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse>;
    watchHosts: grpc.handleServerStreamingCall<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse>;
    deleteByMetadata: grpc.handleUnaryCall<dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse>;
    deleteByNamePrefix: grpc.handleUnaryCall<dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse>;
}

export interface ISchedulerClient {
    scheduleJob(request: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse) => void): grpc.ClientUnaryCall;
    scheduleJob(request: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse) => void): grpc.ClientUnaryCall;
    scheduleJob(request: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse) => void): grpc.ClientUnaryCall;
    getJob(request: dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse) => void): grpc.ClientUnaryCall;
    getJob(request: dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse) => void): grpc.ClientUnaryCall;
    getJob(request: dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse) => void): grpc.ClientUnaryCall;
    deleteJob(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse) => void): grpc.ClientUnaryCall;
    deleteJob(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse) => void): grpc.ClientUnaryCall;
    deleteJob(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse) => void): grpc.ClientUnaryCall;
    watchJobs(): grpc.ClientDuplexStream<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
    watchJobs(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
    watchJobs(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
    listJobs(request: dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse) => void): grpc.ClientUnaryCall;
    listJobs(request: dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse) => void): grpc.ClientUnaryCall;
    listJobs(request: dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse) => void): grpc.ClientUnaryCall;
    watchHosts(request: dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse>;
    watchHosts(request: dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse>;
    deleteByMetadata(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse) => void): grpc.ClientUnaryCall;
    deleteByMetadata(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse) => void): grpc.ClientUnaryCall;
    deleteByMetadata(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse) => void): grpc.ClientUnaryCall;
    deleteByNamePrefix(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse) => void): grpc.ClientUnaryCall;
    deleteByNamePrefix(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse) => void): grpc.ClientUnaryCall;
    deleteByNamePrefix(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse) => void): grpc.ClientUnaryCall;
}

export class SchedulerClient extends grpc.Client implements ISchedulerClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public scheduleJob(request: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse) => void): grpc.ClientUnaryCall;
    public scheduleJob(request: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse) => void): grpc.ClientUnaryCall;
    public scheduleJob(request: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ScheduleJobResponse) => void): grpc.ClientUnaryCall;
    public getJob(request: dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse) => void): grpc.ClientUnaryCall;
    public getJob(request: dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse) => void): grpc.ClientUnaryCall;
    public getJob(request: dapr_proto_scheduler_v1_scheduler_pb.GetJobRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.GetJobResponse) => void): grpc.ClientUnaryCall;
    public deleteJob(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse) => void): grpc.ClientUnaryCall;
    public deleteJob(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse) => void): grpc.ClientUnaryCall;
    public deleteJob(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteJobResponse) => void): grpc.ClientUnaryCall;
    public watchJobs(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
    public watchJobs(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<dapr_proto_scheduler_v1_scheduler_pb.WatchJobsRequest, dapr_proto_scheduler_v1_scheduler_pb.WatchJobsResponse>;
    public listJobs(request: dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse) => void): grpc.ClientUnaryCall;
    public listJobs(request: dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse) => void): grpc.ClientUnaryCall;
    public listJobs(request: dapr_proto_scheduler_v1_scheduler_pb.ListJobsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.ListJobsResponse) => void): grpc.ClientUnaryCall;
    public watchHosts(request: dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse>;
    public watchHosts(request: dapr_proto_scheduler_v1_scheduler_pb.WatchHostsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_scheduler_v1_scheduler_pb.WatchHostsResponse>;
    public deleteByMetadata(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse) => void): grpc.ClientUnaryCall;
    public deleteByMetadata(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse) => void): grpc.ClientUnaryCall;
    public deleteByMetadata(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByMetadataResponse) => void): grpc.ClientUnaryCall;
    public deleteByNamePrefix(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse) => void): grpc.ClientUnaryCall;
    public deleteByNamePrefix(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse) => void): grpc.ClientUnaryCall;
    public deleteByNamePrefix(request: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_scheduler_v1_scheduler_pb.DeleteByNamePrefixResponse) => void): grpc.ClientUnaryCall;
}

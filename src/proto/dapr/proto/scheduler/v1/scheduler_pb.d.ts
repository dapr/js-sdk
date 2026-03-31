// package: dapr.proto.scheduler.v1
// file: dapr/proto/scheduler/v1/scheduler.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

export class Job extends jspb.Message { 

    hasSchedule(): boolean;
    clearSchedule(): void;
    getSchedule(): string | undefined;
    setSchedule(value: string): Job;

    hasRepeats(): boolean;
    clearRepeats(): void;
    getRepeats(): number | undefined;
    setRepeats(value: number): Job;

    hasDueTime(): boolean;
    clearDueTime(): void;
    getDueTime(): string | undefined;
    setDueTime(value: string): Job;

    hasTtl(): boolean;
    clearTtl(): void;
    getTtl(): string | undefined;
    setTtl(value: string): Job;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): Job;

    hasFailurePolicy(): boolean;
    clearFailurePolicy(): void;
    getFailurePolicy(): dapr_proto_common_v1_common_pb.JobFailurePolicy | undefined;
    setFailurePolicy(value?: dapr_proto_common_v1_common_pb.JobFailurePolicy): Job;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Job.AsObject;
    static toObject(includeInstance: boolean, msg: Job): Job.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Job, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Job;
    static deserializeBinaryFromReader(message: Job, reader: jspb.BinaryReader): Job;
}

export namespace Job {
    export type AsObject = {
        schedule?: string,
        repeats?: number,
        dueTime?: string,
        ttl?: string,
        data?: google_protobuf_any_pb.Any.AsObject,
        failurePolicy?: dapr_proto_common_v1_common_pb.JobFailurePolicy.AsObject,
    }
}

export class TargetJob extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TargetJob.AsObject;
    static toObject(includeInstance: boolean, msg: TargetJob): TargetJob.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TargetJob, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TargetJob;
    static deserializeBinaryFromReader(message: TargetJob, reader: jspb.BinaryReader): TargetJob;
}

export namespace TargetJob {
    export type AsObject = {
    }
}

export class TargetActorReminder extends jspb.Message { 
    getId(): string;
    setId(value: string): TargetActorReminder;
    getType(): string;
    setType(value: string): TargetActorReminder;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TargetActorReminder.AsObject;
    static toObject(includeInstance: boolean, msg: TargetActorReminder): TargetActorReminder.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TargetActorReminder, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TargetActorReminder;
    static deserializeBinaryFromReader(message: TargetActorReminder, reader: jspb.BinaryReader): TargetActorReminder;
}

export namespace TargetActorReminder {
    export type AsObject = {
        id: string,
        type: string,
    }
}

export class JobTargetMetadata extends jspb.Message { 

    hasJob(): boolean;
    clearJob(): void;
    getJob(): TargetJob | undefined;
    setJob(value?: TargetJob): JobTargetMetadata;

    hasActor(): boolean;
    clearActor(): void;
    getActor(): TargetActorReminder | undefined;
    setActor(value?: TargetActorReminder): JobTargetMetadata;

    getTypeCase(): JobTargetMetadata.TypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): JobTargetMetadata.AsObject;
    static toObject(includeInstance: boolean, msg: JobTargetMetadata): JobTargetMetadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: JobTargetMetadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): JobTargetMetadata;
    static deserializeBinaryFromReader(message: JobTargetMetadata, reader: jspb.BinaryReader): JobTargetMetadata;
}

export namespace JobTargetMetadata {
    export type AsObject = {
        job?: TargetJob.AsObject,
        actor?: TargetActorReminder.AsObject,
    }

    export enum TypeCase {
        TYPE_NOT_SET = 0,
        JOB = 1,
        ACTOR = 2,
    }

}

export class JobMetadata extends jspb.Message { 
    getAppId(): string;
    setAppId(value: string): JobMetadata;
    getNamespace(): string;
    setNamespace(value: string): JobMetadata;

    hasTarget(): boolean;
    clearTarget(): void;
    getTarget(): JobTargetMetadata | undefined;
    setTarget(value?: JobTargetMetadata): JobMetadata;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): JobMetadata.AsObject;
    static toObject(includeInstance: boolean, msg: JobMetadata): JobMetadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: JobMetadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): JobMetadata;
    static deserializeBinaryFromReader(message: JobMetadata, reader: jspb.BinaryReader): JobMetadata;
}

export namespace JobMetadata {
    export type AsObject = {
        appId: string,
        namespace: string,
        target?: JobTargetMetadata.AsObject,
    }
}

export class WatchJobsRequest extends jspb.Message { 

    hasInitial(): boolean;
    clearInitial(): void;
    getInitial(): WatchJobsRequestInitial | undefined;
    setInitial(value?: WatchJobsRequestInitial): WatchJobsRequest;

    hasResult(): boolean;
    clearResult(): void;
    getResult(): WatchJobsRequestResult | undefined;
    setResult(value?: WatchJobsRequestResult): WatchJobsRequest;

    getWatchJobRequestTypeCase(): WatchJobsRequest.WatchJobRequestTypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchJobsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WatchJobsRequest): WatchJobsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchJobsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchJobsRequest;
    static deserializeBinaryFromReader(message: WatchJobsRequest, reader: jspb.BinaryReader): WatchJobsRequest;
}

export namespace WatchJobsRequest {
    export type AsObject = {
        initial?: WatchJobsRequestInitial.AsObject,
        result?: WatchJobsRequestResult.AsObject,
    }

    export enum WatchJobRequestTypeCase {
        WATCH_JOB_REQUEST_TYPE_NOT_SET = 0,
        INITIAL = 1,
        RESULT = 2,
    }

}

export class WatchJobsRequestInitial extends jspb.Message { 
    getAppId(): string;
    setAppId(value: string): WatchJobsRequestInitial;
    getNamespace(): string;
    setNamespace(value: string): WatchJobsRequestInitial;
    clearActorTypesList(): void;
    getActorTypesList(): Array<string>;
    setActorTypesList(value: Array<string>): WatchJobsRequestInitial;
    addActorTypes(value: string, index?: number): string;
    clearAcceptJobTypesList(): void;
    getAcceptJobTypesList(): Array<JobTargetType>;
    setAcceptJobTypesList(value: Array<JobTargetType>): WatchJobsRequestInitial;
    addAcceptJobTypes(value: JobTargetType, index?: number): JobTargetType;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchJobsRequestInitial.AsObject;
    static toObject(includeInstance: boolean, msg: WatchJobsRequestInitial): WatchJobsRequestInitial.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchJobsRequestInitial, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchJobsRequestInitial;
    static deserializeBinaryFromReader(message: WatchJobsRequestInitial, reader: jspb.BinaryReader): WatchJobsRequestInitial;
}

export namespace WatchJobsRequestInitial {
    export type AsObject = {
        appId: string,
        namespace: string,
        actorTypesList: Array<string>,
        acceptJobTypesList: Array<JobTargetType>,
    }
}

export class WatchJobsRequestResult extends jspb.Message { 
    getId(): number;
    setId(value: number): WatchJobsRequestResult;
    getStatus(): WatchJobsRequestResultStatus;
    setStatus(value: WatchJobsRequestResultStatus): WatchJobsRequestResult;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchJobsRequestResult.AsObject;
    static toObject(includeInstance: boolean, msg: WatchJobsRequestResult): WatchJobsRequestResult.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchJobsRequestResult, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchJobsRequestResult;
    static deserializeBinaryFromReader(message: WatchJobsRequestResult, reader: jspb.BinaryReader): WatchJobsRequestResult;
}

export namespace WatchJobsRequestResult {
    export type AsObject = {
        id: number,
        status: WatchJobsRequestResultStatus,
    }
}

export class WatchJobsResponse extends jspb.Message { 
    getName(): string;
    setName(value: string): WatchJobsResponse;
    getId(): number;
    setId(value: number): WatchJobsResponse;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): WatchJobsResponse;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): WatchJobsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchJobsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WatchJobsResponse): WatchJobsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchJobsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchJobsResponse;
    static deserializeBinaryFromReader(message: WatchJobsResponse, reader: jspb.BinaryReader): WatchJobsResponse;
}

export namespace WatchJobsResponse {
    export type AsObject = {
        name: string,
        id: number,
        data?: google_protobuf_any_pb.Any.AsObject,
        metadata?: JobMetadata.AsObject,
    }
}

export class ScheduleJobRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): ScheduleJobRequest;

    hasJob(): boolean;
    clearJob(): void;
    getJob(): Job | undefined;
    setJob(value?: Job): ScheduleJobRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): ScheduleJobRequest;
    getOverwrite(): boolean;
    setOverwrite(value: boolean): ScheduleJobRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ScheduleJobRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ScheduleJobRequest): ScheduleJobRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ScheduleJobRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ScheduleJobRequest;
    static deserializeBinaryFromReader(message: ScheduleJobRequest, reader: jspb.BinaryReader): ScheduleJobRequest;
}

export namespace ScheduleJobRequest {
    export type AsObject = {
        name: string,
        job?: Job.AsObject,
        metadata?: JobMetadata.AsObject,
        overwrite: boolean,
    }
}

export class ScheduleJobResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ScheduleJobResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ScheduleJobResponse): ScheduleJobResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ScheduleJobResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ScheduleJobResponse;
    static deserializeBinaryFromReader(message: ScheduleJobResponse, reader: jspb.BinaryReader): ScheduleJobResponse;
}

export namespace ScheduleJobResponse {
    export type AsObject = {
    }
}

export class GetJobRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): GetJobRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): GetJobRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetJobRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetJobRequest): GetJobRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetJobRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetJobRequest;
    static deserializeBinaryFromReader(message: GetJobRequest, reader: jspb.BinaryReader): GetJobRequest;
}

export namespace GetJobRequest {
    export type AsObject = {
        name: string,
        metadata?: JobMetadata.AsObject,
    }
}

export class GetJobResponse extends jspb.Message { 

    hasJob(): boolean;
    clearJob(): void;
    getJob(): Job | undefined;
    setJob(value?: Job): GetJobResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetJobResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetJobResponse): GetJobResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetJobResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetJobResponse;
    static deserializeBinaryFromReader(message: GetJobResponse, reader: jspb.BinaryReader): GetJobResponse;
}

export namespace GetJobResponse {
    export type AsObject = {
        job?: Job.AsObject,
    }
}

export class DeleteJobRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): DeleteJobRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): DeleteJobRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteJobRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteJobRequest): DeleteJobRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteJobRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteJobRequest;
    static deserializeBinaryFromReader(message: DeleteJobRequest, reader: jspb.BinaryReader): DeleteJobRequest;
}

export namespace DeleteJobRequest {
    export type AsObject = {
        name: string,
        metadata?: JobMetadata.AsObject,
    }
}

export class DeleteJobResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteJobResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteJobResponse): DeleteJobResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteJobResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteJobResponse;
    static deserializeBinaryFromReader(message: DeleteJobResponse, reader: jspb.BinaryReader): DeleteJobResponse;
}

export namespace DeleteJobResponse {
    export type AsObject = {
    }
}

export class NamedJob extends jspb.Message { 
    getName(): string;
    setName(value: string): NamedJob;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): NamedJob;

    hasJob(): boolean;
    clearJob(): void;
    getJob(): Job | undefined;
    setJob(value?: Job): NamedJob;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NamedJob.AsObject;
    static toObject(includeInstance: boolean, msg: NamedJob): NamedJob.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NamedJob, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NamedJob;
    static deserializeBinaryFromReader(message: NamedJob, reader: jspb.BinaryReader): NamedJob;
}

export namespace NamedJob {
    export type AsObject = {
        name: string,
        metadata?: JobMetadata.AsObject,
        job?: Job.AsObject,
    }
}

export class ListJobsRequest extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): ListJobsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListJobsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListJobsRequest): ListJobsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListJobsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListJobsRequest;
    static deserializeBinaryFromReader(message: ListJobsRequest, reader: jspb.BinaryReader): ListJobsRequest;
}

export namespace ListJobsRequest {
    export type AsObject = {
        metadata?: JobMetadata.AsObject,
    }
}

export class ListJobsResponse extends jspb.Message { 
    clearJobsList(): void;
    getJobsList(): Array<NamedJob>;
    setJobsList(value: Array<NamedJob>): ListJobsResponse;
    addJobs(value?: NamedJob, index?: number): NamedJob;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListJobsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListJobsResponse): ListJobsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListJobsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListJobsResponse;
    static deserializeBinaryFromReader(message: ListJobsResponse, reader: jspb.BinaryReader): ListJobsResponse;
}

export namespace ListJobsResponse {
    export type AsObject = {
        jobsList: Array<NamedJob.AsObject>,
    }
}

export class WatchHostsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchHostsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WatchHostsRequest): WatchHostsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchHostsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchHostsRequest;
    static deserializeBinaryFromReader(message: WatchHostsRequest, reader: jspb.BinaryReader): WatchHostsRequest;
}

export namespace WatchHostsRequest {
    export type AsObject = {
    }
}

export class WatchHostsResponse extends jspb.Message { 
    clearHostsList(): void;
    getHostsList(): Array<Host>;
    setHostsList(value: Array<Host>): WatchHostsResponse;
    addHosts(value?: Host, index?: number): Host;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchHostsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WatchHostsResponse): WatchHostsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchHostsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchHostsResponse;
    static deserializeBinaryFromReader(message: WatchHostsResponse, reader: jspb.BinaryReader): WatchHostsResponse;
}

export namespace WatchHostsResponse {
    export type AsObject = {
        hostsList: Array<Host.AsObject>,
    }
}

export class Host extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): Host;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Host.AsObject;
    static toObject(includeInstance: boolean, msg: Host): Host.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Host, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Host;
    static deserializeBinaryFromReader(message: Host, reader: jspb.BinaryReader): Host;
}

export namespace Host {
    export type AsObject = {
        address: string,
    }
}

export class DeleteByMetadataRequest extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): DeleteByMetadataRequest;

    hasIdPrefixMatch(): boolean;
    clearIdPrefixMatch(): void;
    getIdPrefixMatch(): boolean | undefined;
    setIdPrefixMatch(value: boolean): DeleteByMetadataRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteByMetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteByMetadataRequest): DeleteByMetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteByMetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteByMetadataRequest;
    static deserializeBinaryFromReader(message: DeleteByMetadataRequest, reader: jspb.BinaryReader): DeleteByMetadataRequest;
}

export namespace DeleteByMetadataRequest {
    export type AsObject = {
        metadata?: JobMetadata.AsObject,
        idPrefixMatch?: boolean,
    }
}

export class DeleteByMetadataResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteByMetadataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteByMetadataResponse): DeleteByMetadataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteByMetadataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteByMetadataResponse;
    static deserializeBinaryFromReader(message: DeleteByMetadataResponse, reader: jspb.BinaryReader): DeleteByMetadataResponse;
}

export namespace DeleteByMetadataResponse {
    export type AsObject = {
    }
}

export class DeleteByNamePrefixRequest extends jspb.Message { 
    getNamePrefix(): string;
    setNamePrefix(value: string): DeleteByNamePrefixRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): JobMetadata | undefined;
    setMetadata(value?: JobMetadata): DeleteByNamePrefixRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteByNamePrefixRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteByNamePrefixRequest): DeleteByNamePrefixRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteByNamePrefixRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteByNamePrefixRequest;
    static deserializeBinaryFromReader(message: DeleteByNamePrefixRequest, reader: jspb.BinaryReader): DeleteByNamePrefixRequest;
}

export namespace DeleteByNamePrefixRequest {
    export type AsObject = {
        namePrefix: string,
        metadata?: JobMetadata.AsObject,
    }
}

export class DeleteByNamePrefixResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteByNamePrefixResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteByNamePrefixResponse): DeleteByNamePrefixResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteByNamePrefixResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteByNamePrefixResponse;
    static deserializeBinaryFromReader(message: DeleteByNamePrefixResponse, reader: jspb.BinaryReader): DeleteByNamePrefixResponse;
}

export namespace DeleteByNamePrefixResponse {
    export type AsObject = {
    }
}

export enum JobTargetType {
    JOB_TARGET_TYPE_JOB = 0,
    JOB_TARGET_TYPE_ACTOR_REMINDER = 1,
}

export enum WatchJobsRequestResultStatus {
    SUCCESS = 0,
    FAILED = 1,
}

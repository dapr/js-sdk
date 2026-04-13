// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/jobs.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class Job extends jspb.Message { 
    getName(): string;
    setName(value: string): Job;

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
        name: string,
        schedule?: string,
        repeats?: number,
        dueTime?: string,
        ttl?: string,
        data?: google_protobuf_any_pb.Any.AsObject,
        failurePolicy?: dapr_proto_common_v1_common_pb.JobFailurePolicy.AsObject,
    }
}

export class ScheduleJobRequest extends jspb.Message { 

    hasJob(): boolean;
    clearJob(): void;
    getJob(): Job | undefined;
    setJob(value?: Job): ScheduleJobRequest;
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
        job?: Job.AsObject,
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

export class DeleteJobsByPrefixRequestAlpha1 extends jspb.Message { 

    hasNamePrefix(): boolean;
    clearNamePrefix(): void;
    getNamePrefix(): string | undefined;
    setNamePrefix(value: string): DeleteJobsByPrefixRequestAlpha1;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteJobsByPrefixRequestAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteJobsByPrefixRequestAlpha1): DeleteJobsByPrefixRequestAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteJobsByPrefixRequestAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteJobsByPrefixRequestAlpha1;
    static deserializeBinaryFromReader(message: DeleteJobsByPrefixRequestAlpha1, reader: jspb.BinaryReader): DeleteJobsByPrefixRequestAlpha1;
}

export namespace DeleteJobsByPrefixRequestAlpha1 {
    export type AsObject = {
        namePrefix?: string,
    }
}

export class DeleteJobsByPrefixResponseAlpha1 extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteJobsByPrefixResponseAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteJobsByPrefixResponseAlpha1): DeleteJobsByPrefixResponseAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteJobsByPrefixResponseAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteJobsByPrefixResponseAlpha1;
    static deserializeBinaryFromReader(message: DeleteJobsByPrefixResponseAlpha1, reader: jspb.BinaryReader): DeleteJobsByPrefixResponseAlpha1;
}

export namespace DeleteJobsByPrefixResponseAlpha1 {
    export type AsObject = {
    }
}

export class ListJobsRequestAlpha1 extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListJobsRequestAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: ListJobsRequestAlpha1): ListJobsRequestAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListJobsRequestAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListJobsRequestAlpha1;
    static deserializeBinaryFromReader(message: ListJobsRequestAlpha1, reader: jspb.BinaryReader): ListJobsRequestAlpha1;
}

export namespace ListJobsRequestAlpha1 {
    export type AsObject = {
    }
}

export class ListJobsResponseAlpha1 extends jspb.Message { 
    clearJobsList(): void;
    getJobsList(): Array<Job>;
    setJobsList(value: Array<Job>): ListJobsResponseAlpha1;
    addJobs(value?: Job, index?: number): Job;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListJobsResponseAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: ListJobsResponseAlpha1): ListJobsResponseAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListJobsResponseAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListJobsResponseAlpha1;
    static deserializeBinaryFromReader(message: ListJobsResponseAlpha1, reader: jspb.BinaryReader): ListJobsResponseAlpha1;
}

export namespace ListJobsResponseAlpha1 {
    export type AsObject = {
        jobsList: Array<Job.AsObject>,
    }
}

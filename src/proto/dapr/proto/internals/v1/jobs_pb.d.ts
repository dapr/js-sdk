// package: dapr.proto.internals.v1
// file: dapr/proto/internals/v1/jobs.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as dapr_proto_scheduler_v1_scheduler_pb from "../../../../dapr/proto/scheduler/v1/scheduler_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class JobHTTPRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): JobHTTPRequest;

    hasSchedule(): boolean;
    clearSchedule(): void;
    getSchedule(): string | undefined;
    setSchedule(value: string): JobHTTPRequest;

    hasRepeats(): boolean;
    clearRepeats(): void;
    getRepeats(): number | undefined;
    setRepeats(value: number): JobHTTPRequest;

    hasDueTime(): boolean;
    clearDueTime(): void;
    getDueTime(): string | undefined;
    setDueTime(value: string): JobHTTPRequest;

    hasTtl(): boolean;
    clearTtl(): void;
    getTtl(): string | undefined;
    setTtl(value: string): JobHTTPRequest;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_struct_pb.Value | undefined;
    setData(value?: google_protobuf_struct_pb.Value): JobHTTPRequest;

    hasOverwrite(): boolean;
    clearOverwrite(): void;
    getOverwrite(): boolean | undefined;
    setOverwrite(value: boolean): JobHTTPRequest;

    hasFailurePolicy(): boolean;
    clearFailurePolicy(): void;
    getFailurePolicy(): dapr_proto_common_v1_common_pb.JobFailurePolicy | undefined;
    setFailurePolicy(value?: dapr_proto_common_v1_common_pb.JobFailurePolicy): JobHTTPRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): JobHTTPRequest.AsObject;
    static toObject(includeInstance: boolean, msg: JobHTTPRequest): JobHTTPRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: JobHTTPRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): JobHTTPRequest;
    static deserializeBinaryFromReader(message: JobHTTPRequest, reader: jspb.BinaryReader): JobHTTPRequest;
}

export namespace JobHTTPRequest {
    export type AsObject = {
        name: string,
        schedule?: string,
        repeats?: number,
        dueTime?: string,
        ttl?: string,
        data?: google_protobuf_struct_pb.Value.AsObject,
        overwrite?: boolean,
        failurePolicy?: dapr_proto_common_v1_common_pb.JobFailurePolicy.AsObject,
    }
}

export class JobEvent extends jspb.Message { 
    getKey(): string;
    setKey(value: string): JobEvent;
    getName(): string;
    setName(value: string): JobEvent;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): dapr_proto_scheduler_v1_scheduler_pb.JobMetadata | undefined;
    setMetadata(value?: dapr_proto_scheduler_v1_scheduler_pb.JobMetadata): JobEvent;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): JobEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): JobEvent.AsObject;
    static toObject(includeInstance: boolean, msg: JobEvent): JobEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: JobEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): JobEvent;
    static deserializeBinaryFromReader(message: JobEvent, reader: jspb.BinaryReader): JobEvent;
}

export namespace JobEvent {
    export type AsObject = {
        key: string,
        name: string,
        metadata?: dapr_proto_scheduler_v1_scheduler_pb.JobMetadata.AsObject,
        data?: google_protobuf_any_pb.Any.AsObject,
    }
}

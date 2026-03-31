// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/workflow.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class GetWorkflowRequest extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): GetWorkflowRequest;
    getWorkflowComponent(): string;
    setWorkflowComponent(value: string): GetWorkflowRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetWorkflowRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetWorkflowRequest): GetWorkflowRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetWorkflowRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetWorkflowRequest;
    static deserializeBinaryFromReader(message: GetWorkflowRequest, reader: jspb.BinaryReader): GetWorkflowRequest;
}

export namespace GetWorkflowRequest {
    export type AsObject = {
        instanceId: string,
        workflowComponent: string,
    }
}

export class GetWorkflowResponse extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): GetWorkflowResponse;
    getWorkflowName(): string;
    setWorkflowName(value: string): GetWorkflowResponse;

    hasCreatedAt(): boolean;
    clearCreatedAt(): void;
    getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): GetWorkflowResponse;

    hasLastUpdatedAt(): boolean;
    clearLastUpdatedAt(): void;
    getLastUpdatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setLastUpdatedAt(value?: google_protobuf_timestamp_pb.Timestamp): GetWorkflowResponse;
    getRuntimeStatus(): string;
    setRuntimeStatus(value: string): GetWorkflowResponse;

    getPropertiesMap(): jspb.Map<string, string>;
    clearPropertiesMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetWorkflowResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetWorkflowResponse): GetWorkflowResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetWorkflowResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetWorkflowResponse;
    static deserializeBinaryFromReader(message: GetWorkflowResponse, reader: jspb.BinaryReader): GetWorkflowResponse;
}

export namespace GetWorkflowResponse {
    export type AsObject = {
        instanceId: string,
        workflowName: string,
        createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        lastUpdatedAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        runtimeStatus: string,

        propertiesMap: Array<[string, string]>,
    }
}

export class StartWorkflowRequest extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): StartWorkflowRequest;
    getWorkflowComponent(): string;
    setWorkflowComponent(value: string): StartWorkflowRequest;
    getWorkflowName(): string;
    setWorkflowName(value: string): StartWorkflowRequest;

    getOptionsMap(): jspb.Map<string, string>;
    clearOptionsMap(): void;
    getInput(): Uint8Array | string;
    getInput_asU8(): Uint8Array;
    getInput_asB64(): string;
    setInput(value: Uint8Array | string): StartWorkflowRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StartWorkflowRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StartWorkflowRequest): StartWorkflowRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StartWorkflowRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StartWorkflowRequest;
    static deserializeBinaryFromReader(message: StartWorkflowRequest, reader: jspb.BinaryReader): StartWorkflowRequest;
}

export namespace StartWorkflowRequest {
    export type AsObject = {
        instanceId: string,
        workflowComponent: string,
        workflowName: string,

        optionsMap: Array<[string, string]>,
        input: Uint8Array | string,
    }
}

export class StartWorkflowResponse extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): StartWorkflowResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StartWorkflowResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StartWorkflowResponse): StartWorkflowResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StartWorkflowResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StartWorkflowResponse;
    static deserializeBinaryFromReader(message: StartWorkflowResponse, reader: jspb.BinaryReader): StartWorkflowResponse;
}

export namespace StartWorkflowResponse {
    export type AsObject = {
        instanceId: string,
    }
}

export class TerminateWorkflowRequest extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): TerminateWorkflowRequest;
    getWorkflowComponent(): string;
    setWorkflowComponent(value: string): TerminateWorkflowRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TerminateWorkflowRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TerminateWorkflowRequest): TerminateWorkflowRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TerminateWorkflowRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TerminateWorkflowRequest;
    static deserializeBinaryFromReader(message: TerminateWorkflowRequest, reader: jspb.BinaryReader): TerminateWorkflowRequest;
}

export namespace TerminateWorkflowRequest {
    export type AsObject = {
        instanceId: string,
        workflowComponent: string,
    }
}

export class PauseWorkflowRequest extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): PauseWorkflowRequest;
    getWorkflowComponent(): string;
    setWorkflowComponent(value: string): PauseWorkflowRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PauseWorkflowRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PauseWorkflowRequest): PauseWorkflowRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PauseWorkflowRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PauseWorkflowRequest;
    static deserializeBinaryFromReader(message: PauseWorkflowRequest, reader: jspb.BinaryReader): PauseWorkflowRequest;
}

export namespace PauseWorkflowRequest {
    export type AsObject = {
        instanceId: string,
        workflowComponent: string,
    }
}

export class ResumeWorkflowRequest extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): ResumeWorkflowRequest;
    getWorkflowComponent(): string;
    setWorkflowComponent(value: string): ResumeWorkflowRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ResumeWorkflowRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ResumeWorkflowRequest): ResumeWorkflowRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ResumeWorkflowRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ResumeWorkflowRequest;
    static deserializeBinaryFromReader(message: ResumeWorkflowRequest, reader: jspb.BinaryReader): ResumeWorkflowRequest;
}

export namespace ResumeWorkflowRequest {
    export type AsObject = {
        instanceId: string,
        workflowComponent: string,
    }
}

export class RaiseEventWorkflowRequest extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): RaiseEventWorkflowRequest;
    getWorkflowComponent(): string;
    setWorkflowComponent(value: string): RaiseEventWorkflowRequest;
    getEventName(): string;
    setEventName(value: string): RaiseEventWorkflowRequest;
    getEventData(): Uint8Array | string;
    getEventData_asU8(): Uint8Array;
    getEventData_asB64(): string;
    setEventData(value: Uint8Array | string): RaiseEventWorkflowRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RaiseEventWorkflowRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RaiseEventWorkflowRequest): RaiseEventWorkflowRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RaiseEventWorkflowRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RaiseEventWorkflowRequest;
    static deserializeBinaryFromReader(message: RaiseEventWorkflowRequest, reader: jspb.BinaryReader): RaiseEventWorkflowRequest;
}

export namespace RaiseEventWorkflowRequest {
    export type AsObject = {
        instanceId: string,
        workflowComponent: string,
        eventName: string,
        eventData: Uint8Array | string,
    }
}

export class PurgeWorkflowRequest extends jspb.Message { 
    getInstanceId(): string;
    setInstanceId(value: string): PurgeWorkflowRequest;
    getWorkflowComponent(): string;
    setWorkflowComponent(value: string): PurgeWorkflowRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PurgeWorkflowRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PurgeWorkflowRequest): PurgeWorkflowRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PurgeWorkflowRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PurgeWorkflowRequest;
    static deserializeBinaryFromReader(message: PurgeWorkflowRequest, reader: jspb.BinaryReader): PurgeWorkflowRequest;
}

export namespace PurgeWorkflowRequest {
    export type AsObject = {
        instanceId: string,
        workflowComponent: string,
    }
}

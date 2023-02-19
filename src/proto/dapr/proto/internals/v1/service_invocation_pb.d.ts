// package: dapr.proto.internals.v1
// file: dapr/proto/internals/v1/service_invocation.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";
import * as dapr_proto_internals_v1_apiversion_pb from "../../../../dapr/proto/internals/v1/apiversion_pb";
import * as dapr_proto_internals_v1_status_pb from "../../../../dapr/proto/internals/v1/status_pb";

export class Actor extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): Actor;
    getActorId(): string;
    setActorId(value: string): Actor;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Actor.AsObject;
    static toObject(includeInstance: boolean, msg: Actor): Actor.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Actor, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Actor;
    static deserializeBinaryFromReader(message: Actor, reader: jspb.BinaryReader): Actor;
}

export namespace Actor {
    export type AsObject = {
        actorType: string,
        actorId: string,
    }
}

export class InternalInvokeRequest extends jspb.Message { 
    getVer(): dapr_proto_internals_v1_apiversion_pb.APIVersion;
    setVer(value: dapr_proto_internals_v1_apiversion_pb.APIVersion): InternalInvokeRequest;

    getMetadataMap(): jspb.Map<string, ListStringValue>;
    clearMetadataMap(): void;

    hasMessage(): boolean;
    clearMessage(): void;
    getMessage(): dapr_proto_common_v1_common_pb.InvokeRequest | undefined;
    setMessage(value?: dapr_proto_common_v1_common_pb.InvokeRequest): InternalInvokeRequest;

    hasActor(): boolean;
    clearActor(): void;
    getActor(): Actor | undefined;
    setActor(value?: Actor): InternalInvokeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InternalInvokeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InternalInvokeRequest): InternalInvokeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InternalInvokeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InternalInvokeRequest;
    static deserializeBinaryFromReader(message: InternalInvokeRequest, reader: jspb.BinaryReader): InternalInvokeRequest;
}

export namespace InternalInvokeRequest {
    export type AsObject = {
        ver: dapr_proto_internals_v1_apiversion_pb.APIVersion,

        metadataMap: Array<[string, ListStringValue.AsObject]>,
        message?: dapr_proto_common_v1_common_pb.InvokeRequest.AsObject,
        actor?: Actor.AsObject,
    }
}

export class InternalInvokeResponse extends jspb.Message { 

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): dapr_proto_internals_v1_status_pb.Status | undefined;
    setStatus(value?: dapr_proto_internals_v1_status_pb.Status): InternalInvokeResponse;

    getHeadersMap(): jspb.Map<string, ListStringValue>;
    clearHeadersMap(): void;

    getTrailersMap(): jspb.Map<string, ListStringValue>;
    clearTrailersMap(): void;

    hasMessage(): boolean;
    clearMessage(): void;
    getMessage(): dapr_proto_common_v1_common_pb.InvokeResponse | undefined;
    setMessage(value?: dapr_proto_common_v1_common_pb.InvokeResponse): InternalInvokeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InternalInvokeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InternalInvokeResponse): InternalInvokeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InternalInvokeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InternalInvokeResponse;
    static deserializeBinaryFromReader(message: InternalInvokeResponse, reader: jspb.BinaryReader): InternalInvokeResponse;
}

export namespace InternalInvokeResponse {
    export type AsObject = {
        status?: dapr_proto_internals_v1_status_pb.Status.AsObject,

        headersMap: Array<[string, ListStringValue.AsObject]>,

        trailersMap: Array<[string, ListStringValue.AsObject]>,
        message?: dapr_proto_common_v1_common_pb.InvokeResponse.AsObject,
    }
}

export class InternalInvokeRequestStream extends jspb.Message { 

    hasRequest(): boolean;
    clearRequest(): void;
    getRequest(): InternalInvokeRequest | undefined;
    setRequest(value?: InternalInvokeRequest): InternalInvokeRequestStream;

    hasPayload(): boolean;
    clearPayload(): void;
    getPayload(): dapr_proto_common_v1_common_pb.StreamPayload | undefined;
    setPayload(value?: dapr_proto_common_v1_common_pb.StreamPayload): InternalInvokeRequestStream;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InternalInvokeRequestStream.AsObject;
    static toObject(includeInstance: boolean, msg: InternalInvokeRequestStream): InternalInvokeRequestStream.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InternalInvokeRequestStream, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InternalInvokeRequestStream;
    static deserializeBinaryFromReader(message: InternalInvokeRequestStream, reader: jspb.BinaryReader): InternalInvokeRequestStream;
}

export namespace InternalInvokeRequestStream {
    export type AsObject = {
        request?: InternalInvokeRequest.AsObject,
        payload?: dapr_proto_common_v1_common_pb.StreamPayload.AsObject,
    }
}

export class InternalInvokeResponseStream extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): InternalInvokeResponse | undefined;
    setResponse(value?: InternalInvokeResponse): InternalInvokeResponseStream;

    hasPayload(): boolean;
    clearPayload(): void;
    getPayload(): dapr_proto_common_v1_common_pb.StreamPayload | undefined;
    setPayload(value?: dapr_proto_common_v1_common_pb.StreamPayload): InternalInvokeResponseStream;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InternalInvokeResponseStream.AsObject;
    static toObject(includeInstance: boolean, msg: InternalInvokeResponseStream): InternalInvokeResponseStream.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InternalInvokeResponseStream, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InternalInvokeResponseStream;
    static deserializeBinaryFromReader(message: InternalInvokeResponseStream, reader: jspb.BinaryReader): InternalInvokeResponseStream;
}

export namespace InternalInvokeResponseStream {
    export type AsObject = {
        response?: InternalInvokeResponse.AsObject,
        payload?: dapr_proto_common_v1_common_pb.StreamPayload.AsObject,
    }
}

export class ListStringValue extends jspb.Message { 
    clearValuesList(): void;
    getValuesList(): Array<string>;
    setValuesList(value: Array<string>): ListStringValue;
    addValues(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListStringValue.AsObject;
    static toObject(includeInstance: boolean, msg: ListStringValue): ListStringValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListStringValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListStringValue;
    static deserializeBinaryFromReader(message: ListStringValue, reader: jspb.BinaryReader): ListStringValue;
}

export namespace ListStringValue {
    export type AsObject = {
        valuesList: Array<string>,
    }
}

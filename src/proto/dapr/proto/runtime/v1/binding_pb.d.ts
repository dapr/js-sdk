// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/binding.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class InvokeBindingRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): InvokeBindingRequest;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): InvokeBindingRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;
    getOperation(): string;
    setOperation(value: string): InvokeBindingRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvokeBindingRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InvokeBindingRequest): InvokeBindingRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvokeBindingRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvokeBindingRequest;
    static deserializeBinaryFromReader(message: InvokeBindingRequest, reader: jspb.BinaryReader): InvokeBindingRequest;
}

export namespace InvokeBindingRequest {
    export type AsObject = {
        name: string,
        data: Uint8Array | string,

        metadataMap: Array<[string, string]>,
        operation: string,
    }
}

export class InvokeBindingResponse extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): InvokeBindingResponse;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvokeBindingResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InvokeBindingResponse): InvokeBindingResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvokeBindingResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvokeBindingResponse;
    static deserializeBinaryFromReader(message: InvokeBindingResponse, reader: jspb.BinaryReader): InvokeBindingResponse;
}

export namespace InvokeBindingResponse {
    export type AsObject = {
        data: Uint8Array | string,

        metadataMap: Array<[string, string]>,
    }
}

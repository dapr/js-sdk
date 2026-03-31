// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/secret.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetSecretRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): GetSecretRequest;
    getKey(): string;
    setKey(value: string): GetSecretRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetSecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetSecretRequest): GetSecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetSecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetSecretRequest;
    static deserializeBinaryFromReader(message: GetSecretRequest, reader: jspb.BinaryReader): GetSecretRequest;
}

export namespace GetSecretRequest {
    export type AsObject = {
        storeName: string,
        key: string,

        metadataMap: Array<[string, string]>,
    }
}

export class GetSecretResponse extends jspb.Message { 

    getDataMap(): jspb.Map<string, string>;
    clearDataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetSecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetSecretResponse): GetSecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetSecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetSecretResponse;
    static deserializeBinaryFromReader(message: GetSecretResponse, reader: jspb.BinaryReader): GetSecretResponse;
}

export namespace GetSecretResponse {
    export type AsObject = {

        dataMap: Array<[string, string]>,
    }
}

export class GetBulkSecretRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): GetBulkSecretRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetBulkSecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetBulkSecretRequest): GetBulkSecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetBulkSecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetBulkSecretRequest;
    static deserializeBinaryFromReader(message: GetBulkSecretRequest, reader: jspb.BinaryReader): GetBulkSecretRequest;
}

export namespace GetBulkSecretRequest {
    export type AsObject = {
        storeName: string,

        metadataMap: Array<[string, string]>,
    }
}

export class SecretResponse extends jspb.Message { 

    getSecretsMap(): jspb.Map<string, string>;
    clearSecretsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SecretResponse): SecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecretResponse;
    static deserializeBinaryFromReader(message: SecretResponse, reader: jspb.BinaryReader): SecretResponse;
}

export namespace SecretResponse {
    export type AsObject = {

        secretsMap: Array<[string, string]>,
    }
}

export class GetBulkSecretResponse extends jspb.Message { 

    getDataMap(): jspb.Map<string, SecretResponse>;
    clearDataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetBulkSecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetBulkSecretResponse): GetBulkSecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetBulkSecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetBulkSecretResponse;
    static deserializeBinaryFromReader(message: GetBulkSecretResponse, reader: jspb.BinaryReader): GetBulkSecretResponse;
}

export namespace GetBulkSecretResponse {
    export type AsObject = {

        dataMap: Array<[string, SecretResponse.AsObject]>,
    }
}

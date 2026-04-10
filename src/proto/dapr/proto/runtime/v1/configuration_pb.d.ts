// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/configuration.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class GetConfigurationRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): GetConfigurationRequest;
    clearKeysList(): void;
    getKeysList(): Array<string>;
    setKeysList(value: Array<string>): GetConfigurationRequest;
    addKeys(value: string, index?: number): string;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetConfigurationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetConfigurationRequest): GetConfigurationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetConfigurationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetConfigurationRequest;
    static deserializeBinaryFromReader(message: GetConfigurationRequest, reader: jspb.BinaryReader): GetConfigurationRequest;
}

export namespace GetConfigurationRequest {
    export type AsObject = {
        storeName: string,
        keysList: Array<string>,

        metadataMap: Array<[string, string]>,
    }
}

export class GetConfigurationResponse extends jspb.Message { 

    getItemsMap(): jspb.Map<string, dapr_proto_common_v1_common_pb.ConfigurationItem>;
    clearItemsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetConfigurationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetConfigurationResponse): GetConfigurationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetConfigurationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetConfigurationResponse;
    static deserializeBinaryFromReader(message: GetConfigurationResponse, reader: jspb.BinaryReader): GetConfigurationResponse;
}

export namespace GetConfigurationResponse {
    export type AsObject = {

        itemsMap: Array<[string, dapr_proto_common_v1_common_pb.ConfigurationItem.AsObject]>,
    }
}

export class SubscribeConfigurationRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): SubscribeConfigurationRequest;
    clearKeysList(): void;
    getKeysList(): Array<string>;
    setKeysList(value: Array<string>): SubscribeConfigurationRequest;
    addKeys(value: string, index?: number): string;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeConfigurationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeConfigurationRequest): SubscribeConfigurationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeConfigurationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeConfigurationRequest;
    static deserializeBinaryFromReader(message: SubscribeConfigurationRequest, reader: jspb.BinaryReader): SubscribeConfigurationRequest;
}

export namespace SubscribeConfigurationRequest {
    export type AsObject = {
        storeName: string,
        keysList: Array<string>,

        metadataMap: Array<[string, string]>,
    }
}

export class UnsubscribeConfigurationRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): UnsubscribeConfigurationRequest;
    getId(): string;
    setId(value: string): UnsubscribeConfigurationRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnsubscribeConfigurationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnsubscribeConfigurationRequest): UnsubscribeConfigurationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnsubscribeConfigurationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnsubscribeConfigurationRequest;
    static deserializeBinaryFromReader(message: UnsubscribeConfigurationRequest, reader: jspb.BinaryReader): UnsubscribeConfigurationRequest;
}

export namespace UnsubscribeConfigurationRequest {
    export type AsObject = {
        storeName: string,
        id: string,
    }
}

export class SubscribeConfigurationResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): SubscribeConfigurationResponse;

    getItemsMap(): jspb.Map<string, dapr_proto_common_v1_common_pb.ConfigurationItem>;
    clearItemsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeConfigurationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeConfigurationResponse): SubscribeConfigurationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeConfigurationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeConfigurationResponse;
    static deserializeBinaryFromReader(message: SubscribeConfigurationResponse, reader: jspb.BinaryReader): SubscribeConfigurationResponse;
}

export namespace SubscribeConfigurationResponse {
    export type AsObject = {
        id: string,

        itemsMap: Array<[string, dapr_proto_common_v1_common_pb.ConfigurationItem.AsObject]>,
    }
}

export class UnsubscribeConfigurationResponse extends jspb.Message { 
    getOk(): boolean;
    setOk(value: boolean): UnsubscribeConfigurationResponse;
    getMessage(): string;
    setMessage(value: string): UnsubscribeConfigurationResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnsubscribeConfigurationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnsubscribeConfigurationResponse): UnsubscribeConfigurationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnsubscribeConfigurationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnsubscribeConfigurationResponse;
    static deserializeBinaryFromReader(message: UnsubscribeConfigurationResponse, reader: jspb.BinaryReader): UnsubscribeConfigurationResponse;
}

export namespace UnsubscribeConfigurationResponse {
    export type AsObject = {
        ok: boolean,
        message: string,
    }
}

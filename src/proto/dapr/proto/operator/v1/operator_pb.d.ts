// package: dapr.proto.operator.v1
// file: dapr/proto/operator/v1/operator.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

export class ListComponentsRequest extends jspb.Message { 
    getNamespace(): string;
    setNamespace(value: string): ListComponentsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListComponentsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListComponentsRequest): ListComponentsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListComponentsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListComponentsRequest;
    static deserializeBinaryFromReader(message: ListComponentsRequest, reader: jspb.BinaryReader): ListComponentsRequest;
}

export namespace ListComponentsRequest {
    export type AsObject = {
        namespace: string,
    }
}

export class ComponentUpdateRequest extends jspb.Message { 
    getNamespace(): string;
    setNamespace(value: string): ComponentUpdateRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ComponentUpdateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ComponentUpdateRequest): ComponentUpdateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ComponentUpdateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ComponentUpdateRequest;
    static deserializeBinaryFromReader(message: ComponentUpdateRequest, reader: jspb.BinaryReader): ComponentUpdateRequest;
}

export namespace ComponentUpdateRequest {
    export type AsObject = {
        namespace: string,
    }
}

export class ComponentUpdateEvent extends jspb.Message { 
    getComponent(): Uint8Array | string;
    getComponent_asU8(): Uint8Array;
    getComponent_asB64(): string;
    setComponent(value: Uint8Array | string): ComponentUpdateEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ComponentUpdateEvent.AsObject;
    static toObject(includeInstance: boolean, msg: ComponentUpdateEvent): ComponentUpdateEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ComponentUpdateEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ComponentUpdateEvent;
    static deserializeBinaryFromReader(message: ComponentUpdateEvent, reader: jspb.BinaryReader): ComponentUpdateEvent;
}

export namespace ComponentUpdateEvent {
    export type AsObject = {
        component: Uint8Array | string,
    }
}

export class ListComponentResponse extends jspb.Message { 
    clearComponentsList(): void;
    getComponentsList(): Array<Uint8Array | string>;
    getComponentsList_asU8(): Array<Uint8Array>;
    getComponentsList_asB64(): Array<string>;
    setComponentsList(value: Array<Uint8Array | string>): ListComponentResponse;
    addComponents(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListComponentResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListComponentResponse): ListComponentResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListComponentResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListComponentResponse;
    static deserializeBinaryFromReader(message: ListComponentResponse, reader: jspb.BinaryReader): ListComponentResponse;
}

export namespace ListComponentResponse {
    export type AsObject = {
        componentsList: Array<Uint8Array | string>,
    }
}

export class GetConfigurationRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): GetConfigurationRequest;
    getNamespace(): string;
    setNamespace(value: string): GetConfigurationRequest;

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
        name: string,
        namespace: string,
    }
}

export class GetConfigurationResponse extends jspb.Message { 
    getConfiguration(): Uint8Array | string;
    getConfiguration_asU8(): Uint8Array;
    getConfiguration_asB64(): string;
    setConfiguration(value: Uint8Array | string): GetConfigurationResponse;

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
        configuration: Uint8Array | string,
    }
}

export class ListSubscriptionsResponse extends jspb.Message { 
    clearSubscriptionsList(): void;
    getSubscriptionsList(): Array<Uint8Array | string>;
    getSubscriptionsList_asU8(): Array<Uint8Array>;
    getSubscriptionsList_asB64(): Array<string>;
    setSubscriptionsList(value: Array<Uint8Array | string>): ListSubscriptionsResponse;
    addSubscriptions(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSubscriptionsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListSubscriptionsResponse): ListSubscriptionsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSubscriptionsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSubscriptionsResponse;
    static deserializeBinaryFromReader(message: ListSubscriptionsResponse, reader: jspb.BinaryReader): ListSubscriptionsResponse;
}

export namespace ListSubscriptionsResponse {
    export type AsObject = {
        subscriptionsList: Array<Uint8Array | string>,
    }
}

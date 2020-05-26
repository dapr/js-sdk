// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/appcallback.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class TopicEventRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): void;

    getSource(): string;
    setSource(value: string): void;

    getType(): string;
    setType(value: string): void;

    getSpecVersion(): string;
    setSpecVersion(value: string): void;

    getDataContentType(): string;
    setDataContentType(value: string): void;

    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): void;

    getTopic(): string;
    setTopic(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TopicEventRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TopicEventRequest): TopicEventRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TopicEventRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TopicEventRequest;
    static deserializeBinaryFromReader(message: TopicEventRequest, reader: jspb.BinaryReader): TopicEventRequest;
}

export namespace TopicEventRequest {
    export type AsObject = {
        id: string,
        source: string,
        type: string,
        specVersion: string,
        dataContentType: string,
        data: Uint8Array | string,
        topic: string,
    }
}

export class BindingEventRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): void;

    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): void;


    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BindingEventRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BindingEventRequest): BindingEventRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BindingEventRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BindingEventRequest;
    static deserializeBinaryFromReader(message: BindingEventRequest, reader: jspb.BinaryReader): BindingEventRequest;
}

export namespace BindingEventRequest {
    export type AsObject = {
        name: string,
        data: Uint8Array | string,

        metadataMap: Array<[string, string]>,
    }
}

export class BindingEventResponse extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): void;

    clearStatesList(): void;
    getStatesList(): Array<dapr_proto_common_v1_common_pb.StateItem>;
    setStatesList(value: Array<dapr_proto_common_v1_common_pb.StateItem>): void;
    addStates(value?: dapr_proto_common_v1_common_pb.StateItem, index?: number): dapr_proto_common_v1_common_pb.StateItem;

    clearToList(): void;
    getToList(): Array<string>;
    setToList(value: Array<string>): void;
    addTo(value: string, index?: number): string;

    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): void;

    getConcurrency(): BindingEventResponse.BindingEventConcurrency;
    setConcurrency(value: BindingEventResponse.BindingEventConcurrency): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BindingEventResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BindingEventResponse): BindingEventResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BindingEventResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BindingEventResponse;
    static deserializeBinaryFromReader(message: BindingEventResponse, reader: jspb.BinaryReader): BindingEventResponse;
}

export namespace BindingEventResponse {
    export type AsObject = {
        storeName: string,
        statesList: Array<dapr_proto_common_v1_common_pb.StateItem.AsObject>,
        toList: Array<string>,
        data: Uint8Array | string,
        concurrency: BindingEventResponse.BindingEventConcurrency,
    }

    export enum BindingEventConcurrency {
    SEQUENTIAL = 0,
    PARALLEL = 1,
    }

}

export class ListTopicSubscriptionsResponse extends jspb.Message { 
    clearSubscriptionsList(): void;
    getSubscriptionsList(): Array<TopicSubscription>;
    setSubscriptionsList(value: Array<TopicSubscription>): void;
    addSubscriptions(value?: TopicSubscription, index?: number): TopicSubscription;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListTopicSubscriptionsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListTopicSubscriptionsResponse): ListTopicSubscriptionsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListTopicSubscriptionsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListTopicSubscriptionsResponse;
    static deserializeBinaryFromReader(message: ListTopicSubscriptionsResponse, reader: jspb.BinaryReader): ListTopicSubscriptionsResponse;
}

export namespace ListTopicSubscriptionsResponse {
    export type AsObject = {
        subscriptionsList: Array<TopicSubscription.AsObject>,
    }
}

export class TopicSubscription extends jspb.Message { 
    getTopic(): string;
    setTopic(value: string): void;


    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TopicSubscription.AsObject;
    static toObject(includeInstance: boolean, msg: TopicSubscription): TopicSubscription.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TopicSubscription, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TopicSubscription;
    static deserializeBinaryFromReader(message: TopicSubscription, reader: jspb.BinaryReader): TopicSubscription;
}

export namespace TopicSubscription {
    export type AsObject = {
        topic: string,

        metadataMap: Array<[string, string]>,
    }
}

export class ListInputBindingsResponse extends jspb.Message { 
    clearBindingsList(): void;
    getBindingsList(): Array<string>;
    setBindingsList(value: Array<string>): void;
    addBindings(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListInputBindingsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListInputBindingsResponse): ListInputBindingsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListInputBindingsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListInputBindingsResponse;
    static deserializeBinaryFromReader(message: ListInputBindingsResponse, reader: jspb.BinaryReader): ListInputBindingsResponse;
}

export namespace ListInputBindingsResponse {
    export type AsObject = {
        bindingsList: Array<string>,
    }
}

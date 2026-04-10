// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/pubsub.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as dapr_proto_runtime_v1_appcallback_pb from "../../../../dapr/proto/runtime/v1/appcallback_pb";

export class PublishEventRequest extends jspb.Message { 
    getPubsubName(): string;
    setPubsubName(value: string): PublishEventRequest;
    getTopic(): string;
    setTopic(value: string): PublishEventRequest;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): PublishEventRequest;
    getDataContentType(): string;
    setDataContentType(value: string): PublishEventRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PublishEventRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PublishEventRequest): PublishEventRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PublishEventRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PublishEventRequest;
    static deserializeBinaryFromReader(message: PublishEventRequest, reader: jspb.BinaryReader): PublishEventRequest;
}

export namespace PublishEventRequest {
    export type AsObject = {
        pubsubName: string,
        topic: string,
        data: Uint8Array | string,
        dataContentType: string,

        metadataMap: Array<[string, string]>,
    }
}

export class BulkPublishRequest extends jspb.Message { 
    getPubsubName(): string;
    setPubsubName(value: string): BulkPublishRequest;
    getTopic(): string;
    setTopic(value: string): BulkPublishRequest;
    clearEntriesList(): void;
    getEntriesList(): Array<BulkPublishRequestEntry>;
    setEntriesList(value: Array<BulkPublishRequestEntry>): BulkPublishRequest;
    addEntries(value?: BulkPublishRequestEntry, index?: number): BulkPublishRequestEntry;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BulkPublishRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BulkPublishRequest): BulkPublishRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BulkPublishRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BulkPublishRequest;
    static deserializeBinaryFromReader(message: BulkPublishRequest, reader: jspb.BinaryReader): BulkPublishRequest;
}

export namespace BulkPublishRequest {
    export type AsObject = {
        pubsubName: string,
        topic: string,
        entriesList: Array<BulkPublishRequestEntry.AsObject>,

        metadataMap: Array<[string, string]>,
    }
}

export class BulkPublishRequestEntry extends jspb.Message { 
    getEntryId(): string;
    setEntryId(value: string): BulkPublishRequestEntry;
    getEvent(): Uint8Array | string;
    getEvent_asU8(): Uint8Array;
    getEvent_asB64(): string;
    setEvent(value: Uint8Array | string): BulkPublishRequestEntry;
    getContentType(): string;
    setContentType(value: string): BulkPublishRequestEntry;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BulkPublishRequestEntry.AsObject;
    static toObject(includeInstance: boolean, msg: BulkPublishRequestEntry): BulkPublishRequestEntry.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BulkPublishRequestEntry, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BulkPublishRequestEntry;
    static deserializeBinaryFromReader(message: BulkPublishRequestEntry, reader: jspb.BinaryReader): BulkPublishRequestEntry;
}

export namespace BulkPublishRequestEntry {
    export type AsObject = {
        entryId: string,
        event: Uint8Array | string,
        contentType: string,

        metadataMap: Array<[string, string]>,
    }
}

export class BulkPublishResponse extends jspb.Message { 
    clearFailedentriesList(): void;
    getFailedentriesList(): Array<BulkPublishResponseFailedEntry>;
    setFailedentriesList(value: Array<BulkPublishResponseFailedEntry>): BulkPublishResponse;
    addFailedentries(value?: BulkPublishResponseFailedEntry, index?: number): BulkPublishResponseFailedEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BulkPublishResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BulkPublishResponse): BulkPublishResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BulkPublishResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BulkPublishResponse;
    static deserializeBinaryFromReader(message: BulkPublishResponse, reader: jspb.BinaryReader): BulkPublishResponse;
}

export namespace BulkPublishResponse {
    export type AsObject = {
        failedentriesList: Array<BulkPublishResponseFailedEntry.AsObject>,
    }
}

export class BulkPublishResponseFailedEntry extends jspb.Message { 
    getEntryId(): string;
    setEntryId(value: string): BulkPublishResponseFailedEntry;
    getError(): string;
    setError(value: string): BulkPublishResponseFailedEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BulkPublishResponseFailedEntry.AsObject;
    static toObject(includeInstance: boolean, msg: BulkPublishResponseFailedEntry): BulkPublishResponseFailedEntry.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BulkPublishResponseFailedEntry, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BulkPublishResponseFailedEntry;
    static deserializeBinaryFromReader(message: BulkPublishResponseFailedEntry, reader: jspb.BinaryReader): BulkPublishResponseFailedEntry;
}

export namespace BulkPublishResponseFailedEntry {
    export type AsObject = {
        entryId: string,
        error: string,
    }
}

export class SubscribeTopicEventsRequestAlpha1 extends jspb.Message { 

    hasInitialRequest(): boolean;
    clearInitialRequest(): void;
    getInitialRequest(): SubscribeTopicEventsRequestInitialAlpha1 | undefined;
    setInitialRequest(value?: SubscribeTopicEventsRequestInitialAlpha1): SubscribeTopicEventsRequestAlpha1;

    hasEventProcessed(): boolean;
    clearEventProcessed(): void;
    getEventProcessed(): SubscribeTopicEventsRequestProcessedAlpha1 | undefined;
    setEventProcessed(value?: SubscribeTopicEventsRequestProcessedAlpha1): SubscribeTopicEventsRequestAlpha1;

    getSubscribeTopicEventsRequestTypeCase(): SubscribeTopicEventsRequestAlpha1.SubscribeTopicEventsRequestTypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeTopicEventsRequestAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeTopicEventsRequestAlpha1): SubscribeTopicEventsRequestAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeTopicEventsRequestAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeTopicEventsRequestAlpha1;
    static deserializeBinaryFromReader(message: SubscribeTopicEventsRequestAlpha1, reader: jspb.BinaryReader): SubscribeTopicEventsRequestAlpha1;
}

export namespace SubscribeTopicEventsRequestAlpha1 {
    export type AsObject = {
        initialRequest?: SubscribeTopicEventsRequestInitialAlpha1.AsObject,
        eventProcessed?: SubscribeTopicEventsRequestProcessedAlpha1.AsObject,
    }

    export enum SubscribeTopicEventsRequestTypeCase {
        SUBSCRIBE_TOPIC_EVENTS_REQUEST_TYPE_NOT_SET = 0,
        INITIAL_REQUEST = 1,
        EVENT_PROCESSED = 2,
    }

}

export class SubscribeTopicEventsRequestInitialAlpha1 extends jspb.Message { 
    getPubsubName(): string;
    setPubsubName(value: string): SubscribeTopicEventsRequestInitialAlpha1;
    getTopic(): string;
    setTopic(value: string): SubscribeTopicEventsRequestInitialAlpha1;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    hasDeadLetterTopic(): boolean;
    clearDeadLetterTopic(): void;
    getDeadLetterTopic(): string | undefined;
    setDeadLetterTopic(value: string): SubscribeTopicEventsRequestInitialAlpha1;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeTopicEventsRequestInitialAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeTopicEventsRequestInitialAlpha1): SubscribeTopicEventsRequestInitialAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeTopicEventsRequestInitialAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeTopicEventsRequestInitialAlpha1;
    static deserializeBinaryFromReader(message: SubscribeTopicEventsRequestInitialAlpha1, reader: jspb.BinaryReader): SubscribeTopicEventsRequestInitialAlpha1;
}

export namespace SubscribeTopicEventsRequestInitialAlpha1 {
    export type AsObject = {
        pubsubName: string,
        topic: string,

        metadataMap: Array<[string, string]>,
        deadLetterTopic?: string,
    }
}

export class SubscribeTopicEventsRequestProcessedAlpha1 extends jspb.Message { 
    getId(): string;
    setId(value: string): SubscribeTopicEventsRequestProcessedAlpha1;

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): dapr_proto_runtime_v1_appcallback_pb.TopicEventResponse | undefined;
    setStatus(value?: dapr_proto_runtime_v1_appcallback_pb.TopicEventResponse): SubscribeTopicEventsRequestProcessedAlpha1;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeTopicEventsRequestProcessedAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeTopicEventsRequestProcessedAlpha1): SubscribeTopicEventsRequestProcessedAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeTopicEventsRequestProcessedAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeTopicEventsRequestProcessedAlpha1;
    static deserializeBinaryFromReader(message: SubscribeTopicEventsRequestProcessedAlpha1, reader: jspb.BinaryReader): SubscribeTopicEventsRequestProcessedAlpha1;
}

export namespace SubscribeTopicEventsRequestProcessedAlpha1 {
    export type AsObject = {
        id: string,
        status?: dapr_proto_runtime_v1_appcallback_pb.TopicEventResponse.AsObject,
    }
}

export class SubscribeTopicEventsResponseAlpha1 extends jspb.Message { 

    hasInitialResponse(): boolean;
    clearInitialResponse(): void;
    getInitialResponse(): SubscribeTopicEventsResponseInitialAlpha1 | undefined;
    setInitialResponse(value?: SubscribeTopicEventsResponseInitialAlpha1): SubscribeTopicEventsResponseAlpha1;

    hasEventMessage(): boolean;
    clearEventMessage(): void;
    getEventMessage(): dapr_proto_runtime_v1_appcallback_pb.TopicEventRequest | undefined;
    setEventMessage(value?: dapr_proto_runtime_v1_appcallback_pb.TopicEventRequest): SubscribeTopicEventsResponseAlpha1;

    getSubscribeTopicEventsResponseTypeCase(): SubscribeTopicEventsResponseAlpha1.SubscribeTopicEventsResponseTypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeTopicEventsResponseAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeTopicEventsResponseAlpha1): SubscribeTopicEventsResponseAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeTopicEventsResponseAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeTopicEventsResponseAlpha1;
    static deserializeBinaryFromReader(message: SubscribeTopicEventsResponseAlpha1, reader: jspb.BinaryReader): SubscribeTopicEventsResponseAlpha1;
}

export namespace SubscribeTopicEventsResponseAlpha1 {
    export type AsObject = {
        initialResponse?: SubscribeTopicEventsResponseInitialAlpha1.AsObject,
        eventMessage?: dapr_proto_runtime_v1_appcallback_pb.TopicEventRequest.AsObject,
    }

    export enum SubscribeTopicEventsResponseTypeCase {
        SUBSCRIBE_TOPIC_EVENTS_RESPONSE_TYPE_NOT_SET = 0,
        INITIAL_RESPONSE = 1,
        EVENT_MESSAGE = 2,
    }

}

export class SubscribeTopicEventsResponseInitialAlpha1 extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeTopicEventsResponseInitialAlpha1.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeTopicEventsResponseInitialAlpha1): SubscribeTopicEventsResponseInitialAlpha1.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeTopicEventsResponseInitialAlpha1, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeTopicEventsResponseInitialAlpha1;
    static deserializeBinaryFromReader(message: SubscribeTopicEventsResponseInitialAlpha1, reader: jspb.BinaryReader): SubscribeTopicEventsResponseInitialAlpha1;
}

export namespace SubscribeTopicEventsResponseInitialAlpha1 {
    export type AsObject = {
    }
}

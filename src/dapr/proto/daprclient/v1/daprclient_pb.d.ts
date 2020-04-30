// package: dapr.proto.daprclient.v1
// file: dapr/proto/daprclient/v1/daprclient.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class CloudEventEnvelope extends jspb.Message { 
    getId(): string;
    setId(value: string): void;

    getSource(): string;
    setSource(value: string): void;

    getType(): string;
    setType(value: string): void;

    getSpecversion(): string;
    setSpecversion(value: string): void;

    getDataContentType(): string;
    setDataContentType(value: string): void;

    getTopic(): string;
    setTopic(value: string): void;


    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CloudEventEnvelope.AsObject;
    static toObject(includeInstance: boolean, msg: CloudEventEnvelope): CloudEventEnvelope.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CloudEventEnvelope, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CloudEventEnvelope;
    static deserializeBinaryFromReader(message: CloudEventEnvelope, reader: jspb.BinaryReader): CloudEventEnvelope;
}

export namespace CloudEventEnvelope {
    export type AsObject = {
        id: string,
        source: string,
        type: string,
        specversion: string,
        dataContentType: string,
        topic: string,
        data?: google_protobuf_any_pb.Any.AsObject,
    }
}

export class BindingEventEnvelope extends jspb.Message { 
    getName(): string;
    setName(value: string): void;


    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): void;


    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BindingEventEnvelope.AsObject;
    static toObject(includeInstance: boolean, msg: BindingEventEnvelope): BindingEventEnvelope.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BindingEventEnvelope, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BindingEventEnvelope;
    static deserializeBinaryFromReader(message: BindingEventEnvelope, reader: jspb.BinaryReader): BindingEventEnvelope;
}

export namespace BindingEventEnvelope {
    export type AsObject = {
        name: string,
        data?: google_protobuf_any_pb.Any.AsObject,

        metadataMap: Array<[string, string]>,
    }
}

export class BindingResponseEnvelope extends jspb.Message { 

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): void;

    clearToList(): void;
    getToList(): Array<string>;
    setToList(value: Array<string>): void;
    addTo(value: string, index?: number): string;

    clearStateList(): void;
    getStateList(): Array<State>;
    setStateList(value: Array<State>): void;
    addState(value?: State, index?: number): State;

    getConcurrency(): string;
    setConcurrency(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BindingResponseEnvelope.AsObject;
    static toObject(includeInstance: boolean, msg: BindingResponseEnvelope): BindingResponseEnvelope.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BindingResponseEnvelope, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BindingResponseEnvelope;
    static deserializeBinaryFromReader(message: BindingResponseEnvelope, reader: jspb.BinaryReader): BindingResponseEnvelope;
}

export namespace BindingResponseEnvelope {
    export type AsObject = {
        data?: google_protobuf_any_pb.Any.AsObject,
        toList: Array<string>,
        stateList: Array<State.AsObject>,
        concurrency: string,
    }
}

export class GetTopicSubscriptionsEnvelope extends jspb.Message { 
    clearTopicsList(): void;
    getTopicsList(): Array<string>;
    setTopicsList(value: Array<string>): void;
    addTopics(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTopicSubscriptionsEnvelope.AsObject;
    static toObject(includeInstance: boolean, msg: GetTopicSubscriptionsEnvelope): GetTopicSubscriptionsEnvelope.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetTopicSubscriptionsEnvelope, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetTopicSubscriptionsEnvelope;
    static deserializeBinaryFromReader(message: GetTopicSubscriptionsEnvelope, reader: jspb.BinaryReader): GetTopicSubscriptionsEnvelope;
}

export namespace GetTopicSubscriptionsEnvelope {
    export type AsObject = {
        topicsList: Array<string>,
    }
}

export class GetBindingsSubscriptionsEnvelope extends jspb.Message { 
    clearBindingsList(): void;
    getBindingsList(): Array<string>;
    setBindingsList(value: Array<string>): void;
    addBindings(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetBindingsSubscriptionsEnvelope.AsObject;
    static toObject(includeInstance: boolean, msg: GetBindingsSubscriptionsEnvelope): GetBindingsSubscriptionsEnvelope.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetBindingsSubscriptionsEnvelope, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetBindingsSubscriptionsEnvelope;
    static deserializeBinaryFromReader(message: GetBindingsSubscriptionsEnvelope, reader: jspb.BinaryReader): GetBindingsSubscriptionsEnvelope;
}

export namespace GetBindingsSubscriptionsEnvelope {
    export type AsObject = {
        bindingsList: Array<string>,
    }
}

export class State extends jspb.Message { 
    getKey(): string;
    setKey(value: string): void;


    hasValue(): boolean;
    clearValue(): void;
    getValue(): google_protobuf_any_pb.Any | undefined;
    setValue(value?: google_protobuf_any_pb.Any): void;

    getEtag(): string;
    setEtag(value: string): void;


    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;


    hasOptions(): boolean;
    clearOptions(): void;
    getOptions(): StateOptions | undefined;
    setOptions(value?: StateOptions): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): State.AsObject;
    static toObject(includeInstance: boolean, msg: State): State.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: State, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): State;
    static deserializeBinaryFromReader(message: State, reader: jspb.BinaryReader): State;
}

export namespace State {
    export type AsObject = {
        key: string,
        value?: google_protobuf_any_pb.Any.AsObject,
        etag: string,

        metadataMap: Array<[string, string]>,
        options?: StateOptions.AsObject,
    }
}

export class StateOptions extends jspb.Message { 
    getConcurrency(): string;
    setConcurrency(value: string): void;

    getConsistency(): string;
    setConsistency(value: string): void;


    hasRetryPolicy(): boolean;
    clearRetryPolicy(): void;
    getRetryPolicy(): RetryPolicy | undefined;
    setRetryPolicy(value?: RetryPolicy): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StateOptions.AsObject;
    static toObject(includeInstance: boolean, msg: StateOptions): StateOptions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StateOptions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StateOptions;
    static deserializeBinaryFromReader(message: StateOptions, reader: jspb.BinaryReader): StateOptions;
}

export namespace StateOptions {
    export type AsObject = {
        concurrency: string,
        consistency: string,
        retryPolicy?: RetryPolicy.AsObject,
    }
}

export class RetryPolicy extends jspb.Message { 
    getThreshold(): number;
    setThreshold(value: number): void;

    getPattern(): string;
    setPattern(value: string): void;


    hasInterval(): boolean;
    clearInterval(): void;
    getInterval(): google_protobuf_duration_pb.Duration | undefined;
    setInterval(value?: google_protobuf_duration_pb.Duration): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RetryPolicy.AsObject;
    static toObject(includeInstance: boolean, msg: RetryPolicy): RetryPolicy.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RetryPolicy, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RetryPolicy;
    static deserializeBinaryFromReader(message: RetryPolicy, reader: jspb.BinaryReader): RetryPolicy;
}

export namespace RetryPolicy {
    export type AsObject = {
        threshold: number,
        pattern: string,
        interval?: google_protobuf_duration_pb.Duration.AsObject,
    }
}

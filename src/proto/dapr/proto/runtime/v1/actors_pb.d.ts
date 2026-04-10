// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/actors.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class RegisterActorTimerRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): RegisterActorTimerRequest;
    getActorId(): string;
    setActorId(value: string): RegisterActorTimerRequest;
    getName(): string;
    setName(value: string): RegisterActorTimerRequest;
    getDueTime(): string;
    setDueTime(value: string): RegisterActorTimerRequest;
    getPeriod(): string;
    setPeriod(value: string): RegisterActorTimerRequest;
    getCallback(): string;
    setCallback(value: string): RegisterActorTimerRequest;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): RegisterActorTimerRequest;
    getTtl(): string;
    setTtl(value: string): RegisterActorTimerRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RegisterActorTimerRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RegisterActorTimerRequest): RegisterActorTimerRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RegisterActorTimerRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RegisterActorTimerRequest;
    static deserializeBinaryFromReader(message: RegisterActorTimerRequest, reader: jspb.BinaryReader): RegisterActorTimerRequest;
}

export namespace RegisterActorTimerRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        name: string,
        dueTime: string,
        period: string,
        callback: string,
        data: Uint8Array | string,
        ttl: string,
    }
}

export class UnregisterActorTimerRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): UnregisterActorTimerRequest;
    getActorId(): string;
    setActorId(value: string): UnregisterActorTimerRequest;
    getName(): string;
    setName(value: string): UnregisterActorTimerRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnregisterActorTimerRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnregisterActorTimerRequest): UnregisterActorTimerRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnregisterActorTimerRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnregisterActorTimerRequest;
    static deserializeBinaryFromReader(message: UnregisterActorTimerRequest, reader: jspb.BinaryReader): UnregisterActorTimerRequest;
}

export namespace UnregisterActorTimerRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        name: string,
    }
}

export class RegisterActorReminderRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): RegisterActorReminderRequest;
    getActorId(): string;
    setActorId(value: string): RegisterActorReminderRequest;
    getName(): string;
    setName(value: string): RegisterActorReminderRequest;
    getDueTime(): string;
    setDueTime(value: string): RegisterActorReminderRequest;
    getPeriod(): string;
    setPeriod(value: string): RegisterActorReminderRequest;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): RegisterActorReminderRequest;
    getTtl(): string;
    setTtl(value: string): RegisterActorReminderRequest;

    hasOverwrite(): boolean;
    clearOverwrite(): void;
    getOverwrite(): boolean | undefined;
    setOverwrite(value: boolean): RegisterActorReminderRequest;

    hasFailurePolicy(): boolean;
    clearFailurePolicy(): void;
    getFailurePolicy(): dapr_proto_common_v1_common_pb.JobFailurePolicy | undefined;
    setFailurePolicy(value?: dapr_proto_common_v1_common_pb.JobFailurePolicy): RegisterActorReminderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RegisterActorReminderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RegisterActorReminderRequest): RegisterActorReminderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RegisterActorReminderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RegisterActorReminderRequest;
    static deserializeBinaryFromReader(message: RegisterActorReminderRequest, reader: jspb.BinaryReader): RegisterActorReminderRequest;
}

export namespace RegisterActorReminderRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        name: string,
        dueTime: string,
        period: string,
        data: Uint8Array | string,
        ttl: string,
        overwrite?: boolean,
        failurePolicy?: dapr_proto_common_v1_common_pb.JobFailurePolicy.AsObject,
    }
}

export class UnregisterActorReminderRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): UnregisterActorReminderRequest;
    getActorId(): string;
    setActorId(value: string): UnregisterActorReminderRequest;
    getName(): string;
    setName(value: string): UnregisterActorReminderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnregisterActorReminderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnregisterActorReminderRequest): UnregisterActorReminderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnregisterActorReminderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnregisterActorReminderRequest;
    static deserializeBinaryFromReader(message: UnregisterActorReminderRequest, reader: jspb.BinaryReader): UnregisterActorReminderRequest;
}

export namespace UnregisterActorReminderRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        name: string,
    }
}

export class GetActorStateRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): GetActorStateRequest;
    getActorId(): string;
    setActorId(value: string): GetActorStateRequest;
    getKey(): string;
    setKey(value: string): GetActorStateRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetActorStateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetActorStateRequest): GetActorStateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetActorStateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetActorStateRequest;
    static deserializeBinaryFromReader(message: GetActorStateRequest, reader: jspb.BinaryReader): GetActorStateRequest;
}

export namespace GetActorStateRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        key: string,
    }
}

export class GetActorStateResponse extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): GetActorStateResponse;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetActorStateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetActorStateResponse): GetActorStateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetActorStateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetActorStateResponse;
    static deserializeBinaryFromReader(message: GetActorStateResponse, reader: jspb.BinaryReader): GetActorStateResponse;
}

export namespace GetActorStateResponse {
    export type AsObject = {
        data: Uint8Array | string,

        metadataMap: Array<[string, string]>,
    }
}

export class ExecuteActorStateTransactionRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): ExecuteActorStateTransactionRequest;
    getActorId(): string;
    setActorId(value: string): ExecuteActorStateTransactionRequest;
    clearOperationsList(): void;
    getOperationsList(): Array<TransactionalActorStateOperation>;
    setOperationsList(value: Array<TransactionalActorStateOperation>): ExecuteActorStateTransactionRequest;
    addOperations(value?: TransactionalActorStateOperation, index?: number): TransactionalActorStateOperation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteActorStateTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteActorStateTransactionRequest): ExecuteActorStateTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteActorStateTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteActorStateTransactionRequest;
    static deserializeBinaryFromReader(message: ExecuteActorStateTransactionRequest, reader: jspb.BinaryReader): ExecuteActorStateTransactionRequest;
}

export namespace ExecuteActorStateTransactionRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        operationsList: Array<TransactionalActorStateOperation.AsObject>,
    }
}

export class TransactionalActorStateOperation extends jspb.Message { 
    getOperationtype(): string;
    setOperationtype(value: string): TransactionalActorStateOperation;
    getKey(): string;
    setKey(value: string): TransactionalActorStateOperation;

    hasValue(): boolean;
    clearValue(): void;
    getValue(): google_protobuf_any_pb.Any | undefined;
    setValue(value?: google_protobuf_any_pb.Any): TransactionalActorStateOperation;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransactionalActorStateOperation.AsObject;
    static toObject(includeInstance: boolean, msg: TransactionalActorStateOperation): TransactionalActorStateOperation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransactionalActorStateOperation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransactionalActorStateOperation;
    static deserializeBinaryFromReader(message: TransactionalActorStateOperation, reader: jspb.BinaryReader): TransactionalActorStateOperation;
}

export namespace TransactionalActorStateOperation {
    export type AsObject = {
        operationtype: string,
        key: string,
        value?: google_protobuf_any_pb.Any.AsObject,

        metadataMap: Array<[string, string]>,
    }
}

export class InvokeActorRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): InvokeActorRequest;
    getActorId(): string;
    setActorId(value: string): InvokeActorRequest;
    getMethod(): string;
    setMethod(value: string): InvokeActorRequest;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): InvokeActorRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvokeActorRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InvokeActorRequest): InvokeActorRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvokeActorRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvokeActorRequest;
    static deserializeBinaryFromReader(message: InvokeActorRequest, reader: jspb.BinaryReader): InvokeActorRequest;
}

export namespace InvokeActorRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        method: string,
        data: Uint8Array | string,

        metadataMap: Array<[string, string]>,
    }
}

export class InvokeActorResponse extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): InvokeActorResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvokeActorResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InvokeActorResponse): InvokeActorResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvokeActorResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvokeActorResponse;
    static deserializeBinaryFromReader(message: InvokeActorResponse, reader: jspb.BinaryReader): InvokeActorResponse;
}

export namespace InvokeActorResponse {
    export type AsObject = {
        data: Uint8Array | string,
    }
}

export class GetActorReminderRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): GetActorReminderRequest;
    getActorId(): string;
    setActorId(value: string): GetActorReminderRequest;
    getName(): string;
    setName(value: string): GetActorReminderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetActorReminderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetActorReminderRequest): GetActorReminderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetActorReminderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetActorReminderRequest;
    static deserializeBinaryFromReader(message: GetActorReminderRequest, reader: jspb.BinaryReader): GetActorReminderRequest;
}

export namespace GetActorReminderRequest {
    export type AsObject = {
        actorType: string,
        actorId: string,
        name: string,
    }
}

export class GetActorReminderResponse extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): GetActorReminderResponse;
    getActorId(): string;
    setActorId(value: string): GetActorReminderResponse;

    hasDueTime(): boolean;
    clearDueTime(): void;
    getDueTime(): string | undefined;
    setDueTime(value: string): GetActorReminderResponse;

    hasPeriod(): boolean;
    clearPeriod(): void;
    getPeriod(): string | undefined;
    setPeriod(value: string): GetActorReminderResponse;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): GetActorReminderResponse;

    hasTtl(): boolean;
    clearTtl(): void;
    getTtl(): string | undefined;
    setTtl(value: string): GetActorReminderResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetActorReminderResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetActorReminderResponse): GetActorReminderResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetActorReminderResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetActorReminderResponse;
    static deserializeBinaryFromReader(message: GetActorReminderResponse, reader: jspb.BinaryReader): GetActorReminderResponse;
}

export namespace GetActorReminderResponse {
    export type AsObject = {
        actorType: string,
        actorId: string,
        dueTime?: string,
        period?: string,
        data?: google_protobuf_any_pb.Any.AsObject,
        ttl?: string,
    }
}

export class ListActorRemindersRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): ListActorRemindersRequest;

    hasActorId(): boolean;
    clearActorId(): void;
    getActorId(): string | undefined;
    setActorId(value: string): ListActorRemindersRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListActorRemindersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListActorRemindersRequest): ListActorRemindersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListActorRemindersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListActorRemindersRequest;
    static deserializeBinaryFromReader(message: ListActorRemindersRequest, reader: jspb.BinaryReader): ListActorRemindersRequest;
}

export namespace ListActorRemindersRequest {
    export type AsObject = {
        actorType: string,
        actorId?: string,
    }
}

export class ListActorRemindersResponse extends jspb.Message { 
    clearRemindersList(): void;
    getRemindersList(): Array<NamedActorReminder>;
    setRemindersList(value: Array<NamedActorReminder>): ListActorRemindersResponse;
    addReminders(value?: NamedActorReminder, index?: number): NamedActorReminder;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListActorRemindersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListActorRemindersResponse): ListActorRemindersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListActorRemindersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListActorRemindersResponse;
    static deserializeBinaryFromReader(message: ListActorRemindersResponse, reader: jspb.BinaryReader): ListActorRemindersResponse;
}

export namespace ListActorRemindersResponse {
    export type AsObject = {
        remindersList: Array<NamedActorReminder.AsObject>,
    }
}

export class NamedActorReminder extends jspb.Message { 
    getName(): string;
    setName(value: string): NamedActorReminder;

    hasReminder(): boolean;
    clearReminder(): void;
    getReminder(): ActorReminder | undefined;
    setReminder(value?: ActorReminder): NamedActorReminder;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NamedActorReminder.AsObject;
    static toObject(includeInstance: boolean, msg: NamedActorReminder): NamedActorReminder.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NamedActorReminder, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NamedActorReminder;
    static deserializeBinaryFromReader(message: NamedActorReminder, reader: jspb.BinaryReader): NamedActorReminder;
}

export namespace NamedActorReminder {
    export type AsObject = {
        name: string,
        reminder?: ActorReminder.AsObject,
    }
}

export class ActorReminder extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): ActorReminder;
    getActorId(): string;
    setActorId(value: string): ActorReminder;

    hasDueTime(): boolean;
    clearDueTime(): void;
    getDueTime(): string | undefined;
    setDueTime(value: string): ActorReminder;

    hasPeriod(): boolean;
    clearPeriod(): void;
    getPeriod(): string | undefined;
    setPeriod(value: string): ActorReminder;

    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_any_pb.Any | undefined;
    setData(value?: google_protobuf_any_pb.Any): ActorReminder;

    hasTtl(): boolean;
    clearTtl(): void;
    getTtl(): string | undefined;
    setTtl(value: string): ActorReminder;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ActorReminder.AsObject;
    static toObject(includeInstance: boolean, msg: ActorReminder): ActorReminder.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ActorReminder, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ActorReminder;
    static deserializeBinaryFromReader(message: ActorReminder, reader: jspb.BinaryReader): ActorReminder;
}

export namespace ActorReminder {
    export type AsObject = {
        actorType: string,
        actorId: string,
        dueTime?: string,
        period?: string,
        data?: google_protobuf_any_pb.Any.AsObject,
        ttl?: string,
    }
}

export class UnregisterActorRemindersByTypeRequest extends jspb.Message { 
    getActorType(): string;
    setActorType(value: string): UnregisterActorRemindersByTypeRequest;

    hasActorId(): boolean;
    clearActorId(): void;
    getActorId(): string | undefined;
    setActorId(value: string): UnregisterActorRemindersByTypeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnregisterActorRemindersByTypeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnregisterActorRemindersByTypeRequest): UnregisterActorRemindersByTypeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnregisterActorRemindersByTypeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnregisterActorRemindersByTypeRequest;
    static deserializeBinaryFromReader(message: UnregisterActorRemindersByTypeRequest, reader: jspb.BinaryReader): UnregisterActorRemindersByTypeRequest;
}

export namespace UnregisterActorRemindersByTypeRequest {
    export type AsObject = {
        actorType: string,
        actorId?: string,
    }
}

export class UnregisterActorRemindersByTypeResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnregisterActorRemindersByTypeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnregisterActorRemindersByTypeResponse): UnregisterActorRemindersByTypeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnregisterActorRemindersByTypeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnregisterActorRemindersByTypeResponse;
    static deserializeBinaryFromReader(message: UnregisterActorRemindersByTypeResponse, reader: jspb.BinaryReader): UnregisterActorRemindersByTypeResponse;
}

export namespace UnregisterActorRemindersByTypeResponse {
    export type AsObject = {
    }
}

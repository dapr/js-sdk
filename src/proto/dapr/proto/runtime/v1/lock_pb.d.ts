// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/lock.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class TryLockRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): TryLockRequest;
    getResourceId(): string;
    setResourceId(value: string): TryLockRequest;
    getLockOwner(): string;
    setLockOwner(value: string): TryLockRequest;
    getExpiryInSeconds(): number;
    setExpiryInSeconds(value: number): TryLockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TryLockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TryLockRequest): TryLockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TryLockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TryLockRequest;
    static deserializeBinaryFromReader(message: TryLockRequest, reader: jspb.BinaryReader): TryLockRequest;
}

export namespace TryLockRequest {
    export type AsObject = {
        storeName: string,
        resourceId: string,
        lockOwner: string,
        expiryInSeconds: number,
    }
}

export class TryLockResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): TryLockResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TryLockResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TryLockResponse): TryLockResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TryLockResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TryLockResponse;
    static deserializeBinaryFromReader(message: TryLockResponse, reader: jspb.BinaryReader): TryLockResponse;
}

export namespace TryLockResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class UnlockRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): UnlockRequest;
    getResourceId(): string;
    setResourceId(value: string): UnlockRequest;
    getLockOwner(): string;
    setLockOwner(value: string): UnlockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnlockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnlockRequest): UnlockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnlockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnlockRequest;
    static deserializeBinaryFromReader(message: UnlockRequest, reader: jspb.BinaryReader): UnlockRequest;
}

export namespace UnlockRequest {
    export type AsObject = {
        storeName: string,
        resourceId: string,
        lockOwner: string,
    }
}

export class UnlockResponse extends jspb.Message { 
    getStatus(): UnlockResponse.Status;
    setStatus(value: UnlockResponse.Status): UnlockResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnlockResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnlockResponse): UnlockResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnlockResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnlockResponse;
    static deserializeBinaryFromReader(message: UnlockResponse, reader: jspb.BinaryReader): UnlockResponse;
}

export namespace UnlockResponse {
    export type AsObject = {
        status: UnlockResponse.Status,
    }

    export enum Status {
    SUCCESS = 0,
    LOCK_DOES_NOT_EXIST = 1,
    LOCK_BELONGS_TO_OTHERS = 2,
    INTERNAL_ERROR = 3,
    }

}

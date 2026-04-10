// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/crypto.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class SubtleGetKeyRequest extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): SubtleGetKeyRequest;
    getName(): string;
    setName(value: string): SubtleGetKeyRequest;
    getFormat(): SubtleGetKeyRequest.KeyFormat;
    setFormat(value: SubtleGetKeyRequest.KeyFormat): SubtleGetKeyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleGetKeyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleGetKeyRequest): SubtleGetKeyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleGetKeyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleGetKeyRequest;
    static deserializeBinaryFromReader(message: SubtleGetKeyRequest, reader: jspb.BinaryReader): SubtleGetKeyRequest;
}

export namespace SubtleGetKeyRequest {
    export type AsObject = {
        componentName: string,
        name: string,
        format: SubtleGetKeyRequest.KeyFormat,
    }

    export enum KeyFormat {
    PEM = 0,
    JSON = 1,
    }

}

export class SubtleGetKeyResponse extends jspb.Message { 
    getName(): string;
    setName(value: string): SubtleGetKeyResponse;
    getPublicKey(): string;
    setPublicKey(value: string): SubtleGetKeyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleGetKeyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleGetKeyResponse): SubtleGetKeyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleGetKeyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleGetKeyResponse;
    static deserializeBinaryFromReader(message: SubtleGetKeyResponse, reader: jspb.BinaryReader): SubtleGetKeyResponse;
}

export namespace SubtleGetKeyResponse {
    export type AsObject = {
        name: string,
        publicKey: string,
    }
}

export class SubtleEncryptRequest extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): SubtleEncryptRequest;
    getPlaintext(): Uint8Array | string;
    getPlaintext_asU8(): Uint8Array;
    getPlaintext_asB64(): string;
    setPlaintext(value: Uint8Array | string): SubtleEncryptRequest;
    getAlgorithm(): string;
    setAlgorithm(value: string): SubtleEncryptRequest;
    getKeyName(): string;
    setKeyName(value: string): SubtleEncryptRequest;
    getNonce(): Uint8Array | string;
    getNonce_asU8(): Uint8Array;
    getNonce_asB64(): string;
    setNonce(value: Uint8Array | string): SubtleEncryptRequest;
    getAssociatedData(): Uint8Array | string;
    getAssociatedData_asU8(): Uint8Array;
    getAssociatedData_asB64(): string;
    setAssociatedData(value: Uint8Array | string): SubtleEncryptRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleEncryptRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleEncryptRequest): SubtleEncryptRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleEncryptRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleEncryptRequest;
    static deserializeBinaryFromReader(message: SubtleEncryptRequest, reader: jspb.BinaryReader): SubtleEncryptRequest;
}

export namespace SubtleEncryptRequest {
    export type AsObject = {
        componentName: string,
        plaintext: Uint8Array | string,
        algorithm: string,
        keyName: string,
        nonce: Uint8Array | string,
        associatedData: Uint8Array | string,
    }
}

export class SubtleEncryptResponse extends jspb.Message { 
    getCiphertext(): Uint8Array | string;
    getCiphertext_asU8(): Uint8Array;
    getCiphertext_asB64(): string;
    setCiphertext(value: Uint8Array | string): SubtleEncryptResponse;
    getTag(): Uint8Array | string;
    getTag_asU8(): Uint8Array;
    getTag_asB64(): string;
    setTag(value: Uint8Array | string): SubtleEncryptResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleEncryptResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleEncryptResponse): SubtleEncryptResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleEncryptResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleEncryptResponse;
    static deserializeBinaryFromReader(message: SubtleEncryptResponse, reader: jspb.BinaryReader): SubtleEncryptResponse;
}

export namespace SubtleEncryptResponse {
    export type AsObject = {
        ciphertext: Uint8Array | string,
        tag: Uint8Array | string,
    }
}

export class SubtleDecryptRequest extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): SubtleDecryptRequest;
    getCiphertext(): Uint8Array | string;
    getCiphertext_asU8(): Uint8Array;
    getCiphertext_asB64(): string;
    setCiphertext(value: Uint8Array | string): SubtleDecryptRequest;
    getAlgorithm(): string;
    setAlgorithm(value: string): SubtleDecryptRequest;
    getKeyName(): string;
    setKeyName(value: string): SubtleDecryptRequest;
    getNonce(): Uint8Array | string;
    getNonce_asU8(): Uint8Array;
    getNonce_asB64(): string;
    setNonce(value: Uint8Array | string): SubtleDecryptRequest;
    getTag(): Uint8Array | string;
    getTag_asU8(): Uint8Array;
    getTag_asB64(): string;
    setTag(value: Uint8Array | string): SubtleDecryptRequest;
    getAssociatedData(): Uint8Array | string;
    getAssociatedData_asU8(): Uint8Array;
    getAssociatedData_asB64(): string;
    setAssociatedData(value: Uint8Array | string): SubtleDecryptRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleDecryptRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleDecryptRequest): SubtleDecryptRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleDecryptRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleDecryptRequest;
    static deserializeBinaryFromReader(message: SubtleDecryptRequest, reader: jspb.BinaryReader): SubtleDecryptRequest;
}

export namespace SubtleDecryptRequest {
    export type AsObject = {
        componentName: string,
        ciphertext: Uint8Array | string,
        algorithm: string,
        keyName: string,
        nonce: Uint8Array | string,
        tag: Uint8Array | string,
        associatedData: Uint8Array | string,
    }
}

export class SubtleDecryptResponse extends jspb.Message { 
    getPlaintext(): Uint8Array | string;
    getPlaintext_asU8(): Uint8Array;
    getPlaintext_asB64(): string;
    setPlaintext(value: Uint8Array | string): SubtleDecryptResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleDecryptResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleDecryptResponse): SubtleDecryptResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleDecryptResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleDecryptResponse;
    static deserializeBinaryFromReader(message: SubtleDecryptResponse, reader: jspb.BinaryReader): SubtleDecryptResponse;
}

export namespace SubtleDecryptResponse {
    export type AsObject = {
        plaintext: Uint8Array | string,
    }
}

export class SubtleWrapKeyRequest extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): SubtleWrapKeyRequest;
    getPlaintextKey(): Uint8Array | string;
    getPlaintextKey_asU8(): Uint8Array;
    getPlaintextKey_asB64(): string;
    setPlaintextKey(value: Uint8Array | string): SubtleWrapKeyRequest;
    getAlgorithm(): string;
    setAlgorithm(value: string): SubtleWrapKeyRequest;
    getKeyName(): string;
    setKeyName(value: string): SubtleWrapKeyRequest;
    getNonce(): Uint8Array | string;
    getNonce_asU8(): Uint8Array;
    getNonce_asB64(): string;
    setNonce(value: Uint8Array | string): SubtleWrapKeyRequest;
    getAssociatedData(): Uint8Array | string;
    getAssociatedData_asU8(): Uint8Array;
    getAssociatedData_asB64(): string;
    setAssociatedData(value: Uint8Array | string): SubtleWrapKeyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleWrapKeyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleWrapKeyRequest): SubtleWrapKeyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleWrapKeyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleWrapKeyRequest;
    static deserializeBinaryFromReader(message: SubtleWrapKeyRequest, reader: jspb.BinaryReader): SubtleWrapKeyRequest;
}

export namespace SubtleWrapKeyRequest {
    export type AsObject = {
        componentName: string,
        plaintextKey: Uint8Array | string,
        algorithm: string,
        keyName: string,
        nonce: Uint8Array | string,
        associatedData: Uint8Array | string,
    }
}

export class SubtleWrapKeyResponse extends jspb.Message { 
    getWrappedKey(): Uint8Array | string;
    getWrappedKey_asU8(): Uint8Array;
    getWrappedKey_asB64(): string;
    setWrappedKey(value: Uint8Array | string): SubtleWrapKeyResponse;
    getTag(): Uint8Array | string;
    getTag_asU8(): Uint8Array;
    getTag_asB64(): string;
    setTag(value: Uint8Array | string): SubtleWrapKeyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleWrapKeyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleWrapKeyResponse): SubtleWrapKeyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleWrapKeyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleWrapKeyResponse;
    static deserializeBinaryFromReader(message: SubtleWrapKeyResponse, reader: jspb.BinaryReader): SubtleWrapKeyResponse;
}

export namespace SubtleWrapKeyResponse {
    export type AsObject = {
        wrappedKey: Uint8Array | string,
        tag: Uint8Array | string,
    }
}

export class SubtleUnwrapKeyRequest extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): SubtleUnwrapKeyRequest;
    getWrappedKey(): Uint8Array | string;
    getWrappedKey_asU8(): Uint8Array;
    getWrappedKey_asB64(): string;
    setWrappedKey(value: Uint8Array | string): SubtleUnwrapKeyRequest;
    getAlgorithm(): string;
    setAlgorithm(value: string): SubtleUnwrapKeyRequest;
    getKeyName(): string;
    setKeyName(value: string): SubtleUnwrapKeyRequest;
    getNonce(): Uint8Array | string;
    getNonce_asU8(): Uint8Array;
    getNonce_asB64(): string;
    setNonce(value: Uint8Array | string): SubtleUnwrapKeyRequest;
    getTag(): Uint8Array | string;
    getTag_asU8(): Uint8Array;
    getTag_asB64(): string;
    setTag(value: Uint8Array | string): SubtleUnwrapKeyRequest;
    getAssociatedData(): Uint8Array | string;
    getAssociatedData_asU8(): Uint8Array;
    getAssociatedData_asB64(): string;
    setAssociatedData(value: Uint8Array | string): SubtleUnwrapKeyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleUnwrapKeyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleUnwrapKeyRequest): SubtleUnwrapKeyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleUnwrapKeyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleUnwrapKeyRequest;
    static deserializeBinaryFromReader(message: SubtleUnwrapKeyRequest, reader: jspb.BinaryReader): SubtleUnwrapKeyRequest;
}

export namespace SubtleUnwrapKeyRequest {
    export type AsObject = {
        componentName: string,
        wrappedKey: Uint8Array | string,
        algorithm: string,
        keyName: string,
        nonce: Uint8Array | string,
        tag: Uint8Array | string,
        associatedData: Uint8Array | string,
    }
}

export class SubtleUnwrapKeyResponse extends jspb.Message { 
    getPlaintextKey(): Uint8Array | string;
    getPlaintextKey_asU8(): Uint8Array;
    getPlaintextKey_asB64(): string;
    setPlaintextKey(value: Uint8Array | string): SubtleUnwrapKeyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleUnwrapKeyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleUnwrapKeyResponse): SubtleUnwrapKeyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleUnwrapKeyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleUnwrapKeyResponse;
    static deserializeBinaryFromReader(message: SubtleUnwrapKeyResponse, reader: jspb.BinaryReader): SubtleUnwrapKeyResponse;
}

export namespace SubtleUnwrapKeyResponse {
    export type AsObject = {
        plaintextKey: Uint8Array | string,
    }
}

export class SubtleSignRequest extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): SubtleSignRequest;
    getDigest(): Uint8Array | string;
    getDigest_asU8(): Uint8Array;
    getDigest_asB64(): string;
    setDigest(value: Uint8Array | string): SubtleSignRequest;
    getAlgorithm(): string;
    setAlgorithm(value: string): SubtleSignRequest;
    getKeyName(): string;
    setKeyName(value: string): SubtleSignRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleSignRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleSignRequest): SubtleSignRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleSignRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleSignRequest;
    static deserializeBinaryFromReader(message: SubtleSignRequest, reader: jspb.BinaryReader): SubtleSignRequest;
}

export namespace SubtleSignRequest {
    export type AsObject = {
        componentName: string,
        digest: Uint8Array | string,
        algorithm: string,
        keyName: string,
    }
}

export class SubtleSignResponse extends jspb.Message { 
    getSignature(): Uint8Array | string;
    getSignature_asU8(): Uint8Array;
    getSignature_asB64(): string;
    setSignature(value: Uint8Array | string): SubtleSignResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleSignResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleSignResponse): SubtleSignResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleSignResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleSignResponse;
    static deserializeBinaryFromReader(message: SubtleSignResponse, reader: jspb.BinaryReader): SubtleSignResponse;
}

export namespace SubtleSignResponse {
    export type AsObject = {
        signature: Uint8Array | string,
    }
}

export class SubtleVerifyRequest extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): SubtleVerifyRequest;
    getDigest(): Uint8Array | string;
    getDigest_asU8(): Uint8Array;
    getDigest_asB64(): string;
    setDigest(value: Uint8Array | string): SubtleVerifyRequest;
    getAlgorithm(): string;
    setAlgorithm(value: string): SubtleVerifyRequest;
    getKeyName(): string;
    setKeyName(value: string): SubtleVerifyRequest;
    getSignature(): Uint8Array | string;
    getSignature_asU8(): Uint8Array;
    getSignature_asB64(): string;
    setSignature(value: Uint8Array | string): SubtleVerifyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleVerifyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleVerifyRequest): SubtleVerifyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleVerifyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleVerifyRequest;
    static deserializeBinaryFromReader(message: SubtleVerifyRequest, reader: jspb.BinaryReader): SubtleVerifyRequest;
}

export namespace SubtleVerifyRequest {
    export type AsObject = {
        componentName: string,
        digest: Uint8Array | string,
        algorithm: string,
        keyName: string,
        signature: Uint8Array | string,
    }
}

export class SubtleVerifyResponse extends jspb.Message { 
    getValid(): boolean;
    setValid(value: boolean): SubtleVerifyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubtleVerifyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubtleVerifyResponse): SubtleVerifyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubtleVerifyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubtleVerifyResponse;
    static deserializeBinaryFromReader(message: SubtleVerifyResponse, reader: jspb.BinaryReader): SubtleVerifyResponse;
}

export namespace SubtleVerifyResponse {
    export type AsObject = {
        valid: boolean,
    }
}

export class EncryptRequest extends jspb.Message { 

    hasOptions(): boolean;
    clearOptions(): void;
    getOptions(): EncryptRequestOptions | undefined;
    setOptions(value?: EncryptRequestOptions): EncryptRequest;

    hasPayload(): boolean;
    clearPayload(): void;
    getPayload(): dapr_proto_common_v1_common_pb.StreamPayload | undefined;
    setPayload(value?: dapr_proto_common_v1_common_pb.StreamPayload): EncryptRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EncryptRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EncryptRequest): EncryptRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EncryptRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EncryptRequest;
    static deserializeBinaryFromReader(message: EncryptRequest, reader: jspb.BinaryReader): EncryptRequest;
}

export namespace EncryptRequest {
    export type AsObject = {
        options?: EncryptRequestOptions.AsObject,
        payload?: dapr_proto_common_v1_common_pb.StreamPayload.AsObject,
    }
}

export class EncryptRequestOptions extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): EncryptRequestOptions;
    getKeyName(): string;
    setKeyName(value: string): EncryptRequestOptions;
    getKeyWrapAlgorithm(): string;
    setKeyWrapAlgorithm(value: string): EncryptRequestOptions;
    getDataEncryptionCipher(): string;
    setDataEncryptionCipher(value: string): EncryptRequestOptions;
    getOmitDecryptionKeyName(): boolean;
    setOmitDecryptionKeyName(value: boolean): EncryptRequestOptions;
    getDecryptionKeyName(): string;
    setDecryptionKeyName(value: string): EncryptRequestOptions;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EncryptRequestOptions.AsObject;
    static toObject(includeInstance: boolean, msg: EncryptRequestOptions): EncryptRequestOptions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EncryptRequestOptions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EncryptRequestOptions;
    static deserializeBinaryFromReader(message: EncryptRequestOptions, reader: jspb.BinaryReader): EncryptRequestOptions;
}

export namespace EncryptRequestOptions {
    export type AsObject = {
        componentName: string,
        keyName: string,
        keyWrapAlgorithm: string,
        dataEncryptionCipher: string,
        omitDecryptionKeyName: boolean,
        decryptionKeyName: string,
    }
}

export class EncryptResponse extends jspb.Message { 

    hasPayload(): boolean;
    clearPayload(): void;
    getPayload(): dapr_proto_common_v1_common_pb.StreamPayload | undefined;
    setPayload(value?: dapr_proto_common_v1_common_pb.StreamPayload): EncryptResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EncryptResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EncryptResponse): EncryptResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EncryptResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EncryptResponse;
    static deserializeBinaryFromReader(message: EncryptResponse, reader: jspb.BinaryReader): EncryptResponse;
}

export namespace EncryptResponse {
    export type AsObject = {
        payload?: dapr_proto_common_v1_common_pb.StreamPayload.AsObject,
    }
}

export class DecryptRequest extends jspb.Message { 

    hasOptions(): boolean;
    clearOptions(): void;
    getOptions(): DecryptRequestOptions | undefined;
    setOptions(value?: DecryptRequestOptions): DecryptRequest;

    hasPayload(): boolean;
    clearPayload(): void;
    getPayload(): dapr_proto_common_v1_common_pb.StreamPayload | undefined;
    setPayload(value?: dapr_proto_common_v1_common_pb.StreamPayload): DecryptRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecryptRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DecryptRequest): DecryptRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecryptRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecryptRequest;
    static deserializeBinaryFromReader(message: DecryptRequest, reader: jspb.BinaryReader): DecryptRequest;
}

export namespace DecryptRequest {
    export type AsObject = {
        options?: DecryptRequestOptions.AsObject,
        payload?: dapr_proto_common_v1_common_pb.StreamPayload.AsObject,
    }
}

export class DecryptRequestOptions extends jspb.Message { 
    getComponentName(): string;
    setComponentName(value: string): DecryptRequestOptions;
    getKeyName(): string;
    setKeyName(value: string): DecryptRequestOptions;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecryptRequestOptions.AsObject;
    static toObject(includeInstance: boolean, msg: DecryptRequestOptions): DecryptRequestOptions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecryptRequestOptions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecryptRequestOptions;
    static deserializeBinaryFromReader(message: DecryptRequestOptions, reader: jspb.BinaryReader): DecryptRequestOptions;
}

export namespace DecryptRequestOptions {
    export type AsObject = {
        componentName: string,
        keyName: string,
    }
}

export class DecryptResponse extends jspb.Message { 

    hasPayload(): boolean;
    clearPayload(): void;
    getPayload(): dapr_proto_common_v1_common_pb.StreamPayload | undefined;
    setPayload(value?: dapr_proto_common_v1_common_pb.StreamPayload): DecryptResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecryptResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DecryptResponse): DecryptResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecryptResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecryptResponse;
    static deserializeBinaryFromReader(message: DecryptResponse, reader: jspb.BinaryReader): DecryptResponse;
}

export namespace DecryptResponse {
    export type AsObject = {
        payload?: dapr_proto_common_v1_common_pb.StreamPayload.AsObject,
    }
}

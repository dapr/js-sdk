// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/state.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class GetStateRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): GetStateRequest;
    getKey(): string;
    setKey(value: string): GetStateRequest;
    getConsistency(): dapr_proto_common_v1_common_pb.StateOptions.StateConsistency;
    setConsistency(value: dapr_proto_common_v1_common_pb.StateOptions.StateConsistency): GetStateRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetStateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetStateRequest): GetStateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetStateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetStateRequest;
    static deserializeBinaryFromReader(message: GetStateRequest, reader: jspb.BinaryReader): GetStateRequest;
}

export namespace GetStateRequest {
    export type AsObject = {
        storeName: string,
        key: string,
        consistency: dapr_proto_common_v1_common_pb.StateOptions.StateConsistency,

        metadataMap: Array<[string, string]>,
    }
}

export class GetBulkStateRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): GetBulkStateRequest;
    clearKeysList(): void;
    getKeysList(): Array<string>;
    setKeysList(value: Array<string>): GetBulkStateRequest;
    addKeys(value: string, index?: number): string;
    getParallelism(): number;
    setParallelism(value: number): GetBulkStateRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetBulkStateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetBulkStateRequest): GetBulkStateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetBulkStateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetBulkStateRequest;
    static deserializeBinaryFromReader(message: GetBulkStateRequest, reader: jspb.BinaryReader): GetBulkStateRequest;
}

export namespace GetBulkStateRequest {
    export type AsObject = {
        storeName: string,
        keysList: Array<string>,
        parallelism: number,

        metadataMap: Array<[string, string]>,
    }
}

export class GetBulkStateResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<BulkStateItem>;
    setItemsList(value: Array<BulkStateItem>): GetBulkStateResponse;
    addItems(value?: BulkStateItem, index?: number): BulkStateItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetBulkStateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetBulkStateResponse): GetBulkStateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetBulkStateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetBulkStateResponse;
    static deserializeBinaryFromReader(message: GetBulkStateResponse, reader: jspb.BinaryReader): GetBulkStateResponse;
}

export namespace GetBulkStateResponse {
    export type AsObject = {
        itemsList: Array<BulkStateItem.AsObject>,
    }
}

export class BulkStateItem extends jspb.Message { 
    getKey(): string;
    setKey(value: string): BulkStateItem;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): BulkStateItem;
    getEtag(): string;
    setEtag(value: string): BulkStateItem;
    getError(): string;
    setError(value: string): BulkStateItem;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BulkStateItem.AsObject;
    static toObject(includeInstance: boolean, msg: BulkStateItem): BulkStateItem.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BulkStateItem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BulkStateItem;
    static deserializeBinaryFromReader(message: BulkStateItem, reader: jspb.BinaryReader): BulkStateItem;
}

export namespace BulkStateItem {
    export type AsObject = {
        key: string,
        data: Uint8Array | string,
        etag: string,
        error: string,

        metadataMap: Array<[string, string]>,
    }
}

export class GetStateResponse extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): GetStateResponse;
    getEtag(): string;
    setEtag(value: string): GetStateResponse;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetStateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetStateResponse): GetStateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetStateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetStateResponse;
    static deserializeBinaryFromReader(message: GetStateResponse, reader: jspb.BinaryReader): GetStateResponse;
}

export namespace GetStateResponse {
    export type AsObject = {
        data: Uint8Array | string,
        etag: string,

        metadataMap: Array<[string, string]>,
    }
}

export class DeleteStateRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): DeleteStateRequest;
    getKey(): string;
    setKey(value: string): DeleteStateRequest;

    hasEtag(): boolean;
    clearEtag(): void;
    getEtag(): dapr_proto_common_v1_common_pb.Etag | undefined;
    setEtag(value?: dapr_proto_common_v1_common_pb.Etag): DeleteStateRequest;

    hasOptions(): boolean;
    clearOptions(): void;
    getOptions(): dapr_proto_common_v1_common_pb.StateOptions | undefined;
    setOptions(value?: dapr_proto_common_v1_common_pb.StateOptions): DeleteStateRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteStateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteStateRequest): DeleteStateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteStateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteStateRequest;
    static deserializeBinaryFromReader(message: DeleteStateRequest, reader: jspb.BinaryReader): DeleteStateRequest;
}

export namespace DeleteStateRequest {
    export type AsObject = {
        storeName: string,
        key: string,
        etag?: dapr_proto_common_v1_common_pb.Etag.AsObject,
        options?: dapr_proto_common_v1_common_pb.StateOptions.AsObject,

        metadataMap: Array<[string, string]>,
    }
}

export class DeleteBulkStateRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): DeleteBulkStateRequest;
    clearStatesList(): void;
    getStatesList(): Array<dapr_proto_common_v1_common_pb.StateItem>;
    setStatesList(value: Array<dapr_proto_common_v1_common_pb.StateItem>): DeleteBulkStateRequest;
    addStates(value?: dapr_proto_common_v1_common_pb.StateItem, index?: number): dapr_proto_common_v1_common_pb.StateItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteBulkStateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteBulkStateRequest): DeleteBulkStateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteBulkStateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteBulkStateRequest;
    static deserializeBinaryFromReader(message: DeleteBulkStateRequest, reader: jspb.BinaryReader): DeleteBulkStateRequest;
}

export namespace DeleteBulkStateRequest {
    export type AsObject = {
        storeName: string,
        statesList: Array<dapr_proto_common_v1_common_pb.StateItem.AsObject>,
    }
}

export class SaveStateRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): SaveStateRequest;
    clearStatesList(): void;
    getStatesList(): Array<dapr_proto_common_v1_common_pb.StateItem>;
    setStatesList(value: Array<dapr_proto_common_v1_common_pb.StateItem>): SaveStateRequest;
    addStates(value?: dapr_proto_common_v1_common_pb.StateItem, index?: number): dapr_proto_common_v1_common_pb.StateItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SaveStateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SaveStateRequest): SaveStateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SaveStateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SaveStateRequest;
    static deserializeBinaryFromReader(message: SaveStateRequest, reader: jspb.BinaryReader): SaveStateRequest;
}

export namespace SaveStateRequest {
    export type AsObject = {
        storeName: string,
        statesList: Array<dapr_proto_common_v1_common_pb.StateItem.AsObject>,
    }
}

export class QueryStateRequest extends jspb.Message { 
    getStoreName(): string;
    setStoreName(value: string): QueryStateRequest;
    getQuery(): string;
    setQuery(value: string): QueryStateRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryStateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: QueryStateRequest): QueryStateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryStateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryStateRequest;
    static deserializeBinaryFromReader(message: QueryStateRequest, reader: jspb.BinaryReader): QueryStateRequest;
}

export namespace QueryStateRequest {
    export type AsObject = {
        storeName: string,
        query: string,

        metadataMap: Array<[string, string]>,
    }
}

export class QueryStateItem extends jspb.Message { 
    getKey(): string;
    setKey(value: string): QueryStateItem;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): QueryStateItem;
    getEtag(): string;
    setEtag(value: string): QueryStateItem;
    getError(): string;
    setError(value: string): QueryStateItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryStateItem.AsObject;
    static toObject(includeInstance: boolean, msg: QueryStateItem): QueryStateItem.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryStateItem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryStateItem;
    static deserializeBinaryFromReader(message: QueryStateItem, reader: jspb.BinaryReader): QueryStateItem;
}

export namespace QueryStateItem {
    export type AsObject = {
        key: string,
        data: Uint8Array | string,
        etag: string,
        error: string,
    }
}

export class QueryStateResponse extends jspb.Message { 
    clearResultsList(): void;
    getResultsList(): Array<QueryStateItem>;
    setResultsList(value: Array<QueryStateItem>): QueryStateResponse;
    addResults(value?: QueryStateItem, index?: number): QueryStateItem;
    getToken(): string;
    setToken(value: string): QueryStateResponse;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryStateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: QueryStateResponse): QueryStateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryStateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryStateResponse;
    static deserializeBinaryFromReader(message: QueryStateResponse, reader: jspb.BinaryReader): QueryStateResponse;
}

export namespace QueryStateResponse {
    export type AsObject = {
        resultsList: Array<QueryStateItem.AsObject>,
        token: string,

        metadataMap: Array<[string, string]>,
    }
}

export class TransactionalStateOperation extends jspb.Message { 
    getOperationtype(): string;
    setOperationtype(value: string): TransactionalStateOperation;

    hasRequest(): boolean;
    clearRequest(): void;
    getRequest(): dapr_proto_common_v1_common_pb.StateItem | undefined;
    setRequest(value?: dapr_proto_common_v1_common_pb.StateItem): TransactionalStateOperation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransactionalStateOperation.AsObject;
    static toObject(includeInstance: boolean, msg: TransactionalStateOperation): TransactionalStateOperation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransactionalStateOperation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransactionalStateOperation;
    static deserializeBinaryFromReader(message: TransactionalStateOperation, reader: jspb.BinaryReader): TransactionalStateOperation;
}

export namespace TransactionalStateOperation {
    export type AsObject = {
        operationtype: string,
        request?: dapr_proto_common_v1_common_pb.StateItem.AsObject,
    }
}

export class ExecuteStateTransactionRequest extends jspb.Message { 
    getStorename(): string;
    setStorename(value: string): ExecuteStateTransactionRequest;
    clearOperationsList(): void;
    getOperationsList(): Array<TransactionalStateOperation>;
    setOperationsList(value: Array<TransactionalStateOperation>): ExecuteStateTransactionRequest;
    addOperations(value?: TransactionalStateOperation, index?: number): TransactionalStateOperation;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecuteStateTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ExecuteStateTransactionRequest): ExecuteStateTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecuteStateTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecuteStateTransactionRequest;
    static deserializeBinaryFromReader(message: ExecuteStateTransactionRequest, reader: jspb.BinaryReader): ExecuteStateTransactionRequest;
}

export namespace ExecuteStateTransactionRequest {
    export type AsObject = {
        storename: string,
        operationsList: Array<TransactionalStateOperation.AsObject>,

        metadataMap: Array<[string, string]>,
    }
}

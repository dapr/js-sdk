// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/invoke.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";

export class InvokeServiceRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): InvokeServiceRequest;

    hasMessage(): boolean;
    clearMessage(): void;
    getMessage(): dapr_proto_common_v1_common_pb.InvokeRequest | undefined;
    setMessage(value?: dapr_proto_common_v1_common_pb.InvokeRequest): InvokeServiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvokeServiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InvokeServiceRequest): InvokeServiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvokeServiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvokeServiceRequest;
    static deserializeBinaryFromReader(message: InvokeServiceRequest, reader: jspb.BinaryReader): InvokeServiceRequest;
}

export namespace InvokeServiceRequest {
    export type AsObject = {
        id: string,
        message?: dapr_proto_common_v1_common_pb.InvokeRequest.AsObject,
    }
}

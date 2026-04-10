// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/dapr.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as dapr_proto_common_v1_common_pb from "../../../../dapr/proto/common/v1/common_pb";
import * as dapr_proto_runtime_v1_actors_pb from "../../../../dapr/proto/runtime/v1/actors_pb";
import * as dapr_proto_runtime_v1_pubsub_pb from "../../../../dapr/proto/runtime/v1/pubsub_pb";
import * as dapr_proto_runtime_v1_invoke_pb from "../../../../dapr/proto/runtime/v1/invoke_pb";
import * as dapr_proto_runtime_v1_state_pb from "../../../../dapr/proto/runtime/v1/state_pb";
import * as dapr_proto_runtime_v1_binding_pb from "../../../../dapr/proto/runtime/v1/binding_pb";
import * as dapr_proto_runtime_v1_secret_pb from "../../../../dapr/proto/runtime/v1/secret_pb";
import * as dapr_proto_runtime_v1_metadata_pb from "../../../../dapr/proto/runtime/v1/metadata_pb";
import * as dapr_proto_runtime_v1_configuration_pb from "../../../../dapr/proto/runtime/v1/configuration_pb";
import * as dapr_proto_runtime_v1_lock_pb from "../../../../dapr/proto/runtime/v1/lock_pb";
import * as dapr_proto_runtime_v1_crypto_pb from "../../../../dapr/proto/runtime/v1/crypto_pb";
import * as dapr_proto_runtime_v1_workflow_pb from "../../../../dapr/proto/runtime/v1/workflow_pb";
import * as dapr_proto_runtime_v1_jobs_pb from "../../../../dapr/proto/runtime/v1/jobs_pb";
import * as dapr_proto_runtime_v1_ai_pb from "../../../../dapr/proto/runtime/v1/ai_pb";

export class ShutdownRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShutdownRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ShutdownRequest): ShutdownRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShutdownRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShutdownRequest;
    static deserializeBinaryFromReader(message: ShutdownRequest, reader: jspb.BinaryReader): ShutdownRequest;
}

export namespace ShutdownRequest {
    export type AsObject = {
    }
}

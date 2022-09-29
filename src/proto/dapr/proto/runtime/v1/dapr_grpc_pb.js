// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
//
// Copyright 2021 The Dapr Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
"use strict";
var grpc = require("@grpc/grpc-js");
var dapr_proto_runtime_v1_dapr_pb = require("../../../../dapr/proto/runtime/v1/dapr_pb.js");
var google_protobuf_any_pb = require("google-protobuf/google/protobuf/any_pb.js");
var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb.js");
var dapr_proto_common_v1_common_pb = require("../../../../dapr/proto/common/v1/common_pb.js");

function serialize_dapr_proto_common_v1_InvokeResponse(arg) {
  if (!(arg instanceof dapr_proto_common_v1_common_pb.InvokeResponse)) {
    throw new Error("Expected argument of type dapr.proto.common.v1.InvokeResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_common_v1_InvokeResponse(buffer_arg) {
  return dapr_proto_common_v1_common_pb.InvokeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_DeleteBulkStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.DeleteBulkStateRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.DeleteBulkStateRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_DeleteBulkStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.DeleteBulkStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_DeleteStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.DeleteStateRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_DeleteStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_ExecuteActorStateTransactionRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.ExecuteActorStateTransactionRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_ExecuteActorStateTransactionRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.ExecuteActorStateTransactionRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  );
}

function serialize_dapr_proto_runtime_v1_ExecuteStateTransactionRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.ExecuteStateTransactionRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.ExecuteStateTransactionRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_ExecuteStateTransactionRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.ExecuteStateTransactionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetActorStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetActorStateRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetActorStateRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetActorStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetActorStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetActorStateResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetActorStateResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetActorStateResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetActorStateResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetActorStateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetBulkSecretRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetBulkSecretRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetBulkSecretRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetBulkSecretRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetBulkSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetBulkSecretResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetBulkSecretResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetBulkSecretResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetBulkSecretResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetBulkSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetBulkStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetBulkStateRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetBulkStateRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetBulkStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetBulkStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetBulkStateResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetBulkStateResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetBulkStateResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetBulkStateResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetBulkStateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetConfigurationRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetConfigurationRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetConfigurationRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetConfigurationRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetConfigurationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetConfigurationResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetConfigurationResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetConfigurationResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetConfigurationResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetConfigurationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetMetadataResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetMetadataResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetMetadataResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetMetadataResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetMetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetSecretRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetSecretRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetSecretRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetSecretRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetSecretResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetSecretResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetSecretResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetSecretResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetStateRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetStateRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetStateResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetStateResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.GetStateResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetStateResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetStateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeActorRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeActorRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.InvokeActorRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeActorRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeActorRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeActorResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeActorResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.InvokeActorResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeActorResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeActorResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeBindingRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.InvokeBindingRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeBindingRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeBindingResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeBindingResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.InvokeBindingResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeBindingResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeBindingResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeServiceRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.InvokeServiceRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeServiceRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_PublishEventRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.PublishEventRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.PublishEventRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_PublishEventRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.PublishEventRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_QueryStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.QueryStateRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.QueryStateRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_QueryStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.QueryStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_QueryStateResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.QueryStateResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.QueryStateResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_QueryStateResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.QueryStateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_RegisterActorReminderRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.RegisterActorReminderRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.RegisterActorReminderRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_RegisterActorReminderRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.RegisterActorReminderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_RegisterActorTimerRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.RegisterActorTimerRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.RegisterActorTimerRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_RegisterActorTimerRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.RegisterActorTimerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_RenameActorReminderRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.RenameActorReminderRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.RenameActorReminderRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_RenameActorReminderRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.RenameActorReminderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_SaveStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.SaveStateRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.SaveStateRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_SaveStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.SaveStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_SetMetadataRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.SetMetadataRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.SetMetadataRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_SetMetadataRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.SetMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_SubscribeConfigurationRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.SubscribeConfigurationRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.SubscribeConfigurationRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_SubscribeConfigurationRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.SubscribeConfigurationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_SubscribeConfigurationResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.SubscribeConfigurationResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.SubscribeConfigurationResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_SubscribeConfigurationResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.SubscribeConfigurationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_TryLockRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.TryLockRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.TryLockRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_TryLockRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.TryLockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_TryLockResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.TryLockResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.TryLockResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_TryLockResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.TryLockResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_UnlockRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.UnlockRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.UnlockRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_UnlockRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.UnlockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_UnlockResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.UnlockResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.UnlockResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_UnlockResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.UnlockResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_UnregisterActorReminderRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.UnregisterActorReminderRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.UnregisterActorReminderRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_UnregisterActorReminderRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.UnregisterActorReminderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_UnregisterActorTimerRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.UnregisterActorTimerRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.UnregisterActorTimerRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_UnregisterActorTimerRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.UnregisterActorTimerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_UnsubscribeConfigurationRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.UnsubscribeConfigurationRequest)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.UnsubscribeConfigurationRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_UnsubscribeConfigurationRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.UnsubscribeConfigurationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_UnsubscribeConfigurationResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.UnsubscribeConfigurationResponse)) {
    throw new Error("Expected argument of type dapr.proto.runtime.v1.UnsubscribeConfigurationResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_UnsubscribeConfigurationResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.UnsubscribeConfigurationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error("Expected argument of type google.protobuf.Empty");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

// Dapr service provides APIs to user application to access Dapr building blocks.
var DaprService = (exports.DaprService = {
  // Invokes a method on a remote Dapr app.
  invokeService: {
    path: "/dapr.proto.runtime.v1.Dapr/InvokeService",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest,
    responseType: dapr_proto_common_v1_common_pb.InvokeResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_InvokeServiceRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_InvokeServiceRequest,
    responseSerialize: serialize_dapr_proto_common_v1_InvokeResponse,
    responseDeserialize: deserialize_dapr_proto_common_v1_InvokeResponse,
  },
  // Gets the state for a specific key.
  getState: {
    path: "/dapr.proto.runtime.v1.Dapr/GetState",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetStateRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetStateResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetStateRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetStateResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetStateResponse,
  },
  // Gets a bulk of state items for a list of keys
  getBulkState: {
    path: "/dapr.proto.runtime.v1.Dapr/GetBulkState",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetBulkStateRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetBulkStateResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetBulkStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetBulkStateRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetBulkStateResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetBulkStateResponse,
  },
  // Saves the state for a specific key.
  saveState: {
    path: "/dapr.proto.runtime.v1.Dapr/SaveState",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_SaveStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_SaveStateRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Queries the state.
  queryStateAlpha1: {
    path: "/dapr.proto.runtime.v1.Dapr/QueryStateAlpha1",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.QueryStateRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.QueryStateResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_QueryStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_QueryStateRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_QueryStateResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_QueryStateResponse,
  },
  // Deletes the state for a specific key.
  deleteState: {
    path: "/dapr.proto.runtime.v1.Dapr/DeleteState",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_DeleteStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_DeleteStateRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Deletes a bulk of state items for a list of keys
  deleteBulkState: {
    path: "/dapr.proto.runtime.v1.Dapr/DeleteBulkState",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.DeleteBulkStateRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_DeleteBulkStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_DeleteBulkStateRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Executes transactions for a specified store
  executeStateTransaction: {
    path: "/dapr.proto.runtime.v1.Dapr/ExecuteStateTransaction",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.ExecuteStateTransactionRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_ExecuteStateTransactionRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_ExecuteStateTransactionRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Publishes events to the specific topic.
  publishEvent: {
    path: "/dapr.proto.runtime.v1.Dapr/PublishEvent",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.PublishEventRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_PublishEventRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_PublishEventRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Invokes binding data to specific output bindings
  invokeBinding: {
    path: "/dapr.proto.runtime.v1.Dapr/InvokeBinding",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.InvokeBindingResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_InvokeBindingRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_InvokeBindingRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_InvokeBindingResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_InvokeBindingResponse,
  },
  // Gets secrets from secret stores.
  getSecret: {
    path: "/dapr.proto.runtime.v1.Dapr/GetSecret",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetSecretRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetSecretRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetSecretResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetSecretResponse,
  },
  // Gets a bulk of secrets
  getBulkSecret: {
    path: "/dapr.proto.runtime.v1.Dapr/GetBulkSecret",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetBulkSecretRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetBulkSecretResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetBulkSecretRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetBulkSecretRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetBulkSecretResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetBulkSecretResponse,
  },
  // Register an actor timer.
  registerActorTimer: {
    path: "/dapr.proto.runtime.v1.Dapr/RegisterActorTimer",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.RegisterActorTimerRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_RegisterActorTimerRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_RegisterActorTimerRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Unregister an actor timer.
  unregisterActorTimer: {
    path: "/dapr.proto.runtime.v1.Dapr/UnregisterActorTimer",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.UnregisterActorTimerRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_UnregisterActorTimerRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_UnregisterActorTimerRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Register an actor reminder.
  registerActorReminder: {
    path: "/dapr.proto.runtime.v1.Dapr/RegisterActorReminder",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.RegisterActorReminderRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_RegisterActorReminderRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_RegisterActorReminderRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Unregister an actor reminder.
  unregisterActorReminder: {
    path: "/dapr.proto.runtime.v1.Dapr/UnregisterActorReminder",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.UnregisterActorReminderRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_UnregisterActorReminderRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_UnregisterActorReminderRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Rename an actor reminder.
  renameActorReminder: {
    path: "/dapr.proto.runtime.v1.Dapr/RenameActorReminder",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.RenameActorReminderRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_RenameActorReminderRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_RenameActorReminderRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Gets the state for a specific actor.
  getActorState: {
    path: "/dapr.proto.runtime.v1.Dapr/GetActorState",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetActorStateRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetActorStateResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetActorStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetActorStateRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetActorStateResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetActorStateResponse,
  },
  // Executes state transactions for a specified actor
  executeActorStateTransaction: {
    path: "/dapr.proto.runtime.v1.Dapr/ExecuteActorStateTransaction",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.ExecuteActorStateTransactionRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_ExecuteActorStateTransactionRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_ExecuteActorStateTransactionRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // InvokeActor calls a method on an actor.
  invokeActor: {
    path: "/dapr.proto.runtime.v1.Dapr/InvokeActor",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.InvokeActorRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.InvokeActorResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_InvokeActorRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_InvokeActorRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_InvokeActorResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_InvokeActorResponse,
  },
  // GetConfiguration gets configuration from configuration store.
  getConfigurationAlpha1: {
    path: "/dapr.proto.runtime.v1.Dapr/GetConfigurationAlpha1",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetConfigurationRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetConfigurationResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetConfigurationRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetConfigurationRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetConfigurationResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetConfigurationResponse,
  },
  // SubscribeConfiguration gets configuration from configuration store and subscribe the updates event by grpc stream
  subscribeConfigurationAlpha1: {
    path: "/dapr.proto.runtime.v1.Dapr/SubscribeConfigurationAlpha1",
    requestStream: false,
    responseStream: true,
    requestType: dapr_proto_runtime_v1_dapr_pb.SubscribeConfigurationRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.SubscribeConfigurationResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_SubscribeConfigurationRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_SubscribeConfigurationRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_SubscribeConfigurationResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_SubscribeConfigurationResponse,
  },
  // UnSubscribeConfiguration unsubscribe the subscription of configuration
  unsubscribeConfigurationAlpha1: {
    path: "/dapr.proto.runtime.v1.Dapr/UnsubscribeConfigurationAlpha1",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.UnsubscribeConfigurationRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.UnsubscribeConfigurationResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_UnsubscribeConfigurationRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_UnsubscribeConfigurationRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_UnsubscribeConfigurationResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_UnsubscribeConfigurationResponse,
  },
  // TryLockAlpha1 tries to get a lock with an expiry.
  tryLockAlpha1: {
    path: "/dapr.proto.runtime.v1.Dapr/TryLockAlpha1",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.TryLockRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.TryLockResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_TryLockRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_TryLockRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_TryLockResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_TryLockResponse,
  },
  // UnlockAlpha1 unlocks a lock.
  unlockAlpha1: {
    path: "/dapr.proto.runtime.v1.Dapr/UnlockAlpha1",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.UnlockRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.UnlockResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_UnlockRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_UnlockRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_UnlockResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_UnlockResponse,
  },
  // Gets metadata of the sidecar
  getMetadata: {
    path: "/dapr.proto.runtime.v1.Dapr/GetMetadata",
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetMetadataResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetMetadataResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetMetadataResponse,
  },
  // Sets value in extended metadata of the sidecar
  setMetadata: {
    path: "/dapr.proto.runtime.v1.Dapr/SetMetadata",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.SetMetadataRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_SetMetadataRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_SetMetadataRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Shutdown the sidecar
  shutdown: {
    path: "/dapr.proto.runtime.v1.Dapr/Shutdown",
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
});

exports.DaprClient = grpc.makeGenericClientConstructor(DaprService);

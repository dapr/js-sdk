// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// ------------------------------------------------------------
//
'use strict';
var grpc = require('grpc');
var dapr_proto_runtime_v1_dapr_pb = require('../../../../dapr/proto/runtime/v1/dapr_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var dapr_proto_common_v1_common_pb = require('../../../../dapr/proto/common/v1/common_pb.js');

function serialize_dapr_proto_common_v1_InvokeResponse(arg) {
  if (!(arg instanceof dapr_proto_common_v1_common_pb.InvokeResponse)) {
    throw new Error('Expected argument of type dapr.proto.common.v1.InvokeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_common_v1_InvokeResponse(buffer_arg) {
  return dapr_proto_common_v1_common_pb.InvokeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_DeleteStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.DeleteStateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_DeleteStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetSecretRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetSecretRequest)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.GetSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetSecretRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetSecretResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetSecretResponse)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.GetSecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetSecretResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetStateRequest)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.GetStateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_GetStateResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.GetStateResponse)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.GetStateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_GetStateResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.GetStateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeBindingRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.InvokeBindingRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeBindingRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeBindingRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeBindingResponse(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeBindingResponse)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.InvokeBindingResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeBindingResponse(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeBindingResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_InvokeServiceRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.InvokeServiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_InvokeServiceRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.InvokeServiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_PublishEventRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.PublishEventRequest)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.PublishEventRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_PublishEventRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.PublishEventRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_runtime_v1_SaveStateRequest(arg) {
  if (!(arg instanceof dapr_proto_runtime_v1_dapr_pb.SaveStateRequest)) {
    throw new Error('Expected argument of type dapr.proto.runtime.v1.SaveStateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_runtime_v1_SaveStateRequest(buffer_arg) {
  return dapr_proto_runtime_v1_dapr_pb.SaveStateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


// Dapr service provides APIs to user application to access Dapr building blocks.
var DaprService = exports.DaprService = {
  // Invokes a method on a remote Dapr app.
invokeService: {
    path: '/dapr.proto.runtime.v1.Dapr/InvokeService',
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
    path: '/dapr.proto.runtime.v1.Dapr/GetState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetStateRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetStateResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetStateRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetStateResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetStateResponse,
  },
  // Saves the state for a specific key.
saveState: {
    path: '/dapr.proto.runtime.v1.Dapr/SaveState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.SaveStateRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_SaveStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_SaveStateRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Deletes the state for a specific key.
deleteState: {
    path: '/dapr.proto.runtime.v1.Dapr/DeleteState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.DeleteStateRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_runtime_v1_DeleteStateRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_DeleteStateRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // Publishes events to the specific topic.
publishEvent: {
    path: '/dapr.proto.runtime.v1.Dapr/PublishEvent',
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
    path: '/dapr.proto.runtime.v1.Dapr/InvokeBinding',
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
    path: '/dapr.proto.runtime.v1.Dapr/GetSecret',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_runtime_v1_dapr_pb.GetSecretRequest,
    responseType: dapr_proto_runtime_v1_dapr_pb.GetSecretResponse,
    requestSerialize: serialize_dapr_proto_runtime_v1_GetSecretRequest,
    requestDeserialize: deserialize_dapr_proto_runtime_v1_GetSecretRequest,
    responseSerialize: serialize_dapr_proto_runtime_v1_GetSecretResponse,
    responseDeserialize: deserialize_dapr_proto_runtime_v1_GetSecretResponse,
  },
};

exports.DaprClient = grpc.makeGenericClientConstructor(DaprService);

// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// ------------------------------------------------------------
//
'use strict';
var grpc = require('grpc');
var dapr_proto_dapr_v1_dapr_pb = require('../../../../dapr/proto/dapr/v1/dapr_pb.js');
var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_duration_pb = require('google-protobuf/google/protobuf/duration_pb.js');
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

function serialize_dapr_proto_dapr_v1_DeleteStateEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.DeleteStateEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_DeleteStateEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_GetSecretEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.GetSecretEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_GetSecretEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_GetSecretResponseEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.GetSecretResponseEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_GetSecretResponseEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_GetStateEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.GetStateEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_GetStateEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_GetStateResponseEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.GetStateResponseEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_GetStateResponseEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_InvokeBindingEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.InvokeBindingEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_InvokeBindingEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_InvokeServiceRequest(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.InvokeServiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_InvokeServiceRequest(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_PublishEventEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.PublishEventEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_PublishEventEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_dapr_v1_SaveStateEnvelope(arg) {
  if (!(arg instanceof dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.dapr.v1.SaveStateEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_dapr_v1_SaveStateEnvelope(buffer_arg) {
  return dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
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
  publishEvent: {
    path: '/dapr.proto.dapr.v1.Dapr/PublishEvent',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_dapr_v1_dapr_pb.PublishEventEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_dapr_v1_PublishEventEnvelope,
    requestDeserialize: deserialize_dapr_proto_dapr_v1_PublishEventEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  invokeService: {
    path: '/dapr.proto.dapr.v1.Dapr/InvokeService',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_dapr_v1_dapr_pb.InvokeServiceRequest,
    responseType: dapr_proto_common_v1_common_pb.InvokeResponse,
    requestSerialize: serialize_dapr_proto_dapr_v1_InvokeServiceRequest,
    requestDeserialize: deserialize_dapr_proto_dapr_v1_InvokeServiceRequest,
    responseSerialize: serialize_dapr_proto_common_v1_InvokeResponse,
    responseDeserialize: deserialize_dapr_proto_common_v1_InvokeResponse,
  },
  invokeBinding: {
    path: '/dapr.proto.dapr.v1.Dapr/InvokeBinding',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_dapr_v1_dapr_pb.InvokeBindingEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_dapr_v1_InvokeBindingEnvelope,
    requestDeserialize: deserialize_dapr_proto_dapr_v1_InvokeBindingEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  getState: {
    path: '/dapr.proto.dapr.v1.Dapr/GetState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_dapr_v1_dapr_pb.GetStateEnvelope,
    responseType: dapr_proto_dapr_v1_dapr_pb.GetStateResponseEnvelope,
    requestSerialize: serialize_dapr_proto_dapr_v1_GetStateEnvelope,
    requestDeserialize: deserialize_dapr_proto_dapr_v1_GetStateEnvelope,
    responseSerialize: serialize_dapr_proto_dapr_v1_GetStateResponseEnvelope,
    responseDeserialize: deserialize_dapr_proto_dapr_v1_GetStateResponseEnvelope,
  },
  getSecret: {
    path: '/dapr.proto.dapr.v1.Dapr/GetSecret',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_dapr_v1_dapr_pb.GetSecretEnvelope,
    responseType: dapr_proto_dapr_v1_dapr_pb.GetSecretResponseEnvelope,
    requestSerialize: serialize_dapr_proto_dapr_v1_GetSecretEnvelope,
    requestDeserialize: deserialize_dapr_proto_dapr_v1_GetSecretEnvelope,
    responseSerialize: serialize_dapr_proto_dapr_v1_GetSecretResponseEnvelope,
    responseDeserialize: deserialize_dapr_proto_dapr_v1_GetSecretResponseEnvelope,
  },
  saveState: {
    path: '/dapr.proto.dapr.v1.Dapr/SaveState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_dapr_v1_dapr_pb.SaveStateEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_dapr_v1_SaveStateEnvelope,
    requestDeserialize: deserialize_dapr_proto_dapr_v1_SaveStateEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  deleteState: {
    path: '/dapr.proto.dapr.v1.Dapr/DeleteState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_dapr_v1_dapr_pb.DeleteStateEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_dapr_v1_DeleteStateEnvelope,
    requestDeserialize: deserialize_dapr_proto_dapr_v1_DeleteStateEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.DaprClient = grpc.makeGenericClientConstructor(DaprService);

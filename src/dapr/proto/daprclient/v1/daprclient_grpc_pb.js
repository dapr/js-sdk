// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// ------------------------------------------------------------
//
'use strict';
var grpc = require('grpc');
var dapr_proto_daprclient_v1_daprclient_pb = require('../../../../dapr/proto/daprclient/v1/daprclient_pb.js');
var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_duration_pb = require('google-protobuf/google/protobuf/duration_pb.js');
var dapr_proto_common_v1_common_pb = require('../../../../dapr/proto/common/v1/common_pb.js');

function serialize_dapr_proto_common_v1_InvokeRequest(arg) {
  if (!(arg instanceof dapr_proto_common_v1_common_pb.InvokeRequest)) {
    throw new Error('Expected argument of type dapr.proto.common.v1.InvokeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_common_v1_InvokeRequest(buffer_arg) {
  return dapr_proto_common_v1_common_pb.InvokeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_common_v1_InvokeResponse(arg) {
  if (!(arg instanceof dapr_proto_common_v1_common_pb.InvokeResponse)) {
    throw new Error('Expected argument of type dapr.proto.common.v1.InvokeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_common_v1_InvokeResponse(buffer_arg) {
  return dapr_proto_common_v1_common_pb.InvokeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_daprclient_v1_BindingEventEnvelope(arg) {
  if (!(arg instanceof dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.daprclient.v1.BindingEventEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_daprclient_v1_BindingEventEnvelope(buffer_arg) {
  return dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_daprclient_v1_BindingResponseEnvelope(arg) {
  if (!(arg instanceof dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.daprclient.v1.BindingResponseEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_daprclient_v1_BindingResponseEnvelope(buffer_arg) {
  return dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_daprclient_v1_CloudEventEnvelope(arg) {
  if (!(arg instanceof dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.daprclient.v1.CloudEventEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_daprclient_v1_CloudEventEnvelope(buffer_arg) {
  return dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_daprclient_v1_GetBindingsSubscriptionsEnvelope(arg) {
  if (!(arg instanceof dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_daprclient_v1_GetBindingsSubscriptionsEnvelope(buffer_arg) {
  return dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_daprclient_v1_GetTopicSubscriptionsEnvelope(arg) {
  if (!(arg instanceof dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope)) {
    throw new Error('Expected argument of type dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_daprclient_v1_GetTopicSubscriptionsEnvelope(buffer_arg) {
  return dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
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


// DaprClient service allows user application to interact with Dapr runtime.
// User application needs to implement DaprClient service if it needs to
// receive message from dapr runtime.
var DaprClientService = exports.DaprClientService = {
  onInvoke: {
    path: '/dapr.proto.daprclient.v1.DaprClient/OnInvoke',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_common_v1_common_pb.InvokeRequest,
    responseType: dapr_proto_common_v1_common_pb.InvokeResponse,
    requestSerialize: serialize_dapr_proto_common_v1_InvokeRequest,
    requestDeserialize: deserialize_dapr_proto_common_v1_InvokeRequest,
    responseSerialize: serialize_dapr_proto_common_v1_InvokeResponse,
    responseDeserialize: deserialize_dapr_proto_common_v1_InvokeResponse,
  },
  getTopicSubscriptions: {
    path: '/dapr.proto.daprclient.v1.DaprClient/GetTopicSubscriptions',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: dapr_proto_daprclient_v1_daprclient_pb.GetTopicSubscriptionsEnvelope,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_dapr_proto_daprclient_v1_GetTopicSubscriptionsEnvelope,
    responseDeserialize: deserialize_dapr_proto_daprclient_v1_GetTopicSubscriptionsEnvelope,
  },
  getBindingsSubscriptions: {
    path: '/dapr.proto.daprclient.v1.DaprClient/GetBindingsSubscriptions',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: dapr_proto_daprclient_v1_daprclient_pb.GetBindingsSubscriptionsEnvelope,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_dapr_proto_daprclient_v1_GetBindingsSubscriptionsEnvelope,
    responseDeserialize: deserialize_dapr_proto_daprclient_v1_GetBindingsSubscriptionsEnvelope,
  },
  onBindingEvent: {
    path: '/dapr.proto.daprclient.v1.DaprClient/OnBindingEvent',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_daprclient_v1_daprclient_pb.BindingEventEnvelope,
    responseType: dapr_proto_daprclient_v1_daprclient_pb.BindingResponseEnvelope,
    requestSerialize: serialize_dapr_proto_daprclient_v1_BindingEventEnvelope,
    requestDeserialize: deserialize_dapr_proto_daprclient_v1_BindingEventEnvelope,
    responseSerialize: serialize_dapr_proto_daprclient_v1_BindingResponseEnvelope,
    responseDeserialize: deserialize_dapr_proto_daprclient_v1_BindingResponseEnvelope,
  },
  onTopicEvent: {
    path: '/dapr.proto.daprclient.v1.DaprClient/OnTopicEvent',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_daprclient_v1_daprclient_pb.CloudEventEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_proto_daprclient_v1_CloudEventEnvelope,
    requestDeserialize: deserialize_dapr_proto_daprclient_v1_CloudEventEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.DaprClientClient = grpc.makeGenericClientConstructor(DaprClientService);

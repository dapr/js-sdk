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
'use strict';
var grpc = require('@grpc/grpc-js');
var dapr_proto_operator_v1_operator_pb = require('../../../../dapr/proto/operator/v1/operator_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

function serialize_dapr_proto_operator_v1_ComponentUpdateEvent(arg) {
  if (!(arg instanceof dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent)) {
    throw new Error('Expected argument of type dapr.proto.operator.v1.ComponentUpdateEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_operator_v1_ComponentUpdateEvent(buffer_arg) {
  return dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_operator_v1_ComponentUpdateRequest(arg) {
  if (!(arg instanceof dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest)) {
    throw new Error('Expected argument of type dapr.proto.operator.v1.ComponentUpdateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_operator_v1_ComponentUpdateRequest(buffer_arg) {
  return dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_operator_v1_GetConfigurationRequest(arg) {
  if (!(arg instanceof dapr_proto_operator_v1_operator_pb.GetConfigurationRequest)) {
    throw new Error('Expected argument of type dapr.proto.operator.v1.GetConfigurationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_operator_v1_GetConfigurationRequest(buffer_arg) {
  return dapr_proto_operator_v1_operator_pb.GetConfigurationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_operator_v1_GetConfigurationResponse(arg) {
  if (!(arg instanceof dapr_proto_operator_v1_operator_pb.GetConfigurationResponse)) {
    throw new Error('Expected argument of type dapr.proto.operator.v1.GetConfigurationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_operator_v1_GetConfigurationResponse(buffer_arg) {
  return dapr_proto_operator_v1_operator_pb.GetConfigurationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_operator_v1_ListComponentResponse(arg) {
  if (!(arg instanceof dapr_proto_operator_v1_operator_pb.ListComponentResponse)) {
    throw new Error('Expected argument of type dapr.proto.operator.v1.ListComponentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_operator_v1_ListComponentResponse(buffer_arg) {
  return dapr_proto_operator_v1_operator_pb.ListComponentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_operator_v1_ListComponentsRequest(arg) {
  if (!(arg instanceof dapr_proto_operator_v1_operator_pb.ListComponentsRequest)) {
    throw new Error('Expected argument of type dapr.proto.operator.v1.ListComponentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_operator_v1_ListComponentsRequest(buffer_arg) {
  return dapr_proto_operator_v1_operator_pb.ListComponentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_proto_operator_v1_ListSubscriptionsResponse(arg) {
  if (!(arg instanceof dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse)) {
    throw new Error('Expected argument of type dapr.proto.operator.v1.ListSubscriptionsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_operator_v1_ListSubscriptionsResponse(buffer_arg) {
  return dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse.deserializeBinary(new Uint8Array(buffer_arg));
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


var OperatorService = exports.OperatorService = {
  // Sends events to Dapr sidecars upon component changes.
componentUpdate: {
    path: '/dapr.proto.operator.v1.Operator/ComponentUpdate',
    requestStream: false,
    responseStream: true,
    requestType: dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest,
    responseType: dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent,
    requestSerialize: serialize_dapr_proto_operator_v1_ComponentUpdateRequest,
    requestDeserialize: deserialize_dapr_proto_operator_v1_ComponentUpdateRequest,
    responseSerialize: serialize_dapr_proto_operator_v1_ComponentUpdateEvent,
    responseDeserialize: deserialize_dapr_proto_operator_v1_ComponentUpdateEvent,
  },
  // Returns a list of available components
listComponents: {
    path: '/dapr.proto.operator.v1.Operator/ListComponents',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_operator_v1_operator_pb.ListComponentsRequest,
    responseType: dapr_proto_operator_v1_operator_pb.ListComponentResponse,
    requestSerialize: serialize_dapr_proto_operator_v1_ListComponentsRequest,
    requestDeserialize: deserialize_dapr_proto_operator_v1_ListComponentsRequest,
    responseSerialize: serialize_dapr_proto_operator_v1_ListComponentResponse,
    responseDeserialize: deserialize_dapr_proto_operator_v1_ListComponentResponse,
  },
  // Returns a given configuration by name
getConfiguration: {
    path: '/dapr.proto.operator.v1.Operator/GetConfiguration',
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_operator_v1_operator_pb.GetConfigurationRequest,
    responseType: dapr_proto_operator_v1_operator_pb.GetConfigurationResponse,
    requestSerialize: serialize_dapr_proto_operator_v1_GetConfigurationRequest,
    requestDeserialize: deserialize_dapr_proto_operator_v1_GetConfigurationRequest,
    responseSerialize: serialize_dapr_proto_operator_v1_GetConfigurationResponse,
    responseDeserialize: deserialize_dapr_proto_operator_v1_GetConfigurationResponse,
  },
  // Returns a list of pub/sub subscriptions
listSubscriptions: {
    path: '/dapr.proto.operator.v1.Operator/ListSubscriptions',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_dapr_proto_operator_v1_ListSubscriptionsResponse,
    responseDeserialize: deserialize_dapr_proto_operator_v1_ListSubscriptionsResponse,
  },
};

exports.OperatorClient = grpc.makeGenericClientConstructor(OperatorService);

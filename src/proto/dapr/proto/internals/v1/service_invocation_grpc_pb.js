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
var dapr_proto_internals_v1_service_invocation_pb = require("../../../../dapr/proto/internals/v1/service_invocation_pb.js");
var dapr_proto_common_v1_common_pb = require("../../../../dapr/proto/common/v1/common_pb.js");
var dapr_proto_internals_v1_apiversion_pb = require("../../../../dapr/proto/internals/v1/apiversion_pb.js");
var dapr_proto_internals_v1_status_pb = require("../../../../dapr/proto/internals/v1/status_pb.js");

function serialize_dapr_proto_internals_v1_InternalInvokeRequest(arg) {
  if (!(arg instanceof dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest)) {
    throw new Error("Expected argument of type dapr.proto.internals.v1.InternalInvokeRequest");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_internals_v1_InternalInvokeRequest(buffer_arg) {
  return dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest.deserializeBinary(
    new Uint8Array(buffer_arg),
  );
}

function serialize_dapr_proto_internals_v1_InternalInvokeResponse(arg) {
  if (!(arg instanceof dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse)) {
    throw new Error("Expected argument of type dapr.proto.internals.v1.InternalInvokeResponse");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_proto_internals_v1_InternalInvokeResponse(buffer_arg) {
  return dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse.deserializeBinary(
    new Uint8Array(buffer_arg),
  );
}

// ServiceInvocation service is used to exchange the data between
// caller dapr runtime and callee dapr runtime.
//
// The request message includes caller's HTTP/gRPC request
// and deliver callee's response including status code.
// The response status of rpc methods represents of internal gRPC
// connection status, not callee's response status.
//
// Thus, ServiceInvocation gRPC response returns OK in most cases
// regardless of callee's response.
var ServiceInvocationService = (exports.ServiceInvocationService = {
  // Invokes a method of the specific actor.
  callActor: {
    path: "/dapr.proto.internals.v1.ServiceInvocation/CallActor",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest,
    responseType: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse,
    requestSerialize: serialize_dapr_proto_internals_v1_InternalInvokeRequest,
    requestDeserialize: deserialize_dapr_proto_internals_v1_InternalInvokeRequest,
    responseSerialize: serialize_dapr_proto_internals_v1_InternalInvokeResponse,
    responseDeserialize: deserialize_dapr_proto_internals_v1_InternalInvokeResponse,
  },
  // Invokes a method of the specific service.
  callLocal: {
    path: "/dapr.proto.internals.v1.ServiceInvocation/CallLocal",
    requestStream: false,
    responseStream: false,
    requestType: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeRequest,
    responseType: dapr_proto_internals_v1_service_invocation_pb.InternalInvokeResponse,
    requestSerialize: serialize_dapr_proto_internals_v1_InternalInvokeRequest,
    requestDeserialize: deserialize_dapr_proto_internals_v1_InternalInvokeRequest,
    responseSerialize: serialize_dapr_proto_internals_v1_InternalInvokeResponse,
    responseDeserialize: deserialize_dapr_proto_internals_v1_InternalInvokeResponse,
  },
});

exports.ServiceInvocationClient = grpc.makeGenericClientConstructor(ServiceInvocationService);

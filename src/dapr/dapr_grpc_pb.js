// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var dapr_dapr_pb = require('../dapr/dapr_pb.js');
var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_duration_pb = require('google-protobuf/google/protobuf/duration_pb.js');

function serialize_dapr_DeleteStateEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.DeleteStateEnvelope)) {
    throw new Error('Expected argument of type dapr.DeleteStateEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_DeleteStateEnvelope(buffer_arg) {
  return dapr_dapr_pb.DeleteStateEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_GetStateEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.GetStateEnvelope)) {
    throw new Error('Expected argument of type dapr.GetStateEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_GetStateEnvelope(buffer_arg) {
  return dapr_dapr_pb.GetStateEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_GetStateResponseEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.GetStateResponseEnvelope)) {
    throw new Error('Expected argument of type dapr.GetStateResponseEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_GetStateResponseEnvelope(buffer_arg) {
  return dapr_dapr_pb.GetStateResponseEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_InvokeBindingEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.InvokeBindingEnvelope)) {
    throw new Error('Expected argument of type dapr.InvokeBindingEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_InvokeBindingEnvelope(buffer_arg) {
  return dapr_dapr_pb.InvokeBindingEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_InvokeServiceEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.InvokeServiceEnvelope)) {
    throw new Error('Expected argument of type dapr.InvokeServiceEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_InvokeServiceEnvelope(buffer_arg) {
  return dapr_dapr_pb.InvokeServiceEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_InvokeServiceResponseEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.InvokeServiceResponseEnvelope)) {
    throw new Error('Expected argument of type dapr.InvokeServiceResponseEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_InvokeServiceResponseEnvelope(buffer_arg) {
  return dapr_dapr_pb.InvokeServiceResponseEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_PublishEventEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.PublishEventEnvelope)) {
    throw new Error('Expected argument of type dapr.PublishEventEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_PublishEventEnvelope(buffer_arg) {
  return dapr_dapr_pb.PublishEventEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_dapr_SaveStateEnvelope(arg) {
  if (!(arg instanceof dapr_dapr_pb.SaveStateEnvelope)) {
    throw new Error('Expected argument of type dapr.SaveStateEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_dapr_SaveStateEnvelope(buffer_arg) {
  return dapr_dapr_pb.SaveStateEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
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


// Dapr definitions
var DaprService = exports.DaprService = {
  publishEvent: {
    path: '/dapr.Dapr/PublishEvent',
    requestStream: false,
    responseStream: false,
    requestType: dapr_dapr_pb.PublishEventEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_PublishEventEnvelope,
    requestDeserialize: deserialize_dapr_PublishEventEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  invokeService: {
    path: '/dapr.Dapr/InvokeService',
    requestStream: false,
    responseStream: false,
    requestType: dapr_dapr_pb.InvokeServiceEnvelope,
    responseType: dapr_dapr_pb.InvokeServiceResponseEnvelope,
    requestSerialize: serialize_dapr_InvokeServiceEnvelope,
    requestDeserialize: deserialize_dapr_InvokeServiceEnvelope,
    responseSerialize: serialize_dapr_InvokeServiceResponseEnvelope,
    responseDeserialize: deserialize_dapr_InvokeServiceResponseEnvelope,
  },
  invokeBinding: {
    path: '/dapr.Dapr/InvokeBinding',
    requestStream: false,
    responseStream: false,
    requestType: dapr_dapr_pb.InvokeBindingEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_InvokeBindingEnvelope,
    requestDeserialize: deserialize_dapr_InvokeBindingEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  getState: {
    path: '/dapr.Dapr/GetState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_dapr_pb.GetStateEnvelope,
    responseType: dapr_dapr_pb.GetStateResponseEnvelope,
    requestSerialize: serialize_dapr_GetStateEnvelope,
    requestDeserialize: deserialize_dapr_GetStateEnvelope,
    responseSerialize: serialize_dapr_GetStateResponseEnvelope,
    responseDeserialize: deserialize_dapr_GetStateResponseEnvelope,
  },
  saveState: {
    path: '/dapr.Dapr/SaveState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_dapr_pb.SaveStateEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_SaveStateEnvelope,
    requestDeserialize: deserialize_dapr_SaveStateEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  deleteState: {
    path: '/dapr.Dapr/DeleteState',
    requestStream: false,
    responseStream: false,
    requestType: dapr_dapr_pb.DeleteStateEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_dapr_DeleteStateEnvelope,
    requestDeserialize: deserialize_dapr_DeleteStateEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.DaprClient = grpc.makeGenericClientConstructor(DaprService);

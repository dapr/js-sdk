// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var daprclient_daprclient_pb = require('../daprclient/daprclient_pb.js');
var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_duration_pb = require('google-protobuf/google/protobuf/duration_pb.js');

function serialize_daprclient_BindingEventEnvelope(arg) {
  if (!(arg instanceof daprclient_daprclient_pb.BindingEventEnvelope)) {
    throw new Error('Expected argument of type daprclient.BindingEventEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_daprclient_BindingEventEnvelope(buffer_arg) {
  return daprclient_daprclient_pb.BindingEventEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_daprclient_BindingResponseEnvelope(arg) {
  if (!(arg instanceof daprclient_daprclient_pb.BindingResponseEnvelope)) {
    throw new Error('Expected argument of type daprclient.BindingResponseEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_daprclient_BindingResponseEnvelope(buffer_arg) {
  return daprclient_daprclient_pb.BindingResponseEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_daprclient_CloudEventEnvelope(arg) {
  if (!(arg instanceof daprclient_daprclient_pb.CloudEventEnvelope)) {
    throw new Error('Expected argument of type daprclient.CloudEventEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_daprclient_CloudEventEnvelope(buffer_arg) {
  return daprclient_daprclient_pb.CloudEventEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_daprclient_GetBindingsSubscriptionsEnvelope(arg) {
  if (!(arg instanceof daprclient_daprclient_pb.GetBindingsSubscriptionsEnvelope)) {
    throw new Error('Expected argument of type daprclient.GetBindingsSubscriptionsEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_daprclient_GetBindingsSubscriptionsEnvelope(buffer_arg) {
  return daprclient_daprclient_pb.GetBindingsSubscriptionsEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_daprclient_GetTopicSubscriptionsEnvelope(arg) {
  if (!(arg instanceof daprclient_daprclient_pb.GetTopicSubscriptionsEnvelope)) {
    throw new Error('Expected argument of type daprclient.GetTopicSubscriptionsEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_daprclient_GetTopicSubscriptionsEnvelope(buffer_arg) {
  return daprclient_daprclient_pb.GetTopicSubscriptionsEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_daprclient_InvokeEnvelope(arg) {
  if (!(arg instanceof daprclient_daprclient_pb.InvokeEnvelope)) {
    throw new Error('Expected argument of type daprclient.InvokeEnvelope');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_daprclient_InvokeEnvelope(buffer_arg) {
  return daprclient_daprclient_pb.InvokeEnvelope.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Any(arg) {
  if (!(arg instanceof google_protobuf_any_pb.Any)) {
    throw new Error('Expected argument of type google.protobuf.Any');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Any(buffer_arg) {
  return google_protobuf_any_pb.Any.deserializeBinary(new Uint8Array(buffer_arg));
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


// User Code definitions
var DaprClientService = exports.DaprClientService = {
  onInvoke: {
    path: '/daprclient.DaprClient/OnInvoke',
    requestStream: false,
    responseStream: false,
    requestType: daprclient_daprclient_pb.InvokeEnvelope,
    responseType: google_protobuf_any_pb.Any,
    requestSerialize: serialize_daprclient_InvokeEnvelope,
    requestDeserialize: deserialize_daprclient_InvokeEnvelope,
    responseSerialize: serialize_google_protobuf_Any,
    responseDeserialize: deserialize_google_protobuf_Any,
  },
  getTopicSubscriptions: {
    path: '/daprclient.DaprClient/GetTopicSubscriptions',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: daprclient_daprclient_pb.GetTopicSubscriptionsEnvelope,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_daprclient_GetTopicSubscriptionsEnvelope,
    responseDeserialize: deserialize_daprclient_GetTopicSubscriptionsEnvelope,
  },
  getBindingsSubscriptions: {
    path: '/daprclient.DaprClient/GetBindingsSubscriptions',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: daprclient_daprclient_pb.GetBindingsSubscriptionsEnvelope,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_daprclient_GetBindingsSubscriptionsEnvelope,
    responseDeserialize: deserialize_daprclient_GetBindingsSubscriptionsEnvelope,
  },
  onBindingEvent: {
    path: '/daprclient.DaprClient/OnBindingEvent',
    requestStream: false,
    responseStream: false,
    requestType: daprclient_daprclient_pb.BindingEventEnvelope,
    responseType: daprclient_daprclient_pb.BindingResponseEnvelope,
    requestSerialize: serialize_daprclient_BindingEventEnvelope,
    requestDeserialize: deserialize_daprclient_BindingEventEnvelope,
    responseSerialize: serialize_daprclient_BindingResponseEnvelope,
    responseDeserialize: deserialize_daprclient_BindingResponseEnvelope,
  },
  onTopicEvent: {
    path: '/daprclient.DaprClient/OnTopicEvent',
    requestStream: false,
    responseStream: false,
    requestType: daprclient_daprclient_pb.CloudEventEnvelope,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_daprclient_CloudEventEnvelope,
    requestDeserialize: deserialize_daprclient_CloudEventEnvelope,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
};

exports.DaprClientClient = grpc.makeGenericClientConstructor(DaprClientService);

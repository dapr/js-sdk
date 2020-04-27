/**
 * @fileoverview gRPC-Web generated client stub for dapr.proto.daprclient.v1
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js')

var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js')

var google_protobuf_duration_pb = require('google-protobuf/google/protobuf/duration_pb.js')

var dapr_proto_common_v1_common_pb = require('../../../../dapr/proto/common/v1/common_pb.js')
const proto = {};
proto.dapr = {};
proto.dapr.proto = {};
proto.dapr.proto.daprclient = {};
proto.dapr.proto.daprclient.v1 = require('./daprclient_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.dapr.proto.daprclient.v1.DaprClientClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.dapr.proto.daprclient.v1.DaprClientPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.common.v1.InvokeRequest,
 *   !proto.dapr.proto.common.v1.InvokeResponse>}
 */
const methodDescriptor_DaprClient_OnInvoke = new grpc.web.MethodDescriptor(
  '/dapr.proto.daprclient.v1.DaprClient/OnInvoke',
  grpc.web.MethodType.UNARY,
  dapr_proto_common_v1_common_pb.InvokeRequest,
  dapr_proto_common_v1_common_pb.InvokeResponse,
  /**
   * @param {!proto.dapr.proto.common.v1.InvokeRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  dapr_proto_common_v1_common_pb.InvokeResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.dapr.proto.common.v1.InvokeRequest,
 *   !proto.dapr.proto.common.v1.InvokeResponse>}
 */
const methodInfo_DaprClient_OnInvoke = new grpc.web.AbstractClientBase.MethodInfo(
  dapr_proto_common_v1_common_pb.InvokeResponse,
  /**
   * @param {!proto.dapr.proto.common.v1.InvokeRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  dapr_proto_common_v1_common_pb.InvokeResponse.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.common.v1.InvokeRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.dapr.proto.common.v1.InvokeResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.dapr.proto.common.v1.InvokeResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.daprclient.v1.DaprClientClient.prototype.onInvoke =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/OnInvoke',
      request,
      metadata || {},
      methodDescriptor_DaprClient_OnInvoke,
      callback);
};


/**
 * @param {!proto.dapr.proto.common.v1.InvokeRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.dapr.proto.common.v1.InvokeResponse>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.daprclient.v1.DaprClientPromiseClient.prototype.onInvoke =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/OnInvoke',
      request,
      metadata || {},
      methodDescriptor_DaprClient_OnInvoke);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope>}
 */
const methodDescriptor_DaprClient_GetTopicSubscriptions = new grpc.web.MethodDescriptor(
  '/dapr.proto.daprclient.v1.DaprClient/GetTopicSubscriptions',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope>}
 */
const methodInfo_DaprClient_GetTopicSubscriptions = new grpc.web.AbstractClientBase.MethodInfo(
  proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.daprclient.v1.DaprClientClient.prototype.getTopicSubscriptions =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/GetTopicSubscriptions',
      request,
      metadata || {},
      methodDescriptor_DaprClient_GetTopicSubscriptions,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.dapr.proto.daprclient.v1.GetTopicSubscriptionsEnvelope>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.daprclient.v1.DaprClientPromiseClient.prototype.getTopicSubscriptions =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/GetTopicSubscriptions',
      request,
      metadata || {},
      methodDescriptor_DaprClient_GetTopicSubscriptions);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope>}
 */
const methodDescriptor_DaprClient_GetBindingsSubscriptions = new grpc.web.MethodDescriptor(
  '/dapr.proto.daprclient.v1.DaprClient/GetBindingsSubscriptions',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope>}
 */
const methodInfo_DaprClient_GetBindingsSubscriptions = new grpc.web.AbstractClientBase.MethodInfo(
  proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.daprclient.v1.DaprClientClient.prototype.getBindingsSubscriptions =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/GetBindingsSubscriptions',
      request,
      metadata || {},
      methodDescriptor_DaprClient_GetBindingsSubscriptions,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.dapr.proto.daprclient.v1.GetBindingsSubscriptionsEnvelope>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.daprclient.v1.DaprClientPromiseClient.prototype.getBindingsSubscriptions =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/GetBindingsSubscriptions',
      request,
      metadata || {},
      methodDescriptor_DaprClient_GetBindingsSubscriptions);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.daprclient.v1.BindingEventEnvelope,
 *   !proto.dapr.proto.daprclient.v1.BindingResponseEnvelope>}
 */
const methodDescriptor_DaprClient_OnBindingEvent = new grpc.web.MethodDescriptor(
  '/dapr.proto.daprclient.v1.DaprClient/OnBindingEvent',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.daprclient.v1.BindingEventEnvelope,
  proto.dapr.proto.daprclient.v1.BindingResponseEnvelope,
  /**
   * @param {!proto.dapr.proto.daprclient.v1.BindingEventEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.daprclient.v1.BindingResponseEnvelope.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.dapr.proto.daprclient.v1.BindingEventEnvelope,
 *   !proto.dapr.proto.daprclient.v1.BindingResponseEnvelope>}
 */
const methodInfo_DaprClient_OnBindingEvent = new grpc.web.AbstractClientBase.MethodInfo(
  proto.dapr.proto.daprclient.v1.BindingResponseEnvelope,
  /**
   * @param {!proto.dapr.proto.daprclient.v1.BindingEventEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.daprclient.v1.BindingResponseEnvelope.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.daprclient.v1.BindingEventEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.dapr.proto.daprclient.v1.BindingResponseEnvelope)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.dapr.proto.daprclient.v1.BindingResponseEnvelope>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.daprclient.v1.DaprClientClient.prototype.onBindingEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/OnBindingEvent',
      request,
      metadata || {},
      methodDescriptor_DaprClient_OnBindingEvent,
      callback);
};


/**
 * @param {!proto.dapr.proto.daprclient.v1.BindingEventEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.dapr.proto.daprclient.v1.BindingResponseEnvelope>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.daprclient.v1.DaprClientPromiseClient.prototype.onBindingEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/OnBindingEvent',
      request,
      metadata || {},
      methodDescriptor_DaprClient_OnBindingEvent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.daprclient.v1.CloudEventEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_DaprClient_OnTopicEvent = new grpc.web.MethodDescriptor(
  '/dapr.proto.daprclient.v1.DaprClient/OnTopicEvent',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.daprclient.v1.CloudEventEnvelope,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.daprclient.v1.CloudEventEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.dapr.proto.daprclient.v1.CloudEventEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_DaprClient_OnTopicEvent = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.daprclient.v1.CloudEventEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.daprclient.v1.CloudEventEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.daprclient.v1.DaprClientClient.prototype.onTopicEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/OnTopicEvent',
      request,
      metadata || {},
      methodDescriptor_DaprClient_OnTopicEvent,
      callback);
};


/**
 * @param {!proto.dapr.proto.daprclient.v1.CloudEventEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.daprclient.v1.DaprClientPromiseClient.prototype.onTopicEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.daprclient.v1.DaprClient/OnTopicEvent',
      request,
      metadata || {},
      methodDescriptor_DaprClient_OnTopicEvent);
};


module.exports = proto.dapr.proto.daprclient.v1;


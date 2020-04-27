/**
 * @fileoverview gRPC-Web generated client stub for dapr.proto.dapr.v1
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
proto.dapr.proto.dapr = {};
proto.dapr.proto.dapr.v1 = require('./dapr_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.dapr.proto.dapr.v1.DaprClient =
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
proto.dapr.proto.dapr.v1.DaprPromiseClient =
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
 *   !proto.dapr.proto.dapr.v1.PublishEventEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Dapr_PublishEvent = new grpc.web.MethodDescriptor(
  '/dapr.proto.dapr.v1.Dapr/PublishEvent',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.dapr.v1.PublishEventEnvelope,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.PublishEventEnvelope} request
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
 *   !proto.dapr.proto.dapr.v1.PublishEventEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Dapr_PublishEvent = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.PublishEventEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.dapr.v1.PublishEventEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.dapr.v1.DaprClient.prototype.publishEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/PublishEvent',
      request,
      metadata || {},
      methodDescriptor_Dapr_PublishEvent,
      callback);
};


/**
 * @param {!proto.dapr.proto.dapr.v1.PublishEventEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.dapr.v1.DaprPromiseClient.prototype.publishEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/PublishEvent',
      request,
      metadata || {},
      methodDescriptor_Dapr_PublishEvent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.dapr.v1.InvokeServiceRequest,
 *   !proto.dapr.proto.common.v1.InvokeResponse>}
 */
const methodDescriptor_Dapr_InvokeService = new grpc.web.MethodDescriptor(
  '/dapr.proto.dapr.v1.Dapr/InvokeService',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.dapr.v1.InvokeServiceRequest,
  dapr_proto_common_v1_common_pb.InvokeResponse,
  /**
   * @param {!proto.dapr.proto.dapr.v1.InvokeServiceRequest} request
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
 *   !proto.dapr.proto.dapr.v1.InvokeServiceRequest,
 *   !proto.dapr.proto.common.v1.InvokeResponse>}
 */
const methodInfo_Dapr_InvokeService = new grpc.web.AbstractClientBase.MethodInfo(
  dapr_proto_common_v1_common_pb.InvokeResponse,
  /**
   * @param {!proto.dapr.proto.dapr.v1.InvokeServiceRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  dapr_proto_common_v1_common_pb.InvokeResponse.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.dapr.v1.InvokeServiceRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.dapr.proto.common.v1.InvokeResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.dapr.proto.common.v1.InvokeResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.dapr.v1.DaprClient.prototype.invokeService =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/InvokeService',
      request,
      metadata || {},
      methodDescriptor_Dapr_InvokeService,
      callback);
};


/**
 * @param {!proto.dapr.proto.dapr.v1.InvokeServiceRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.dapr.proto.common.v1.InvokeResponse>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.dapr.v1.DaprPromiseClient.prototype.invokeService =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/InvokeService',
      request,
      metadata || {},
      methodDescriptor_Dapr_InvokeService);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.dapr.v1.InvokeBindingEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Dapr_InvokeBinding = new grpc.web.MethodDescriptor(
  '/dapr.proto.dapr.v1.Dapr/InvokeBinding',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.dapr.v1.InvokeBindingEnvelope,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.InvokeBindingEnvelope} request
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
 *   !proto.dapr.proto.dapr.v1.InvokeBindingEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Dapr_InvokeBinding = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.InvokeBindingEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.dapr.v1.InvokeBindingEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.dapr.v1.DaprClient.prototype.invokeBinding =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/InvokeBinding',
      request,
      metadata || {},
      methodDescriptor_Dapr_InvokeBinding,
      callback);
};


/**
 * @param {!proto.dapr.proto.dapr.v1.InvokeBindingEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.dapr.v1.DaprPromiseClient.prototype.invokeBinding =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/InvokeBinding',
      request,
      metadata || {},
      methodDescriptor_Dapr_InvokeBinding);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.dapr.v1.GetStateEnvelope,
 *   !proto.dapr.proto.dapr.v1.GetStateResponseEnvelope>}
 */
const methodDescriptor_Dapr_GetState = new grpc.web.MethodDescriptor(
  '/dapr.proto.dapr.v1.Dapr/GetState',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.dapr.v1.GetStateEnvelope,
  proto.dapr.proto.dapr.v1.GetStateResponseEnvelope,
  /**
   * @param {!proto.dapr.proto.dapr.v1.GetStateEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.dapr.v1.GetStateResponseEnvelope.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.dapr.proto.dapr.v1.GetStateEnvelope,
 *   !proto.dapr.proto.dapr.v1.GetStateResponseEnvelope>}
 */
const methodInfo_Dapr_GetState = new grpc.web.AbstractClientBase.MethodInfo(
  proto.dapr.proto.dapr.v1.GetStateResponseEnvelope,
  /**
   * @param {!proto.dapr.proto.dapr.v1.GetStateEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.dapr.v1.GetStateResponseEnvelope.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.dapr.v1.GetStateEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.dapr.proto.dapr.v1.GetStateResponseEnvelope)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.dapr.proto.dapr.v1.GetStateResponseEnvelope>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.dapr.v1.DaprClient.prototype.getState =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/GetState',
      request,
      metadata || {},
      methodDescriptor_Dapr_GetState,
      callback);
};


/**
 * @param {!proto.dapr.proto.dapr.v1.GetStateEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.dapr.proto.dapr.v1.GetStateResponseEnvelope>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.dapr.v1.DaprPromiseClient.prototype.getState =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/GetState',
      request,
      metadata || {},
      methodDescriptor_Dapr_GetState);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.dapr.v1.GetSecretEnvelope,
 *   !proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope>}
 */
const methodDescriptor_Dapr_GetSecret = new grpc.web.MethodDescriptor(
  '/dapr.proto.dapr.v1.Dapr/GetSecret',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.dapr.v1.GetSecretEnvelope,
  proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope,
  /**
   * @param {!proto.dapr.proto.dapr.v1.GetSecretEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.dapr.proto.dapr.v1.GetSecretEnvelope,
 *   !proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope>}
 */
const methodInfo_Dapr_GetSecret = new grpc.web.AbstractClientBase.MethodInfo(
  proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope,
  /**
   * @param {!proto.dapr.proto.dapr.v1.GetSecretEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.dapr.v1.GetSecretEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.dapr.v1.DaprClient.prototype.getSecret =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/GetSecret',
      request,
      metadata || {},
      methodDescriptor_Dapr_GetSecret,
      callback);
};


/**
 * @param {!proto.dapr.proto.dapr.v1.GetSecretEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.dapr.proto.dapr.v1.GetSecretResponseEnvelope>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.dapr.v1.DaprPromiseClient.prototype.getSecret =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/GetSecret',
      request,
      metadata || {},
      methodDescriptor_Dapr_GetSecret);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.dapr.v1.SaveStateEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Dapr_SaveState = new grpc.web.MethodDescriptor(
  '/dapr.proto.dapr.v1.Dapr/SaveState',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.dapr.v1.SaveStateEnvelope,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.SaveStateEnvelope} request
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
 *   !proto.dapr.proto.dapr.v1.SaveStateEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Dapr_SaveState = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.SaveStateEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.dapr.v1.SaveStateEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.dapr.v1.DaprClient.prototype.saveState =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/SaveState',
      request,
      metadata || {},
      methodDescriptor_Dapr_SaveState,
      callback);
};


/**
 * @param {!proto.dapr.proto.dapr.v1.SaveStateEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.dapr.v1.DaprPromiseClient.prototype.saveState =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/SaveState',
      request,
      metadata || {},
      methodDescriptor_Dapr_SaveState);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.dapr.proto.dapr.v1.DeleteStateEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Dapr_DeleteState = new grpc.web.MethodDescriptor(
  '/dapr.proto.dapr.v1.Dapr/DeleteState',
  grpc.web.MethodType.UNARY,
  proto.dapr.proto.dapr.v1.DeleteStateEnvelope,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.DeleteStateEnvelope} request
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
 *   !proto.dapr.proto.dapr.v1.DeleteStateEnvelope,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Dapr_DeleteState = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.dapr.proto.dapr.v1.DeleteStateEnvelope} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.dapr.proto.dapr.v1.DeleteStateEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.dapr.proto.dapr.v1.DaprClient.prototype.deleteState =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/DeleteState',
      request,
      metadata || {},
      methodDescriptor_Dapr_DeleteState,
      callback);
};


/**
 * @param {!proto.dapr.proto.dapr.v1.DeleteStateEnvelope} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.dapr.proto.dapr.v1.DaprPromiseClient.prototype.deleteState =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/dapr.proto.dapr.v1.Dapr/DeleteState',
      request,
      metadata || {},
      methodDescriptor_Dapr_DeleteState);
};


module.exports = proto.dapr.proto.dapr.v1;


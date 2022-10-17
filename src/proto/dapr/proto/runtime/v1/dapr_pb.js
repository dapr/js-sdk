// source: dapr/proto/runtime/v1/dapr.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() { return this || window || global || self || Function('return this')(); }).call(null);

var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
goog.object.extend(proto, google_protobuf_any_pb);
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
goog.object.extend(proto, google_protobuf_empty_pb);
var dapr_proto_common_v1_common_pb = require('../../../../dapr/proto/common/v1/common_pb.js');
goog.object.extend(proto, dapr_proto_common_v1_common_pb);
goog.exportSymbol('proto.dapr.proto.runtime.v1.ActiveActorsCount', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.BulkStateItem', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.DeleteBulkStateRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.DeleteStateRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetActorStateRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetActorStateResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetBulkSecretRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetBulkSecretResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetBulkStateRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetBulkStateResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetConfigurationRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetConfigurationResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetMetadataResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetSecretRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetSecretResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetStateRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.GetStateResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.InvokeActorRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.InvokeActorResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.InvokeBindingRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.InvokeBindingResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.InvokeServiceRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.PublishEventRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.QueryStateItem', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.QueryStateRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.QueryStateResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.RegisterActorReminderRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.RegisterActorTimerRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.RegisteredComponents', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.RenameActorReminderRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.SaveStateRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.SecretResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.SetMetadataRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.TransactionalActorStateOperation', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.TransactionalStateOperation', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.TryLockRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.TryLockResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.UnlockRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.UnlockResponse', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.UnlockResponse.Status', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest', null, global);
goog.exportSymbol('proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.InvokeServiceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.InvokeServiceRequest.displayName = 'proto.dapr.proto.runtime.v1.InvokeServiceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetStateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetStateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetStateRequest.displayName = 'proto.dapr.proto.runtime.v1.GetStateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.GetBulkStateRequest.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetBulkStateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetBulkStateRequest.displayName = 'proto.dapr.proto.runtime.v1.GetBulkStateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.GetBulkStateResponse.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetBulkStateResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetBulkStateResponse.displayName = 'proto.dapr.proto.runtime.v1.GetBulkStateResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.BulkStateItem = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.BulkStateItem, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.BulkStateItem.displayName = 'proto.dapr.proto.runtime.v1.BulkStateItem';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetStateResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetStateResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetStateResponse.displayName = 'proto.dapr.proto.runtime.v1.GetStateResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.DeleteStateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.DeleteStateRequest.displayName = 'proto.dapr.proto.runtime.v1.DeleteStateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.DeleteBulkStateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.displayName = 'proto.dapr.proto.runtime.v1.DeleteBulkStateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.SaveStateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.SaveStateRequest.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.SaveStateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.SaveStateRequest.displayName = 'proto.dapr.proto.runtime.v1.SaveStateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.QueryStateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.QueryStateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.QueryStateRequest.displayName = 'proto.dapr.proto.runtime.v1.QueryStateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.QueryStateItem = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.QueryStateItem, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.QueryStateItem.displayName = 'proto.dapr.proto.runtime.v1.QueryStateItem';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.QueryStateResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.QueryStateResponse.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.QueryStateResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.QueryStateResponse.displayName = 'proto.dapr.proto.runtime.v1.QueryStateResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.PublishEventRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.PublishEventRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.PublishEventRequest.displayName = 'proto.dapr.proto.runtime.v1.PublishEventRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.InvokeBindingRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.InvokeBindingRequest.displayName = 'proto.dapr.proto.runtime.v1.InvokeBindingRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.InvokeBindingResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.InvokeBindingResponse.displayName = 'proto.dapr.proto.runtime.v1.InvokeBindingResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetSecretRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetSecretRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetSecretRequest.displayName = 'proto.dapr.proto.runtime.v1.GetSecretRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetSecretResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetSecretResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetSecretResponse.displayName = 'proto.dapr.proto.runtime.v1.GetSecretResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetBulkSecretRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetBulkSecretRequest.displayName = 'proto.dapr.proto.runtime.v1.GetBulkSecretRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.SecretResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.SecretResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.SecretResponse.displayName = 'proto.dapr.proto.runtime.v1.SecretResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetBulkSecretResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetBulkSecretResponse.displayName = 'proto.dapr.proto.runtime.v1.GetBulkSecretResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.TransactionalStateOperation, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.TransactionalStateOperation.displayName = 'proto.dapr.proto.runtime.v1.TransactionalStateOperation';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.displayName = 'proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.RegisterActorTimerRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.displayName = 'proto.dapr.proto.runtime.v1.RegisterActorTimerRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.displayName = 'proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.RegisterActorReminderRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.displayName = 'proto.dapr.proto.runtime.v1.RegisterActorReminderRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.displayName = 'proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.RenameActorReminderRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.RenameActorReminderRequest.displayName = 'proto.dapr.proto.runtime.v1.RenameActorReminderRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetActorStateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetActorStateRequest.displayName = 'proto.dapr.proto.runtime.v1.GetActorStateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetActorStateResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetActorStateResponse.displayName = 'proto.dapr.proto.runtime.v1.GetActorStateResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.displayName = 'proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.TransactionalActorStateOperation, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.displayName = 'proto.dapr.proto.runtime.v1.TransactionalActorStateOperation';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.InvokeActorRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.InvokeActorRequest.displayName = 'proto.dapr.proto.runtime.v1.InvokeActorRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.InvokeActorResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.InvokeActorResponse.displayName = 'proto.dapr.proto.runtime.v1.InvokeActorResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.GetMetadataResponse.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetMetadataResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetMetadataResponse.displayName = 'proto.dapr.proto.runtime.v1.GetMetadataResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.ActiveActorsCount, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.ActiveActorsCount.displayName = 'proto.dapr.proto.runtime.v1.ActiveActorsCount';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.RegisteredComponents = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.RegisteredComponents.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.RegisteredComponents, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.RegisteredComponents.displayName = 'proto.dapr.proto.runtime.v1.RegisteredComponents';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.SetMetadataRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.SetMetadataRequest.displayName = 'proto.dapr.proto.runtime.v1.SetMetadataRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.GetConfigurationRequest.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetConfigurationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetConfigurationRequest.displayName = 'proto.dapr.proto.runtime.v1.GetConfigurationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.GetConfigurationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.GetConfigurationResponse.displayName = 'proto.dapr.proto.runtime.v1.GetConfigurationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.repeatedFields_, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.displayName = 'proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.displayName = 'proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.displayName = 'proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.displayName = 'proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.TryLockRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.TryLockRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.TryLockRequest.displayName = 'proto.dapr.proto.runtime.v1.TryLockRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.TryLockResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.TryLockResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.TryLockResponse.displayName = 'proto.dapr.proto.runtime.v1.TryLockResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.UnlockRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.UnlockRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.UnlockRequest.displayName = 'proto.dapr.proto.runtime.v1.UnlockRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.dapr.proto.runtime.v1.UnlockResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.dapr.proto.runtime.v1.UnlockResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.dapr.proto.runtime.v1.UnlockResponse.displayName = 'proto.dapr.proto.runtime.v1.UnlockResponse';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.InvokeServiceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.InvokeServiceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    message: (f = msg.getMessage()) && dapr_proto_common_v1_common_pb.InvokeRequest.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.InvokeServiceRequest}
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.InvokeServiceRequest;
  return proto.dapr.proto.runtime.v1.InvokeServiceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.InvokeServiceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.InvokeServiceRequest}
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 3:
      var value = new dapr_proto_common_v1_common_pb.InvokeRequest;
      reader.readMessage(value,dapr_proto_common_v1_common_pb.InvokeRequest.deserializeBinaryFromReader);
      msg.setMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.InvokeServiceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.InvokeServiceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getMessage();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      dapr_proto_common_v1_common_pb.InvokeRequest.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeServiceRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional dapr.proto.common.v1.InvokeRequest message = 3;
 * @return {?proto.dapr.proto.common.v1.InvokeRequest}
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.getMessage = function() {
  return /** @type{?proto.dapr.proto.common.v1.InvokeRequest} */ (
    jspb.Message.getWrapperField(this, dapr_proto_common_v1_common_pb.InvokeRequest, 3));
};


/**
 * @param {?proto.dapr.proto.common.v1.InvokeRequest|undefined} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeServiceRequest} returns this
*/
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.setMessage = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.dapr.proto.runtime.v1.InvokeServiceRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.clearMessage = function() {
  return this.setMessage(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.dapr.proto.runtime.v1.InvokeServiceRequest.prototype.hasMessage = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetStateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetStateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetStateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    key: jspb.Message.getFieldWithDefault(msg, 2, ""),
    consistency: jspb.Message.getFieldWithDefault(msg, 3, 0),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetStateRequest}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetStateRequest;
  return proto.dapr.proto.runtime.v1.GetStateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetStateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetStateRequest}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 3:
      var value = /** @type {!proto.dapr.proto.common.v1.StateOptions.StateConsistency} */ (reader.readEnum());
      msg.setConsistency(value);
      break;
    case 4:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetStateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetStateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetStateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getConsistency();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(4, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string key = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional dapr.proto.common.v1.StateOptions.StateConsistency consistency = 3;
 * @return {!proto.dapr.proto.common.v1.StateOptions.StateConsistency}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.getConsistency = function() {
  return /** @type {!proto.dapr.proto.common.v1.StateOptions.StateConsistency} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.dapr.proto.common.v1.StateOptions.StateConsistency} value
 * @return {!proto.dapr.proto.runtime.v1.GetStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.setConsistency = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};


/**
 * map<string, string> metadata = 4;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 4, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetStateRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetBulkStateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    keysList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
    parallelism: jspb.Message.getFieldWithDefault(msg, 3, 0),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetBulkStateRequest;
  return proto.dapr.proto.runtime.v1.GetBulkStateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addKeys(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setParallelism(value);
      break;
    case 4:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetBulkStateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKeysList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = message.getParallelism();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(4, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string keys = 2;
 * @return {!Array<string>}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.getKeysList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.setKeysList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.addKeys = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.clearKeysList = function() {
  return this.setKeysList([]);
};


/**
 * optional int32 parallelism = 3;
 * @return {number}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.getParallelism = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.setParallelism = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * map<string, string> metadata = 4;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 4, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkStateRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetBulkStateResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetBulkStateResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    itemsList: jspb.Message.toObjectList(msg.getItemsList(),
    proto.dapr.proto.runtime.v1.BulkStateItem.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateResponse}
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetBulkStateResponse;
  return proto.dapr.proto.runtime.v1.GetBulkStateResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkStateResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateResponse}
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.dapr.proto.runtime.v1.BulkStateItem;
      reader.readMessage(value,proto.dapr.proto.runtime.v1.BulkStateItem.deserializeBinaryFromReader);
      msg.addItems(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetBulkStateResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkStateResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getItemsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.dapr.proto.runtime.v1.BulkStateItem.serializeBinaryToWriter
    );
  }
};


/**
 * repeated BulkStateItem items = 1;
 * @return {!Array<!proto.dapr.proto.runtime.v1.BulkStateItem>}
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.prototype.getItemsList = function() {
  return /** @type{!Array<!proto.dapr.proto.runtime.v1.BulkStateItem>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.dapr.proto.runtime.v1.BulkStateItem, 1));
};


/**
 * @param {!Array<!proto.dapr.proto.runtime.v1.BulkStateItem>} value
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateResponse} returns this
*/
proto.dapr.proto.runtime.v1.GetBulkStateResponse.prototype.setItemsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.dapr.proto.runtime.v1.BulkStateItem=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem}
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.prototype.addItems = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.dapr.proto.runtime.v1.BulkStateItem, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkStateResponse.prototype.clearItemsList = function() {
  return this.setItemsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.BulkStateItem.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.BulkStateItem} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.BulkStateItem.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, ""),
    data: msg.getData_asB64(),
    etag: jspb.Message.getFieldWithDefault(msg, 3, ""),
    error: jspb.Message.getFieldWithDefault(msg, 4, ""),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.BulkStateItem;
  return proto.dapr.proto.runtime.v1.BulkStateItem.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.BulkStateItem} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setEtag(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setError(value);
      break;
    case 5:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.BulkStateItem.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.BulkStateItem} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.BulkStateItem.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getEtag();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getError();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(5, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string key = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem} returns this
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bytes data = 2;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes data = 2;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem} returns this
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional string etag = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.getEtag = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem} returns this
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.setEtag = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string error = 4;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem} returns this
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.setError = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * map<string, string> metadata = 5;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 5, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.BulkStateItem} returns this
 */
proto.dapr.proto.runtime.v1.BulkStateItem.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetStateResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetStateResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetStateResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    data: msg.getData_asB64(),
    etag: jspb.Message.getFieldWithDefault(msg, 2, ""),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetStateResponse}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetStateResponse;
  return proto.dapr.proto.runtime.v1.GetStateResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetStateResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetStateResponse}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setEtag(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetStateResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetStateResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetStateResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getEtag();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional bytes data = 1;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes data = 1;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.GetStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional string etag = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.getEtag = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.setEtag = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetStateResponse.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.DeleteStateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.DeleteStateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    key: jspb.Message.getFieldWithDefault(msg, 2, ""),
    etag: (f = msg.getEtag()) && dapr_proto_common_v1_common_pb.Etag.toObject(includeInstance, f),
    options: (f = msg.getOptions()) && dapr_proto_common_v1_common_pb.StateOptions.toObject(includeInstance, f),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.DeleteStateRequest;
  return proto.dapr.proto.runtime.v1.DeleteStateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.DeleteStateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 3:
      var value = new dapr_proto_common_v1_common_pb.Etag;
      reader.readMessage(value,dapr_proto_common_v1_common_pb.Etag.deserializeBinaryFromReader);
      msg.setEtag(value);
      break;
    case 4:
      var value = new dapr_proto_common_v1_common_pb.StateOptions;
      reader.readMessage(value,dapr_proto_common_v1_common_pb.StateOptions.deserializeBinaryFromReader);
      msg.setOptions(value);
      break;
    case 5:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.DeleteStateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.DeleteStateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getEtag();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      dapr_proto_common_v1_common_pb.Etag.serializeBinaryToWriter
    );
  }
  f = message.getOptions();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      dapr_proto_common_v1_common_pb.StateOptions.serializeBinaryToWriter
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(5, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string key = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional dapr.proto.common.v1.Etag etag = 3;
 * @return {?proto.dapr.proto.common.v1.Etag}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.getEtag = function() {
  return /** @type{?proto.dapr.proto.common.v1.Etag} */ (
    jspb.Message.getWrapperField(this, dapr_proto_common_v1_common_pb.Etag, 3));
};


/**
 * @param {?proto.dapr.proto.common.v1.Etag|undefined} value
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest} returns this
*/
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.setEtag = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.clearEtag = function() {
  return this.setEtag(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.hasEtag = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional dapr.proto.common.v1.StateOptions options = 4;
 * @return {?proto.dapr.proto.common.v1.StateOptions}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.getOptions = function() {
  return /** @type{?proto.dapr.proto.common.v1.StateOptions} */ (
    jspb.Message.getWrapperField(this, dapr_proto_common_v1_common_pb.StateOptions, 4));
};


/**
 * @param {?proto.dapr.proto.common.v1.StateOptions|undefined} value
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest} returns this
*/
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.setOptions = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.clearOptions = function() {
  return this.setOptions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.hasOptions = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * map<string, string> metadata = 5;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 5, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.DeleteStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.DeleteStateRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    statesList: jspb.Message.toObjectList(msg.getStatesList(),
    dapr_proto_common_v1_common_pb.StateItem.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest}
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.DeleteBulkStateRequest;
  return proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest}
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = new dapr_proto_common_v1_common_pb.StateItem;
      reader.readMessage(value,dapr_proto_common_v1_common_pb.StateItem.deserializeBinaryFromReader);
      msg.addStates(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStatesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      dapr_proto_common_v1_common_pb.StateItem.serializeBinaryToWriter
    );
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated dapr.proto.common.v1.StateItem states = 2;
 * @return {!Array<!proto.dapr.proto.common.v1.StateItem>}
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.getStatesList = function() {
  return /** @type{!Array<!proto.dapr.proto.common.v1.StateItem>} */ (
    jspb.Message.getRepeatedWrapperField(this, dapr_proto_common_v1_common_pb.StateItem, 2));
};


/**
 * @param {!Array<!proto.dapr.proto.common.v1.StateItem>} value
 * @return {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest} returns this
*/
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.setStatesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.dapr.proto.common.v1.StateItem=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.common.v1.StateItem}
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.addStates = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.dapr.proto.common.v1.StateItem, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.DeleteBulkStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.DeleteBulkStateRequest.prototype.clearStatesList = function() {
  return this.setStatesList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.SaveStateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.SaveStateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    statesList: jspb.Message.toObjectList(msg.getStatesList(),
    dapr_proto_common_v1_common_pb.StateItem.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.SaveStateRequest}
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.SaveStateRequest;
  return proto.dapr.proto.runtime.v1.SaveStateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.SaveStateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.SaveStateRequest}
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = new dapr_proto_common_v1_common_pb.StateItem;
      reader.readMessage(value,dapr_proto_common_v1_common_pb.StateItem.deserializeBinaryFromReader);
      msg.addStates(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.SaveStateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.SaveStateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStatesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      dapr_proto_common_v1_common_pb.StateItem.serializeBinaryToWriter
    );
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.SaveStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated dapr.proto.common.v1.StateItem states = 2;
 * @return {!Array<!proto.dapr.proto.common.v1.StateItem>}
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.getStatesList = function() {
  return /** @type{!Array<!proto.dapr.proto.common.v1.StateItem>} */ (
    jspb.Message.getRepeatedWrapperField(this, dapr_proto_common_v1_common_pb.StateItem, 2));
};


/**
 * @param {!Array<!proto.dapr.proto.common.v1.StateItem>} value
 * @return {!proto.dapr.proto.runtime.v1.SaveStateRequest} returns this
*/
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.setStatesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.dapr.proto.common.v1.StateItem=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.common.v1.StateItem}
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.addStates = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.dapr.proto.common.v1.StateItem, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.SaveStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.SaveStateRequest.prototype.clearStatesList = function() {
  return this.setStatesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.QueryStateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.QueryStateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    query: jspb.Message.getFieldWithDefault(msg, 2, ""),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateRequest}
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.QueryStateRequest;
  return proto.dapr.proto.runtime.v1.QueryStateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.QueryStateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateRequest}
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setQuery(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.QueryStateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.QueryStateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getQuery();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string query = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.getQuery = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.setQuery = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.QueryStateItem.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.QueryStateItem} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.QueryStateItem.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, ""),
    data: msg.getData_asB64(),
    etag: jspb.Message.getFieldWithDefault(msg, 3, ""),
    error: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateItem}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.QueryStateItem;
  return proto.dapr.proto.runtime.v1.QueryStateItem.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.QueryStateItem} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateItem}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setEtag(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setError(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.QueryStateItem.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.QueryStateItem} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.QueryStateItem.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getEtag();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getError();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string key = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateItem} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bytes data = 2;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes data = 2;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateItem} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional string etag = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.getEtag = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateItem} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.setEtag = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string error = 4;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateItem} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateItem.prototype.setError = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.QueryStateResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.QueryStateResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    resultsList: jspb.Message.toObjectList(msg.getResultsList(),
    proto.dapr.proto.runtime.v1.QueryStateItem.toObject, includeInstance),
    token: jspb.Message.getFieldWithDefault(msg, 2, ""),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateResponse}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.QueryStateResponse;
  return proto.dapr.proto.runtime.v1.QueryStateResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.QueryStateResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateResponse}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.dapr.proto.runtime.v1.QueryStateItem;
      reader.readMessage(value,proto.dapr.proto.runtime.v1.QueryStateItem.deserializeBinaryFromReader);
      msg.addResults(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.QueryStateResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.QueryStateResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResultsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.dapr.proto.runtime.v1.QueryStateItem.serializeBinaryToWriter
    );
  }
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * repeated QueryStateItem results = 1;
 * @return {!Array<!proto.dapr.proto.runtime.v1.QueryStateItem>}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.getResultsList = function() {
  return /** @type{!Array<!proto.dapr.proto.runtime.v1.QueryStateItem>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.dapr.proto.runtime.v1.QueryStateItem, 1));
};


/**
 * @param {!Array<!proto.dapr.proto.runtime.v1.QueryStateItem>} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateResponse} returns this
*/
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.setResultsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.dapr.proto.runtime.v1.QueryStateItem=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.QueryStateItem}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.addResults = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.dapr.proto.runtime.v1.QueryStateItem, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.clearResultsList = function() {
  return this.setResultsList([]);
};


/**
 * optional string token = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.QueryStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.QueryStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.QueryStateResponse.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.PublishEventRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.PublishEventRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    pubsubName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    topic: jspb.Message.getFieldWithDefault(msg, 2, ""),
    data: msg.getData_asB64(),
    dataContentType: jspb.Message.getFieldWithDefault(msg, 4, ""),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.PublishEventRequest}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.PublishEventRequest;
  return proto.dapr.proto.runtime.v1.PublishEventRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.PublishEventRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.PublishEventRequest}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPubsubName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTopic(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDataContentType(value);
      break;
    case 5:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.PublishEventRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.PublishEventRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPubsubName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTopic();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
  f = message.getDataContentType();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(5, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string pubsub_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.getPubsubName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.PublishEventRequest} returns this
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.setPubsubName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string topic = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.getTopic = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.PublishEventRequest} returns this
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.setTopic = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional bytes data = 3;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes data = 3;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.PublishEventRequest} returns this
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * optional string data_content_type = 4;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.getDataContentType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.PublishEventRequest} returns this
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.setDataContentType = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * map<string, string> metadata = 5;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 5, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.PublishEventRequest} returns this
 */
proto.dapr.proto.runtime.v1.PublishEventRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.InvokeBindingRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.InvokeBindingRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    data: msg.getData_asB64(),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : [],
    operation: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingRequest}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.InvokeBindingRequest;
  return proto.dapr.proto.runtime.v1.InvokeBindingRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.InvokeBindingRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingRequest}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setOperation(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.InvokeBindingRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.InvokeBindingRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
  f = message.getOperation();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bytes data = 2;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes data = 2;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};


/**
 * optional string operation = 4;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.getOperation = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeBindingRequest.prototype.setOperation = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.InvokeBindingResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.InvokeBindingResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    data: msg.getData_asB64(),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingResponse}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.InvokeBindingResponse;
  return proto.dapr.proto.runtime.v1.InvokeBindingResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.InvokeBindingResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingResponse}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 2:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.InvokeBindingResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.InvokeBindingResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional bytes data = 1;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes data = 1;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingResponse} returns this
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * map<string, string> metadata = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.InvokeBindingResponse} returns this
 */
proto.dapr.proto.runtime.v1.InvokeBindingResponse.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetSecretRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetSecretRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    key: jspb.Message.getFieldWithDefault(msg, 2, ""),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetSecretRequest}
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetSecretRequest;
  return proto.dapr.proto.runtime.v1.GetSecretRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetSecretRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetSecretRequest}
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetSecretRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetSecretRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetSecretRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string key = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetSecretRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetSecretRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetSecretRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetSecretResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetSecretResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    dataMap: (f = msg.getDataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetSecretResponse}
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetSecretResponse;
  return proto.dapr.proto.runtime.v1.GetSecretResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetSecretResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetSecretResponse}
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getDataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetSecretResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetSecretResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * map<string, string> data = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.prototype.getDataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetSecretResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetSecretResponse.prototype.clearDataMap = function() {
  this.getDataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetBulkSecretRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetBulkSecretRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkSecretRequest}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetBulkSecretRequest;
  return proto.dapr.proto.runtime.v1.GetBulkSecretRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkSecretRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkSecretRequest}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetBulkSecretRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkSecretRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetBulkSecretRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * map<string, string> metadata = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkSecretRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkSecretRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.SecretResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.SecretResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.SecretResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SecretResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    secretsMap: (f = msg.getSecretsMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.SecretResponse}
 */
proto.dapr.proto.runtime.v1.SecretResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.SecretResponse;
  return proto.dapr.proto.runtime.v1.SecretResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.SecretResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.SecretResponse}
 */
proto.dapr.proto.runtime.v1.SecretResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getSecretsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.SecretResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.SecretResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.SecretResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SecretResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSecretsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * map<string, string> secrets = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.SecretResponse.prototype.getSecretsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.SecretResponse} returns this
 */
proto.dapr.proto.runtime.v1.SecretResponse.prototype.clearSecretsMap = function() {
  this.getSecretsMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetBulkSecretResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetBulkSecretResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    dataMap: (f = msg.getDataMap()) ? f.toObject(includeInstance, proto.dapr.proto.runtime.v1.SecretResponse.toObject) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkSecretResponse}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetBulkSecretResponse;
  return proto.dapr.proto.runtime.v1.GetBulkSecretResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkSecretResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkSecretResponse}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getDataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.dapr.proto.runtime.v1.SecretResponse.deserializeBinaryFromReader, "", new proto.dapr.proto.runtime.v1.SecretResponse());
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetBulkSecretResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetBulkSecretResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.dapr.proto.runtime.v1.SecretResponse.serializeBinaryToWriter);
  }
};


/**
 * map<string, SecretResponse> data = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.dapr.proto.runtime.v1.SecretResponse>}
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.prototype.getDataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.dapr.proto.runtime.v1.SecretResponse>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.dapr.proto.runtime.v1.SecretResponse));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetBulkSecretResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetBulkSecretResponse.prototype.clearDataMap = function() {
  this.getDataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.TransactionalStateOperation.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.TransactionalStateOperation} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.toObject = function(includeInstance, msg) {
  var f, obj = {
    operationtype: jspb.Message.getFieldWithDefault(msg, 1, ""),
    request: (f = msg.getRequest()) && dapr_proto_common_v1_common_pb.StateItem.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.TransactionalStateOperation}
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.TransactionalStateOperation;
  return proto.dapr.proto.runtime.v1.TransactionalStateOperation.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.TransactionalStateOperation} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.TransactionalStateOperation}
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setOperationtype(value);
      break;
    case 2:
      var value = new dapr_proto_common_v1_common_pb.StateItem;
      reader.readMessage(value,dapr_proto_common_v1_common_pb.StateItem.deserializeBinaryFromReader);
      msg.setRequest(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.TransactionalStateOperation.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.TransactionalStateOperation} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOperationtype();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRequest();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      dapr_proto_common_v1_common_pb.StateItem.serializeBinaryToWriter
    );
  }
};


/**
 * optional string operationType = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.getOperationtype = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.TransactionalStateOperation} returns this
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.setOperationtype = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional dapr.proto.common.v1.StateItem request = 2;
 * @return {?proto.dapr.proto.common.v1.StateItem}
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.getRequest = function() {
  return /** @type{?proto.dapr.proto.common.v1.StateItem} */ (
    jspb.Message.getWrapperField(this, dapr_proto_common_v1_common_pb.StateItem, 2));
};


/**
 * @param {?proto.dapr.proto.common.v1.StateItem|undefined} value
 * @return {!proto.dapr.proto.runtime.v1.TransactionalStateOperation} returns this
*/
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.setRequest = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.dapr.proto.runtime.v1.TransactionalStateOperation} returns this
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.clearRequest = function() {
  return this.setRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.dapr.proto.runtime.v1.TransactionalStateOperation.prototype.hasRequest = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storename: jspb.Message.getFieldWithDefault(msg, 1, ""),
    operationsList: jspb.Message.toObjectList(msg.getOperationsList(),
    proto.dapr.proto.runtime.v1.TransactionalStateOperation.toObject, includeInstance),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest;
  return proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStorename(value);
      break;
    case 2:
      var value = new proto.dapr.proto.runtime.v1.TransactionalStateOperation;
      reader.readMessage(value,proto.dapr.proto.runtime.v1.TransactionalStateOperation.deserializeBinaryFromReader);
      msg.addOperations(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStorename();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getOperationsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.dapr.proto.runtime.v1.TransactionalStateOperation.serializeBinaryToWriter
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string storeName = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.getStorename = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest} returns this
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.setStorename = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated TransactionalStateOperation operations = 2;
 * @return {!Array<!proto.dapr.proto.runtime.v1.TransactionalStateOperation>}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.getOperationsList = function() {
  return /** @type{!Array<!proto.dapr.proto.runtime.v1.TransactionalStateOperation>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.dapr.proto.runtime.v1.TransactionalStateOperation, 2));
};


/**
 * @param {!Array<!proto.dapr.proto.runtime.v1.TransactionalStateOperation>} value
 * @return {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest} returns this
*/
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.setOperationsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.dapr.proto.runtime.v1.TransactionalStateOperation=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.TransactionalStateOperation}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.addOperations = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.dapr.proto.runtime.v1.TransactionalStateOperation, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest} returns this
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.clearOperationsList = function() {
  return this.setOperationsList([]);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest} returns this
 */
proto.dapr.proto.runtime.v1.ExecuteStateTransactionRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    name: jspb.Message.getFieldWithDefault(msg, 3, ""),
    dueTime: jspb.Message.getFieldWithDefault(msg, 4, ""),
    period: jspb.Message.getFieldWithDefault(msg, 5, ""),
    callback: jspb.Message.getFieldWithDefault(msg, 6, ""),
    data: msg.getData_asB64(),
    ttl: jspb.Message.getFieldWithDefault(msg, 8, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.RegisterActorTimerRequest;
  return proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDueTime(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setPeriod(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setCallback(value);
      break;
    case 7:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setTtl(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDueTime();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getPeriod();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getCallback();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      7,
      f
    );
  }
  f = message.getTtl();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string due_time = 4;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getDueTime = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setDueTime = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string period = 5;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getPeriod = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setPeriod = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string callback = 6;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getCallback = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setCallback = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional bytes data = 7;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * optional bytes data = 7;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 7;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 7, value);
};


/**
 * optional string ttl = 8;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.getTtl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorTimerRequest.prototype.setTtl = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    name: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest}
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest;
  return proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest}
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnregisterActorTimerRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    name: jspb.Message.getFieldWithDefault(msg, 3, ""),
    dueTime: jspb.Message.getFieldWithDefault(msg, 4, ""),
    period: jspb.Message.getFieldWithDefault(msg, 5, ""),
    data: msg.getData_asB64(),
    ttl: jspb.Message.getFieldWithDefault(msg, 7, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.RegisterActorReminderRequest;
  return proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDueTime(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setPeriod(value);
      break;
    case 6:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setTtl(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDueTime();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getPeriod();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      6,
      f
    );
  }
  f = message.getTtl();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string due_time = 4;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getDueTime = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.setDueTime = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string period = 5;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getPeriod = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.setPeriod = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional bytes data = 6;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * optional bytes data = 6;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 6;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 6, value);
};


/**
 * optional string ttl = 7;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.getTtl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RegisterActorReminderRequest.prototype.setTtl = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    name: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest}
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest;
  return proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest}
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnregisterActorReminderRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.RenameActorReminderRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    oldName: jspb.Message.getFieldWithDefault(msg, 3, ""),
    newName: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.RenameActorReminderRequest;
  return proto.dapr.proto.runtime.v1.RenameActorReminderRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setOldName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setNewName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.RenameActorReminderRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getOldName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getNewName();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string old_name = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.getOldName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.setOldName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string new_name = 4;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.getNewName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RenameActorReminderRequest} returns this
 */
proto.dapr.proto.runtime.v1.RenameActorReminderRequest.prototype.setNewName = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetActorStateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetActorStateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    key: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateRequest}
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetActorStateRequest;
  return proto.dapr.proto.runtime.v1.GetActorStateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetActorStateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateRequest}
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetActorStateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetActorStateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string key = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetActorStateRequest.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetActorStateResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetActorStateResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    data: msg.getData_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateResponse}
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetActorStateResponse;
  return proto.dapr.proto.runtime.v1.GetActorStateResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetActorStateResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateResponse}
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetActorStateResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetActorStateResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
};


/**
 * optional bytes data = 1;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes data = 1;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.GetActorStateResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetActorStateResponse.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    operationsList: jspb.Message.toObjectList(msg.getOperationsList(),
    proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest;
  return proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = new proto.dapr.proto.runtime.v1.TransactionalActorStateOperation;
      reader.readMessage(value,proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.deserializeBinaryFromReader);
      msg.addOperations(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getOperationsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.serializeBinaryToWriter
    );
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest} returns this
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest} returns this
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated TransactionalActorStateOperation operations = 3;
 * @return {!Array<!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation>}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.getOperationsList = function() {
  return /** @type{!Array<!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.dapr.proto.runtime.v1.TransactionalActorStateOperation, 3));
};


/**
 * @param {!Array<!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation>} value
 * @return {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest} returns this
*/
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.setOperationsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation}
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.addOperations = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.dapr.proto.runtime.v1.TransactionalActorStateOperation, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest} returns this
 */
proto.dapr.proto.runtime.v1.ExecuteActorStateTransactionRequest.prototype.clearOperationsList = function() {
  return this.setOperationsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.toObject = function(includeInstance, msg) {
  var f, obj = {
    operationtype: jspb.Message.getFieldWithDefault(msg, 1, ""),
    key: jspb.Message.getFieldWithDefault(msg, 2, ""),
    value: (f = msg.getValue()) && google_protobuf_any_pb.Any.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.TransactionalActorStateOperation;
  return proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setOperationtype(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 3:
      var value = new google_protobuf_any_pb.Any;
      reader.readMessage(value,google_protobuf_any_pb.Any.deserializeBinaryFromReader);
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOperationtype();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getValue();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_any_pb.Any.serializeBinaryToWriter
    );
  }
};


/**
 * optional string operationType = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.getOperationtype = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation} returns this
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.setOperationtype = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string key = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation} returns this
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional google.protobuf.Any value = 3;
 * @return {?proto.google.protobuf.Any}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.getValue = function() {
  return /** @type{?proto.google.protobuf.Any} */ (
    jspb.Message.getWrapperField(this, google_protobuf_any_pb.Any, 3));
};


/**
 * @param {?proto.google.protobuf.Any|undefined} value
 * @return {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation} returns this
*/
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.setValue = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.dapr.proto.runtime.v1.TransactionalActorStateOperation} returns this
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.clearValue = function() {
  return this.setValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.dapr.proto.runtime.v1.TransactionalActorStateOperation.prototype.hasValue = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.InvokeActorRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.InvokeActorRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    actorType: jspb.Message.getFieldWithDefault(msg, 1, ""),
    actorId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    method: jspb.Message.getFieldWithDefault(msg, 3, ""),
    data: msg.getData_asB64(),
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorRequest}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.InvokeActorRequest;
  return proto.dapr.proto.runtime.v1.InvokeActorRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.InvokeActorRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorRequest}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setActorId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setMethod(value);
      break;
    case 4:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 5:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.InvokeActorRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.InvokeActorRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActorType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActorId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMethod();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      4,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(5, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string actor_type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.getActorType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.setActorType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string actor_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.getActorId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.setActorId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string method = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.getMethod = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.setMethod = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional bytes data = 4;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * optional bytes data = 4;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 4, value);
};


/**
 * map<string, string> metadata = 5;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 5, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorRequest} returns this
 */
proto.dapr.proto.runtime.v1.InvokeActorRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.InvokeActorResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.InvokeActorResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    data: msg.getData_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorResponse}
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.InvokeActorResponse;
  return proto.dapr.proto.runtime.v1.InvokeActorResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.InvokeActorResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorResponse}
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.InvokeActorResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.InvokeActorResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
};


/**
 * optional bytes data = 1;
 * @return {!(string|Uint8Array)}
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes data = 1;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.dapr.proto.runtime.v1.InvokeActorResponse} returns this
 */
proto.dapr.proto.runtime.v1.InvokeActorResponse.prototype.setData = function(value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.repeatedFields_ = [2,3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetMetadataResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetMetadataResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    activeActorsCountList: jspb.Message.toObjectList(msg.getActiveActorsCountList(),
    proto.dapr.proto.runtime.v1.ActiveActorsCount.toObject, includeInstance),
    registeredComponentsList: jspb.Message.toObjectList(msg.getRegisteredComponentsList(),
    proto.dapr.proto.runtime.v1.RegisteredComponents.toObject, includeInstance),
    extendedMetadataMap: (f = msg.getExtendedMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetMetadataResponse;
  return proto.dapr.proto.runtime.v1.GetMetadataResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetMetadataResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.dapr.proto.runtime.v1.ActiveActorsCount;
      reader.readMessage(value,proto.dapr.proto.runtime.v1.ActiveActorsCount.deserializeBinaryFromReader);
      msg.addActiveActorsCount(value);
      break;
    case 3:
      var value = new proto.dapr.proto.runtime.v1.RegisteredComponents;
      reader.readMessage(value,proto.dapr.proto.runtime.v1.RegisteredComponents.deserializeBinaryFromReader);
      msg.addRegisteredComponents(value);
      break;
    case 4:
      var value = msg.getExtendedMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetMetadataResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetMetadataResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getActiveActorsCountList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.dapr.proto.runtime.v1.ActiveActorsCount.serializeBinaryToWriter
    );
  }
  f = message.getRegisteredComponentsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.dapr.proto.runtime.v1.RegisteredComponents.serializeBinaryToWriter
    );
  }
  f = message.getExtendedMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(4, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated ActiveActorsCount active_actors_count = 2;
 * @return {!Array<!proto.dapr.proto.runtime.v1.ActiveActorsCount>}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.getActiveActorsCountList = function() {
  return /** @type{!Array<!proto.dapr.proto.runtime.v1.ActiveActorsCount>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.dapr.proto.runtime.v1.ActiveActorsCount, 2));
};


/**
 * @param {!Array<!proto.dapr.proto.runtime.v1.ActiveActorsCount>} value
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse} returns this
*/
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.setActiveActorsCountList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.dapr.proto.runtime.v1.ActiveActorsCount=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.ActiveActorsCount}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.addActiveActorsCount = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.dapr.proto.runtime.v1.ActiveActorsCount, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.clearActiveActorsCountList = function() {
  return this.setActiveActorsCountList([]);
};


/**
 * repeated RegisteredComponents registered_components = 3;
 * @return {!Array<!proto.dapr.proto.runtime.v1.RegisteredComponents>}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.getRegisteredComponentsList = function() {
  return /** @type{!Array<!proto.dapr.proto.runtime.v1.RegisteredComponents>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.dapr.proto.runtime.v1.RegisteredComponents, 3));
};


/**
 * @param {!Array<!proto.dapr.proto.runtime.v1.RegisteredComponents>} value
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse} returns this
*/
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.setRegisteredComponentsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.dapr.proto.runtime.v1.RegisteredComponents=} opt_value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.addRegisteredComponents = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.dapr.proto.runtime.v1.RegisteredComponents, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.clearRegisteredComponentsList = function() {
  return this.setRegisteredComponentsList([]);
};


/**
 * map<string, string> extended_metadata = 4;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.getExtendedMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 4, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetMetadataResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetMetadataResponse.prototype.clearExtendedMetadataMap = function() {
  this.getExtendedMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.ActiveActorsCount.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.ActiveActorsCount} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, ""),
    count: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.ActiveActorsCount}
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.ActiveActorsCount;
  return proto.dapr.proto.runtime.v1.ActiveActorsCount.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.ActiveActorsCount} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.ActiveActorsCount}
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setType(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.ActiveActorsCount.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.ActiveActorsCount} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getCount();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional string type = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.ActiveActorsCount} returns this
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 count = 2;
 * @return {number}
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.prototype.getCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.dapr.proto.runtime.v1.ActiveActorsCount} returns this
 */
proto.dapr.proto.runtime.v1.ActiveActorsCount.prototype.setCount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.repeatedFields_ = [4];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.RegisteredComponents.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.RegisteredComponents} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    type: jspb.Message.getFieldWithDefault(msg, 2, ""),
    version: jspb.Message.getFieldWithDefault(msg, 3, ""),
    capabilitiesList: (f = jspb.Message.getRepeatedField(msg, 4)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.RegisteredComponents;
  return proto.dapr.proto.runtime.v1.RegisteredComponents.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.RegisteredComponents} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setType(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.addCapabilities(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.RegisteredComponents.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.RegisteredComponents} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getCapabilitiesList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      4,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents} returns this
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string type = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents} returns this
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string version = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents} returns this
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * repeated string capabilities = 4;
 * @return {!Array<string>}
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.getCapabilitiesList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 4));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents} returns this
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.setCapabilitiesList = function(value) {
  return jspb.Message.setField(this, 4, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents} returns this
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.addCapabilities = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 4, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.RegisteredComponents} returns this
 */
proto.dapr.proto.runtime.v1.RegisteredComponents.prototype.clearCapabilitiesList = function() {
  return this.setCapabilitiesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.SetMetadataRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.SetMetadataRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, ""),
    value: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.SetMetadataRequest}
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.SetMetadataRequest;
  return proto.dapr.proto.runtime.v1.SetMetadataRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.SetMetadataRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.SetMetadataRequest}
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.SetMetadataRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.SetMetadataRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string key = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.SetMetadataRequest} returns this
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.prototype.setKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string value = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.SetMetadataRequest} returns this
 */
proto.dapr.proto.runtime.v1.SetMetadataRequest.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetConfigurationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    keysList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationRequest}
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetConfigurationRequest;
  return proto.dapr.proto.runtime.v1.GetConfigurationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationRequest}
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addKeys(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetConfigurationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKeysList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string keys = 2;
 * @return {!Array<string>}
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.getKeysList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.setKeysList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.addKeys = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.clearKeysList = function() {
  return this.setKeysList([]);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.GetConfigurationRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.GetConfigurationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.GetConfigurationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    itemsMap: (f = msg.getItemsMap()) ? f.toObject(includeInstance, proto.dapr.proto.common.v1.ConfigurationItem.toObject) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationResponse}
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.GetConfigurationResponse;
  return proto.dapr.proto.runtime.v1.GetConfigurationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.GetConfigurationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationResponse}
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getItemsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.dapr.proto.common.v1.ConfigurationItem.deserializeBinaryFromReader, "", new proto.dapr.proto.common.v1.ConfigurationItem());
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.GetConfigurationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.GetConfigurationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getItemsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.dapr.proto.common.v1.ConfigurationItem.serializeBinaryToWriter);
  }
};


/**
 * map<string, dapr.proto.common.v1.ConfigurationItem> items = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.dapr.proto.common.v1.ConfigurationItem>}
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.prototype.getItemsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.dapr.proto.common.v1.ConfigurationItem>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.dapr.proto.common.v1.ConfigurationItem));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.GetConfigurationResponse} returns this
 */
proto.dapr.proto.runtime.v1.GetConfigurationResponse.prototype.clearItemsMap = function() {
  this.getItemsMap().clear();
  return this;};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    keysList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
    metadataMap: (f = msg.getMetadataMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest;
  return proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addKeys(value);
      break;
    case 3:
      var value = msg.getMetadataMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKeysList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = message.getMetadataMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string keys = 2;
 * @return {!Array<string>}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.getKeysList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.setKeysList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.addKeys = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.clearKeysList = function() {
  return this.setKeysList([]);
};


/**
 * map<string, string> metadata = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.getMetadataMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationRequest.prototype.clearMetadataMap = function() {
  this.getMetadataMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    id: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest;
  return proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    itemsMap: (f = msg.getItemsMap()) ? f.toObject(includeInstance, proto.dapr.proto.common.v1.ConfigurationItem.toObject) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse;
  return proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = msg.getItemsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.dapr.proto.common.v1.ConfigurationItem.deserializeBinaryFromReader, "", new proto.dapr.proto.common.v1.ConfigurationItem());
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getItemsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.dapr.proto.common.v1.ConfigurationItem.serializeBinaryToWriter);
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse} returns this
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * map<string, dapr.proto.common.v1.ConfigurationItem> items = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.dapr.proto.common.v1.ConfigurationItem>}
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.prototype.getItemsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.dapr.proto.common.v1.ConfigurationItem>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.dapr.proto.common.v1.ConfigurationItem));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse} returns this
 */
proto.dapr.proto.runtime.v1.SubscribeConfigurationResponse.prototype.clearItemsMap = function() {
  this.getItemsMap().clear();
  return this;};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    ok: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    message: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse;
  return proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOk(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOk();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional bool ok = 1;
 * @return {boolean}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.prototype.getOk = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse} returns this
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.prototype.setOk = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional string message = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse} returns this
 */
proto.dapr.proto.runtime.v1.UnsubscribeConfigurationResponse.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.TryLockRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.TryLockRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TryLockRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    resourceId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    lockOwner: jspb.Message.getFieldWithDefault(msg, 3, ""),
    expiryinseconds: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.TryLockRequest}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.TryLockRequest;
  return proto.dapr.proto.runtime.v1.TryLockRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.TryLockRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.TryLockRequest}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setResourceId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setLockOwner(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setExpiryinseconds(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.TryLockRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.TryLockRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TryLockRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getResourceId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getLockOwner();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getExpiryinseconds();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.TryLockRequest} returns this
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string resource_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.getResourceId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.TryLockRequest} returns this
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.setResourceId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string lock_owner = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.getLockOwner = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.TryLockRequest} returns this
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.setLockOwner = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int32 expiryInSeconds = 4;
 * @return {number}
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.getExpiryinseconds = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.dapr.proto.runtime.v1.TryLockRequest} returns this
 */
proto.dapr.proto.runtime.v1.TryLockRequest.prototype.setExpiryinseconds = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.TryLockResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.TryLockResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.TryLockResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TryLockResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    success: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.TryLockResponse}
 */
proto.dapr.proto.runtime.v1.TryLockResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.TryLockResponse;
  return proto.dapr.proto.runtime.v1.TryLockResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.TryLockResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.TryLockResponse}
 */
proto.dapr.proto.runtime.v1.TryLockResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSuccess(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.TryLockResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.TryLockResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.TryLockResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.TryLockResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSuccess();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool success = 1;
 * @return {boolean}
 */
proto.dapr.proto.runtime.v1.TryLockResponse.prototype.getSuccess = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.dapr.proto.runtime.v1.TryLockResponse} returns this
 */
proto.dapr.proto.runtime.v1.TryLockResponse.prototype.setSuccess = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.UnlockRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.UnlockRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnlockRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    storeName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    resourceId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    lockOwner: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.UnlockRequest}
 */
proto.dapr.proto.runtime.v1.UnlockRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.UnlockRequest;
  return proto.dapr.proto.runtime.v1.UnlockRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.UnlockRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.UnlockRequest}
 */
proto.dapr.proto.runtime.v1.UnlockRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStoreName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setResourceId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setLockOwner(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.UnlockRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.UnlockRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnlockRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStoreName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getResourceId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getLockOwner();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string store_name = 1;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.getStoreName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnlockRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.setStoreName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string resource_id = 2;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.getResourceId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnlockRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.setResourceId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string lock_owner = 3;
 * @return {string}
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.getLockOwner = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.dapr.proto.runtime.v1.UnlockRequest} returns this
 */
proto.dapr.proto.runtime.v1.UnlockRequest.prototype.setLockOwner = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.dapr.proto.runtime.v1.UnlockResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.dapr.proto.runtime.v1.UnlockResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.dapr.proto.runtime.v1.UnlockResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnlockResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    status: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.dapr.proto.runtime.v1.UnlockResponse}
 */
proto.dapr.proto.runtime.v1.UnlockResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.dapr.proto.runtime.v1.UnlockResponse;
  return proto.dapr.proto.runtime.v1.UnlockResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.dapr.proto.runtime.v1.UnlockResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.dapr.proto.runtime.v1.UnlockResponse}
 */
proto.dapr.proto.runtime.v1.UnlockResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.dapr.proto.runtime.v1.UnlockResponse.Status} */ (reader.readEnum());
      msg.setStatus(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.dapr.proto.runtime.v1.UnlockResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.dapr.proto.runtime.v1.UnlockResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.dapr.proto.runtime.v1.UnlockResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.dapr.proto.runtime.v1.UnlockResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatus();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.dapr.proto.runtime.v1.UnlockResponse.Status = {
  SUCCESS: 0,
  LOCK_DOES_NOT_EXIST: 1,
  LOCK_BELONGS_TO_OTHERS: 2,
  INTERNAL_ERROR: 3
};

/**
 * optional Status status = 1;
 * @return {!proto.dapr.proto.runtime.v1.UnlockResponse.Status}
 */
proto.dapr.proto.runtime.v1.UnlockResponse.prototype.getStatus = function() {
  return /** @type {!proto.dapr.proto.runtime.v1.UnlockResponse.Status} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.dapr.proto.runtime.v1.UnlockResponse.Status} value
 * @return {!proto.dapr.proto.runtime.v1.UnlockResponse} returns this
 */
proto.dapr.proto.runtime.v1.UnlockResponse.prototype.setStatus = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


goog.object.extend(exports, proto.dapr.proto.runtime.v1);

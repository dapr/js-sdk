module.exports = {
    dapr_pb: require('./dapr/proto/runtime/v1/dapr_pb.js'),
    dapr_grpc: require('./dapr/proto/runtime/v1/dapr_grpc_pb.js'),
    daprclient_pb: require('./dapr/proto/runtime/v1/appcallback_pb.js'),
    daprclient_grpc: require('./dapr/proto/runtime/v1/appcallback_grpc_pb.js'),
    common_pb: require('./dapr/proto/common/v1/common_pb'),
    grpc: require('grpc')
}
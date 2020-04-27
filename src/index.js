module.exports = {
    dapr_pb: require('./dapr/proto/dapr/v1/dapr_pb.js'),
    dapr_grpc: require('./dapr/proto/dapr/v1/dapr_grpc_web_pb.js'),
    daprclient_pb: require('./dapr/proto/daprclient/v1/daprclient_pb.js'),
    daprclient_grpc: require('./dapr/proto/daprclient/v1/daprclient_grpc_web_pb.js'),
    common_pb: require('./dapr/proto/common/v1/common_pb'),
    grpc: require('grpc')
}
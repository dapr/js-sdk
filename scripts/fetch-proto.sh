#!/bin/bash
OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
ORG_NAME="dapr"
REPO_NAME="dapr"
BRANCH_NAME="v1.17.3"

# Path to store output
PATH_ROOT=$(pwd)

# HTTP request CLI
HTTP_REQUEST_CLI=curl

# Install gRPC tools
prerequisiteInstallGrpcTools() {
    echo "Installing gRPC tools..."
    # Note, grpc tools does not support native M1 architecture,
    # so we need to install its x64 version.
    # See https://github.com/grpc/grpc-node/issues/1880
    if [ "$ARCH" = "arm64" ]; then
        npm install grpc-tools --target_arch=x64 --no-save
    else
        npm install grpc-tools --no-save
    fi
}

# Make sure curl or wget are installed
prerequisiteCheckHttpRequestCLI() {
    if type "curl" > /dev/null; then
        HTTP_REQUEST_CLI=curl
    elif type "wget" > /dev/null; then
        HTTP_REQUEST_CLI=wget
    else
        echo "Either curl or wget is required"
        exit 1
    fi
}

downloadFile() {
    SRC=$1
    DST=$2

    # Ensure target path exists
    mkdir -p $(dirname $DST)

    # Download the file
    echo "[$HTTP_REQUEST_CLI] Downloading $1 ..."
    if [ "$HTTP_REQUEST_CLI" == "curl" ]; then
        curl -SsL "$SRC" -o "$DST"
    else
        wget -q -P "$SRC" "$DST"
    fi
    echo "[$HTTP_REQUEST_CLI] Saved to $DST"
}

generateGrpc() {
    PATH_PROTO=$1
    PATH_FILE=$2

    echo "[protoc] Generating RPC for $PATH_PROTO/$PATH_FILE"

    # Tools to be installed by npm (see package.json)
    # npm install grpc-tools --save-dev
    # npm install grpc_tools_node_protoc_ts --save-dev
    PROTOC_GEN_TS_PATH="${PATH_ROOT}/node_modules/.bin/protoc-gen-ts"
    PROTOC_GEN_GRPC_PATH="${PATH_ROOT}/node_modules/.bin/grpc_tools_node_protoc_plugin"

    # Use grpc_tools_node_protoc which bundles protoc-gen-js
    "${PATH_ROOT}/node_modules/.bin/grpc_tools_node_protoc" \
        --proto_path="${PATH_PROTO}" \
        --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
        --plugin=protoc-gen-grpc=${PROTOC_GEN_GRPC_PATH} \
        --js_out="import_style=commonjs,binary:$PATH_PROTO" \
        --ts_out="grpc_js:$PATH_PROTO" \
        --grpc_out="grpc_js:$PATH_PROTO" \
        "$PATH_PROTO/$PATH_FILE"
}

fail_trap() {
    result=$?
    if [ $result != 0 ]; then
        echo "Failed to generate gRPC interface and proto buf: $ret_val"
    fi
    cleanup
    exit $result
}

cleanup() {
    find $PATH_PROTO -type f -name '*.proto' -delete
    rm -rf protoc
    rm -f protoc.zip
}

generateGrpcSuccess() {
    echo -e "\ngRPC interface and proto buf generated successfully!"
}

# -----------------------------------------------------------------------------
# main
# -----------------------------------------------------------------------------
#trap "fail_trap" EXIT

echo "Checking dependencies"
prerequisiteCheckHttpRequestCLI
prerequisiteInstallGrpcTools

echo ""
echo "Removing old proto files"
rm -rf "$PATH_ROOT/src/proto"
mkdir -p "$PATH_ROOT/src/proto"

DAPR_BASE="https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME"

echo ""
echo "Downloading latest Dapr gRPC files from $ORG_NAME/$REPO_NAME@$BRANCH_NAME"

# common/v1
downloadFile "$DAPR_BASE/dapr/proto/common/v1/common.proto" "$PATH_ROOT/src/proto/dapr/proto/common/v1/common.proto"

# internals/v1
downloadFile "$DAPR_BASE/dapr/proto/internals/v1/apiversion.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/apiversion.proto"
downloadFile "$DAPR_BASE/dapr/proto/internals/v1/reminders.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/reminders.proto"
downloadFile "$DAPR_BASE/dapr/proto/internals/v1/service_invocation.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/service_invocation.proto"
downloadFile "$DAPR_BASE/dapr/proto/internals/v1/status.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/status.proto"
downloadFile "$DAPR_BASE/dapr/proto/internals/v1/jobs.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/jobs.proto"

# scheduler/v1
downloadFile "$DAPR_BASE/dapr/proto/scheduler/v1/scheduler.proto" "$PATH_ROOT/src/proto/dapr/proto/scheduler/v1/scheduler.proto"

# operator/v1
downloadFile "$DAPR_BASE/dapr/proto/operator/v1/operator.proto" "$PATH_ROOT/src/proto/dapr/proto/operator/v1/operator.proto"

# placement/v1
downloadFile "$DAPR_BASE/dapr/proto/placement/v1/placement.proto" "$PATH_ROOT/src/proto/dapr/proto/placement/v1/placement.proto"

# runtime/v1 (split into multiple files in v1.17+)
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/dapr.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/dapr.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/appcallback.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/appcallback.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/actors.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/actors.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/ai.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/ai.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/binding.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/binding.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/configuration.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/configuration.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/crypto.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/crypto.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/invoke.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/invoke.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/jobs.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/jobs.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/lock.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/lock.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/metadata.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/metadata.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/pubsub.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/pubsub.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/secret.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/secret.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/state.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/state.proto"
downloadFile "$DAPR_BASE/dapr/proto/runtime/v1/workflow.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/workflow.proto"

# sentry/v1
downloadFile "$DAPR_BASE/dapr/proto/sentry/v1/sentry.proto" "$PATH_ROOT/src/proto/dapr/proto/sentry/v1/sentry.proto"

echo ""
echo "Downloading latest Google Protobuf gRPC files"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/any.proto" "$PATH_ROOT/src/proto/google/protobuf/any.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/empty.proto" "$PATH_ROOT/src/proto/google/protobuf/empty.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/timestamp.proto" "$PATH_ROOT/src/proto/google/protobuf/timestamp.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/duration.proto" "$PATH_ROOT/src/proto/google/protobuf/duration.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/struct.proto" "$PATH_ROOT/src/proto/google/protobuf/struct.proto"

echo ""
echo "Compiling gRPC files"

# Common types first
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/any.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/empty.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/timestamp.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/duration.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/struct.proto"

generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/common/v1/common.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/apiversion.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/reminders.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/service_invocation.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/status.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/scheduler/v1/scheduler.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/jobs.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/operator/v1/operator.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/placement/v1/placement.proto"

# Runtime protos - compile sub-protos before dapr.proto which imports them
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/actors.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/ai.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/binding.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/configuration.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/crypto.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/invoke.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/jobs.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/lock.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/metadata.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/pubsub.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/secret.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/state.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/workflow.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/dapr.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/appcallback.proto"

generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/sentry/v1/sentry.proto"


echo ""
echo "DONE"

#cleanup

generateGrpcSuccess

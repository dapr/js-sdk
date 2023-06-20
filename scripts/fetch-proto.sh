#!/bin/bash
OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
ORG_NAME="dapr"
REPO_NAME="dapr"
BRANCH_NAME="v1.11.0"

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

# Check if protoc is available
prerequisiteCheckProtobuf() {
    if ! type "protoc" > /dev/null; then
        echo "protoc is not installed, trying to install"
        sudo apt update
        sudo apt install -y protobuf-compiler
        protoc --version

        prerequisiteCheckProtobuf
    else
        echo "protoc ($(protoc --version)) installed"
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

    # Note: we specify --proto_path to show where we should start searching from. If we use import it will start from this path
    # this is why PATH_PROTO != PATH_PROTO_DAPR; PATH_PROTO_DAPR is where we save our proto files while the other is the namespace
    protoc \
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
prerequisiteCheckProtobuf
prerequisiteCheckHttpRequestCLI
prerequisiteInstallGrpcTools

echo ""
echo "Removing old proto files"
rm -rf "$PATH_ROOT/src/proto"
mkdir -p "$PATH_ROOT/src/proto"

echo ""
echo "Downloading latest Dapr gRPC files from $ORG_NAME/$REPO_NAME@$BRANCH_NAME"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/common/v1/common.proto" "$PATH_ROOT/src/proto/dapr/proto/common/v1/common.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/internals/v1/apiversion.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/apiversion.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/internals/v1/service_invocation.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/service_invocation.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/internals/v1/status.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/status.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/operator/v1/operator.proto" "$PATH_ROOT/src/proto/dapr/proto/operator/v1/operator.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/placement/v1/placement.proto" "$PATH_ROOT/src/proto/dapr/proto/placement/v1/placement.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/appcallback.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/appcallback.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/dapr.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/dapr.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/sentry/v1/sentry.proto" "$PATH_ROOT/src/proto/dapr/proto/sentry/v1/sentry.proto"

echo ""
echo "Downloading latest Google Protobuf gRPC files"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/any.proto" "$PATH_ROOT/src/proto/google/protobuf/any.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/empty.proto" "$PATH_ROOT/src/proto/google/protobuf/empty.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/timestamp.proto" "$PATH_ROOT/src/proto/google/protobuf/timestamp.proto"

echo ""
echo "Compiling gRPC files"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/common/v1/common.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/apiversion.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/service_invocation.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/status.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/operator/v1/operator.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/placement/v1/placement.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/appcallback.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/dapr.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/sentry/v1/sentry.proto"

generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/any.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/empty.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/timestamp.proto"


echo ""
echo "DONE"

#cleanup

generateGrpcSuccess
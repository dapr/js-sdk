#!/bin/bash
OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Proto buf generation
APPCALLBACK="appcallback"
COMMON="common"
DAPR="dapr"
RUNTIME="runtime"
GOOGLE_ANY="runtime"

# Path to store output
PATH_ROOT=$(pwd)
# PATH_PROTO="$PATH_ROOT/src/grpc"
# PATH_PROTO_DAPR="$PATH_PROTO/dapr/proto"
# SRC="./src/grpc"

# Http request CLI
HTTP_REQUEST_CLI=curl

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

echo "Checking Dependencies"
prerequisiteCheckProtobuf
prerequisiteCheckHttpRequestCLI

echo ""
echo "Removing old Proto Files"
rm -rf "$PATH_ROOT/src/proto"
mkdir -p "$PATH_ROOT/src/proto"

echo ""
echo "Downloading latest Dapr gRPC files"
downloadFile "https://raw.githubusercontent.com/dapr/dapr/master/dapr/proto/common/v1/common.proto" "$PATH_ROOT/src/proto/dapr/proto/common/v1/common.proto"
downloadFile "https://raw.githubusercontent.com/dapr/dapr/master/dapr/proto/runtime/v1/appcallback.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/appcallback.proto"
downloadFile "https://raw.githubusercontent.com/dapr/dapr/master/dapr/proto/runtime/v1/dapr.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/dapr.proto"

echo ""
echo "Downloading latest Google Protobuf gRPC files"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/any.proto" "$PATH_ROOT/src/proto/google/protobuf/any.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/google/protobuf/empty.proto" "$PATH_ROOT/src/proto/google/protobuf/empty.proto"

echo ""
echo "Compiling gRPC files"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/common/v1/common.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/dapr.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/appcallback.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/any.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/empty.proto"

echo ""
echo "DONE"

#cleanup

generateGrpcSuccess
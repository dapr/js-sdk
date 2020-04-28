#!/bin/bash

# ------------------------------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------------------------------


# Tool chain installation

OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

npm install grpc-tools --save-dev

npm install protoc-plugin --save-dev
#npm install grpc_tools_node_protoc_plugin --save-dev
npm install ts-protoc-gen --save-dev

#npm install grpc_tools_node_protoc_ts --save-dev

# Proto buf generation

COMMON="common"
DAPR="dapr"
DAPR_CLIENT="daprclient"

# Path to store output
PROTO_PATH="src/dapr/proto"
SRC=src

# Http request CLI
HTTP_REQUEST_CLI=curl


checkHttpRequestCLI() {
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

    FILE_NAME=$1
    FILE_PATH="${PROTO_PATH}/${FILE_NAME}/v1"

    # URL for proto file
    PROTO_URL="https://raw.githubusercontent.com/dapr/dapr/master/dapr/proto/${FILE_NAME}/v1/${FILE_NAME}.proto"

    mkdir -p "${FILE_PATH}"

    echo "Downloading $PROTO_URL ..."
    if [ "$HTTP_REQUEST_CLI" == "curl" ]; then
        cd ${FILE_PATH}
        curl -SsL "$PROTO_URL" -o "${FILE_NAME}.proto"
        cd ../../../../..
    else
        wget -q -P "$PROTO_URL" "${FILE_PATH}/${FILE_NAME}.proto"
    fi

    if [ ! -e "${FILE_PATH}/${FILE_NAME}.proto" ]; then
        echo "failed to download $PROTO_URL ..."
        ret_val=$FILE_NAME
        exit 1
    fi
}

generateGrpc() {

    FILE_NAME=$1
    FILE_PATH="${PROTO_PATH}/${FILE_NAME}/v1"


    #node_modules/grpc-tools/bin/protoc -I=$SRC --js_out=import_style=commonjs,binary:$SRC --grpc_out=$SRC --plugin=protoc-gen-grpc=node_modules/grpc-tools/bin/grpc_node_plugin ${FILE_PATH}/${FILE_NAME}.proto
    #node_modules/grpc-tools/bin/protoc -I=$SRC --ts_out=$SRC --plugin=protoc-gen-ts=node_modules/grpc_tools_node_protoc_ts/bin/protoc-gen-ts ${FILE_PATH}/${FILE_NAME}.proto

    node_modules/grpc-tools/bin/protoc \
    -I=${SRC} \
    --plugin="protoc-gen-ts=node_modules/ts-protoc-gen/bin/protoc-gen-ts" \
    --plugin=protoc-gen-grpc=node_modules/grpc-tools/bin/grpc_node_plugin \
    --js_out="import_style=commonjs,binary:${SRC}" \
    --ts_out="${SRC}" \
    --grpc_out="${SRC}" \
     ${FILE_PATH}/${FILE_NAME}.proto

    if [ ! -e "${FILE_PATH}/${FILE_NAME}_pb.js" ]; then
        echo "failed to generate proto buf ${FILE_PATH}/${FILE_NAME}_pb.js"
        ret_val=$FILE_NAME
        exit 1
    fi
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
    find $PROTO_PATH -type f -name '*.proto' -delete
    rm -rf protoc
    rm -f protoc.zip
}

generateGrpcSuccess() {
    echo -e "\ngRPC interface and proto buf generated successfully!"
}

# -----------------------------------------------------------------------------
# main
# -----------------------------------------------------------------------------
trap "fail_trap" EXIT

checkHttpRequestCLI
downloadFile $COMMON
generateGrpc $COMMON
downloadFile $DAPR
generateGrpc $DAPR
downloadFile $DAPR_CLIENT
generateGrpc $DAPR_CLIENT
cleanup

generateGrpcSuccess

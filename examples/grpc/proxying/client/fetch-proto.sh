#!/bin/bash
OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Path to store output
PATH_ROOT=$(pwd)

echo $PATH_ROOT

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

    npx grpc_tools_node_protoc \
        --proto_path="${PATH_PROTO}" \
        --js_out="import_style=commonjs,binary:$PATH_PROTO" \
        --ts_out="grpc_js:$PATH_PROTO" \
        --grpc_out=grpc_js:$PATH_PROTO \
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
echo "Downloading latest gRPC files"
downloadFile "https://raw.githubusercontent.com/grpc/grpc-go/master/examples/helloworld/helloworld/helloworld.proto" "$PATH_ROOT/src/proto/helloworld/helloworld.proto"

echo ""
echo "Compiling gRPC files"
generateGrpc "$PATH_ROOT/src/proto" "helloworld/helloworld.proto"

echo ""
echo "DONE"

#cleanup

generateGrpcSuccess
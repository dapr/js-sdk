#!/bin/bash
OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
ORG_NAME="dapr"
REPO_NAME="dapr"
BRANCH_NAME="v1.17.0-rc.1"

# Path to store output
PATH_ROOT=$(pwd)

# HTTP request CLI
HTTP_REQUEST_CLI=curl

# Verify gRPC tools are installed (now in devDependencies)
prerequisiteInstallGrpcTools() {
    echo "Checking gRPC tools..."
    if [ ! -f "${PATH_ROOT}/node_modules/.bin/grpc_tools_node_protoc_plugin" ]; then
        echo "grpc-tools not found. Run 'npm install' first."
        exit 1
    fi
    if [ ! -f "${PATH_ROOT}/node_modules/.bin/protoc-gen-js" ]; then
        echo "protoc-gen-js not found. Run 'npm install' first."
        exit 1
    fi
    echo "gRPC tools found in node_modules"
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
    mkdir -p "$(dirname "$DST")"

    # Download the file
    echo "[$HTTP_REQUEST_CLI] Downloading $1 ..."
    if [ "$HTTP_REQUEST_CLI" == "curl" ]; then
        curl -SsL --fail "$SRC" -o "$DST" || { echo "ERROR: Failed to download $SRC"; exit 1; }
    else
        wget -q -P "$SRC" "$DST"
    fi
    echo "[$HTTP_REQUEST_CLI] Saved to $DST"
}

generateGrpc() {
    PATH_PROTO=$1
    PATH_FILE=$2

    echo "[protoc] Generating RPC for $PATH_PROTO/$PATH_FILE"

    # All plugins installed via npm (see package.json devDependencies)
    PROTOC_GEN_JS_PATH="${PATH_ROOT}/node_modules/.bin/protoc-gen-js"
    PROTOC_GEN_TS_PATH="${PATH_ROOT}/node_modules/.bin/protoc-gen-ts"
    PROTOC_GEN_GRPC_PATH="${PATH_ROOT}/node_modules/.bin/grpc_tools_node_protoc_plugin"

    protoc \
        --proto_path="${PATH_PROTO}" \
        --plugin="protoc-gen-js=${PROTOC_GEN_JS_PATH}" \
        --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
        --plugin="protoc-gen-grpc=${PROTOC_GEN_GRPC_PATH}" \
        --js_out="import_style=commonjs,binary:${PATH_PROTO}" \
        --ts_out="grpc_js:${PATH_PROTO}" \
        --grpc_out="grpc_js:${PATH_PROTO}" \
        "${PATH_PROTO}/${PATH_FILE}"
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

# Common types
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/common/v1/common.proto" "$PATH_ROOT/src/proto/dapr/proto/common/v1/common.proto"

# Internal types
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/internals/v1/apiversion.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/apiversion.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/internals/v1/reminders.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/reminders.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/internals/v1/service_invocation.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/service_invocation.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/internals/v1/status.proto" "$PATH_ROOT/src/proto/dapr/proto/internals/v1/status.proto"

# Operator, placement, sentry
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/operator/v1/operator.proto" "$PATH_ROOT/src/proto/dapr/proto/operator/v1/operator.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/placement/v1/placement.proto" "$PATH_ROOT/src/proto/dapr/proto/placement/v1/placement.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/sentry/v1/sentry.proto" "$PATH_ROOT/src/proto/dapr/proto/sentry/v1/sentry.proto"

# Runtime v1 — main service definitions
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/dapr.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/dapr.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/appcallback.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/appcallback.proto"

# Runtime v1 — building block message types (split out in v1.17)
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/actors.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/actors.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/ai.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/ai.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/binding.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/binding.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/configuration.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/configuration.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/crypto.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/crypto.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/invoke.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/invoke.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/jobs.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/jobs.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/lock.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/lock.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/metadata.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/metadata.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/pubsub.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/pubsub.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/secret.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/secret.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/state.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/state.proto"
downloadFile "https://raw.githubusercontent.com/$ORG_NAME/$REPO_NAME/$BRANCH_NAME/dapr/proto/runtime/v1/workflow.proto" "$PATH_ROOT/src/proto/dapr/proto/runtime/v1/workflow.proto"

echo ""
echo "Downloading latest Google Protobuf gRPC files"
# Pin to v28.3 tag for reproducibility (previously used floating master)
PROTOBUF_TAG="v28.3"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/$PROTOBUF_TAG/src/google/protobuf/any.proto" "$PATH_ROOT/src/proto/google/protobuf/any.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/$PROTOBUF_TAG/src/google/protobuf/empty.proto" "$PATH_ROOT/src/proto/google/protobuf/empty.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/$PROTOBUF_TAG/src/google/protobuf/timestamp.proto" "$PATH_ROOT/src/proto/google/protobuf/timestamp.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/$PROTOBUF_TAG/src/google/protobuf/struct.proto" "$PATH_ROOT/src/proto/google/protobuf/struct.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/$PROTOBUF_TAG/src/google/protobuf/duration.proto" "$PATH_ROOT/src/proto/google/protobuf/duration.proto"
downloadFile "https://raw.githubusercontent.com/protocolbuffers/protobuf/$PROTOBUF_TAG/src/google/protobuf/wrappers.proto" "$PATH_ROOT/src/proto/google/protobuf/wrappers.proto"

echo ""
echo "Compiling gRPC files"

# Common
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/common/v1/common.proto"

# Internals (reminders.proto must precede service_invocation.proto)
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/apiversion.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/reminders.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/service_invocation.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/internals/v1/status.proto"

# Operator, placement, sentry
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/operator/v1/operator.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/placement/v1/placement.proto"
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/sentry/v1/sentry.proto"

# Runtime v1 — appcallback.proto first (pubsub.proto imports it)
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/appcallback.proto"

# Runtime v1 — building block message types
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

# Runtime v1 — main service definition (depends on all the above)
generateGrpc "$PATH_ROOT/src/proto" "dapr/proto/runtime/v1/dapr.proto"

# Google well-known types
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/any.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/empty.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/timestamp.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/struct.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/duration.proto"
generateGrpc "$PATH_ROOT/src/proto" "google/protobuf/wrappers.proto"


echo ""
echo "DONE"

#cleanup

generateGrpcSuccess

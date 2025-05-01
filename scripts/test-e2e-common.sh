#!/usr/bin/env bash
#
# Copyright 2023 The Dapr Authors
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Usage: ./scripts/test-e2e-common.sh [testIdentifier] [--debug]
# testIdentifier: The test identifier to run. If not specified, all tests will be run. Possible values: "client" and "server".
# --debug: If passed, Dapr logs will be output to a file.
# Flag should always be the last argument.

TEST_DAPR_HTTP_PORT=3500
TEST_DAPR_GRPC_PORT=50000
TEST_SERVER_HTTP_PORT=3501
TEST_SERVER_GRPC_PORT=50001

GRPC_OUTPUT_FILE="/dev/null"
HTTP_OUTPUT_FILE="/dev/null"
# If --debug is passed, output Dapr logs to a file.
if [[ "$@" =~ "--debug" ]]; then
  GRPC_OUTPUT_FILE="dapr-grpc.log"
  HTTP_OUTPUT_FILE="dapr-http.log"
fi

testIdentifier=$1
if [ -z "$testIdentifier" ] || [[ "$testIdentifier" =~ "--debug" ]]; then
  testIdentifier="*"
fi
testMatchPattern="test/e2e/common/$testIdentifier.*.test.ts"

echo "[SCRIPT] Running tests matching pattern: $testMatchPattern"
echo "[SCRIPT] Outputting Dapr logs to $GRPC_OUTPUT_FILE (gRPC) and $HTTP_OUTPUT_FILE (HTTP)"

# Stop on first error in execution
set -e

stop_dapr() {
  echo "[SCRIPT] Stopping Dapr instances..."
  dapr stop --app-id test-suite-grpc
  dapr stop --app-id test-suite-http
}

trap stop_dapr ERR

npm run prebuild

echo "[SCRIPT] Starting Dapr instances..."

# Run Dapr with gRPC
dapr run --app-id test-suite-grpc --app-protocol grpc --app-port $TEST_SERVER_GRPC_PORT\
 --dapr-grpc-port $TEST_DAPR_GRPC_PORT --components-path ./test/components/common > $GRPC_OUTPUT_FILE 2>&1 &

# Run Dapr with HTTP
dapr run --app-id test-suite-http --app-protocol http --app-port $TEST_SERVER_HTTP_PORT\
 --dapr-http-port $TEST_DAPR_HTTP_PORT --components-path ./test/components/common > $HTTP_OUTPUT_FILE 2>&1 &

echo "[SCRIPT] Starting tests..."

# Run tests 
npm run test:e2e "$testMatchPattern"

# Stop Dapr instances
stop_dapr
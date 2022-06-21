#!/usr/bin/env bash
#
# Copyright 2022 The Dapr Authors
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Stop on first error in execution 
set -e

echo "====================================================="
echo "==================== Dapr JS SDK ===================="
echo "====================================================="
echo "Executing in $(pwd)"
echo "Description: Build the package in build/"
echo "====================================================="

echo "Installing Dependencies"
npm install > /dev/null

# Prepare build
echo "Preparing Build"
rm -rf build/
mkdir build/

# @todo: gRPC binding pulling and building?
# echo ""
# echo "Building Protobuf"
# ./build-grpc.sh

# Build Package
echo "Building Library"
npm run lint
npx tsc --outDir ./build/

# Prepare Publish
echo "Preparing Publish"
cp package.json build/
cp README.md build/

# Copy Proto Files
cp -R ./src/proto ./build

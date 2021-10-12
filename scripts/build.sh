#!/bin/bash
echo "====================================================="
echo "==================== Dapr JS SDK ===================="
echo "====================================================="
echo "Executing in $(pwd)"
echo "Description: Build the package in build/"
echo "====================================================="

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
npm install > /dev/null
npm run lint > /dev/null
tsc --outDir ./build/ > /dev/null

# Prepare Publish
echo "Preparing Publish"
cp package.json build/
cp README.md build/

# Copy Proto Files
cp -R ./src/proto/ ./build
#!/bin/bash

# Stop on first errror in execustion 
set -e

echo "====================================================="
echo "==================== Dapr JS SDK ===================="
echo "====================================================="
echo "Executing in $(pwd)"
echo "Description: Build the package in build/"
echo "====================================================="

echo "Installing Dependencies"
echo "Note: if EEXIST: file already exists on tsc, run `npm uninstall -g tsc`"
npm install -g typescript
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
tsc --outDir ./build/

# Prepare Publish
echo "Preparing Publish"
cp package.json build/
cp README.md build/

# Copy Proto Files
cp -R ./src/proto ./build

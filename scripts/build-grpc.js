#!/usr/bin/env node
/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const os = require('os');

/**
 * Cross-platform gRPC build script for Dapr JS SDK
 * Replaces build-grpc.sh with a Node.js implementation that works on all platforms
 * Downloads proto files and generates gRPC bindings
 */

// Proto files to download and compile
const PROTO_FILES = [
  'dapr/proto/common/v1/common.proto',
  'dapr/proto/runtime/v1/appcallback.proto',
  'dapr/proto/runtime/v1/dapr.proto'
];

const GOOGLE_PROTO_FILES = [
  'google/protobuf/any.proto',
  'google/protobuf/empty.proto'
];

async function main() {
  try {
    console.log('=======================================================');
    console.log('============= Dapr JS SDK gRPC Builder ===============');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log('Description: Download proto files and generate gRPC bindings');
    console.log('=======================================================');

    // Ensure we're in the project root
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);

    console.log('Checking Dependencies');
    await checkDependencies();

    console.log('');
    console.log('Removing old Proto Files');
    const protoDir = path.join(projectRoot, 'src', 'proto');
    await fs.remove(protoDir);
    await fs.ensureDir(protoDir);

    console.log('');
    console.log('Downloading latest Dapr gRPC files');
    await downloadDaprProtoFiles(protoDir);

    console.log('');
    console.log('Downloading latest Google Protobuf gRPC files');
    await downloadGoogleProtoFiles(protoDir);

    console.log('');
    console.log('Compiling gRPC files');
    await compileProtoFiles(protoDir);

    console.log('');
    console.log('DONE');
    console.log('');
    console.log('gRPC interface and proto buf generated successfully!');

  } catch (error) {
    console.error('Failed to generate gRPC interface and proto buf:', error.message);
    process.exit(1);
  }
}

async function checkDependencies() {
  // Check for protoc
  await checkProtobuf();

  // Check for HTTP client
  checkHttpRequestCLI();
}

async function checkProtobuf() {
  try {
    const version = execSync('protoc --version', { encoding: 'utf8', stdio: 'pipe' });
    console.log(`protoc (${version.trim()}) installed`);
  } catch (error) {
    console.log('protoc is not installed, trying to install');

    if (process.platform === 'linux') {
      try {
        execSync('sudo apt update', { stdio: 'inherit' });
        execSync('sudo apt install -y protobuf-compiler', { stdio: 'inherit' });
        const version = execSync('protoc --version', { encoding: 'utf8' });
        console.log(`protoc (${version.trim()}) installed`);
      } catch (installError) {
        throw new Error('Failed to install protoc. Please install Protocol Buffers compiler manually.');
      }
    } else {
      throw new Error('protoc is not installed. Please install Protocol Buffers compiler for your platform.');
    }
  }
}

function checkHttpRequestCLI() {
  try {
    execSync('curl --version', { stdio: 'pipe' });
    return 'curl';
  } catch (error) {
    try {
      execSync('wget --version', { stdio: 'pipe' });
      return 'wget';
    } catch (error2) {
      throw new Error('Either curl or wget is required');
    }
  }
}

async function downloadDaprProtoFiles(protoDir) {
  for (const protoFile of PROTO_FILES) {
    const url = `https://raw.githubusercontent.com/dapr/dapr/master/${protoFile}`;
    const localPath = path.join(protoDir, protoFile);
    await downloadFile(url, localPath);
  }
}

async function downloadGoogleProtoFiles(protoDir) {
  for (const protoFile of GOOGLE_PROTO_FILES) {
    const url = `https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/${protoFile}`;
    const localPath = path.join(protoDir, protoFile);
    await downloadFile(url, localPath);
  }
}

async function downloadFile(url, localPath) {
  console.log(`[curl] Downloading ${url} ...`);

  // Ensure target directory exists
  await fs.ensureDir(path.dirname(localPath));

  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode === 200) {
        const writeStream = fs.createWriteStream(localPath);
        response.pipe(writeStream);

        writeStream.on('finish', () => {
          writeStream.close();
          console.log(`[curl] Saved to ${localPath}`);
          resolve();
        });

        writeStream.on('error', reject);
      } else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        downloadFile(response.headers.location, localPath).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage} for ${url}`));
      }
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Download timeout for ${url}`));
    });
  });
}

async function compileProtoFiles(protoDir) {
  const allFiles = [...PROTO_FILES, ...GOOGLE_PROTO_FILES];

  for (const protoFile of allFiles) {
    await generateGrpc(protoDir, protoFile);
  }
}

async function generateGrpc(protoPath, protoFile) {
  console.log(`[protoc] Generating RPC for ${protoPath}/${protoFile}`);

  const projectRoot = process.cwd();
  const protocGenTsPath = path.join(projectRoot, 'node_modules', '.bin', 'protoc-gen-ts');
  const protocGenGrpcPath = path.join(projectRoot, 'node_modules', '.bin', 'grpc_tools_node_protoc_plugin');

  // Adjust paths for Windows
  const protocGenTsCmd = process.platform === 'win32' ? `${protocGenTsPath}.cmd` : protocGenTsPath;
  const protocGenGrpcCmd = process.platform === 'win32' ? `${protocGenGrpcPath}.cmd` : protocGenGrpcPath;

  // Check if the required tools exist
  if (!await fs.pathExists(protocGenTsCmd) && !await fs.pathExists(protocGenTsPath)) {
    throw new Error('protoc-gen-ts not found. Please run: npm install grpc_tools_node_protoc_ts --save-dev');
  }
  if (!await fs.pathExists(protocGenGrpcCmd) && !await fs.pathExists(protocGenGrpcPath)) {
    throw new Error('grpc_tools_node_protoc_plugin not found. Please run: npm install grpc-tools --save-dev');
  }

  const protocArgs = [
    `--proto_path=${protoPath}`,
    `--plugin=protoc-gen-ts=${protocGenTsCmd}`,
    `--plugin=protoc-gen-grpc=${protocGenGrpcCmd}`,
    `--js_out=import_style=commonjs,binary:${protoPath}`,
    `--ts_out=grpc_js:${protoPath}`,
    `--grpc_out=grpc_js:${protoPath}`,
    path.join(protoPath, protoFile)
  ];

  try {
    execSync(`protoc ${protocArgs.join(' ')}`, {
      stdio: 'inherit',
      cwd: projectRoot
    });
  } catch (error) {
    throw new Error(`Failed to generate gRPC bindings for ${protoFile}: ${error.message}`);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
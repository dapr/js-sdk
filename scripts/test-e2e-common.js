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

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Cross-platform end-to-end common test runner for Dapr JS SDK
 * Replaces test-e2e-common.sh with a Node.js implementation that works on all platforms
 *
 * Usage: node test-e2e-common.js [testIdentifier] [--debug]
 * testIdentifier: The test identifier to run. If not specified, all tests will be run. Possible values: "client" and "server".
 * --debug: If passed, Dapr logs will be output to a file.
 * Flag should always be the last argument.
 */

// Configuration constants
const TEST_DAPR_HTTP_PORT = 3500;
const TEST_DAPR_GRPC_PORT = 50000;
const TEST_SERVER_HTTP_PORT = 3501;
const TEST_SERVER_GRPC_PORT = 50001;

let grpcProcess = null;
let httpProcess = null;

async function main() {
  try {
    console.log('=======================================================');
    console.log('========= Dapr JS SDK E2E Common Tests ===============');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log('Description: Running common end-to-end tests with Dapr instances');
    console.log('=======================================================');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const isDebug = args.includes('--debug');
    let testIdentifier = args.find(arg => !arg.startsWith('--')) || '*';

    // If the first arg is --debug and no test identifier, default to *
    if (testIdentifier === '--debug') {
      testIdentifier = '*';
    }

    const testMatchPattern = `test/e2e/common/${testIdentifier}.*.test.ts`;

    // Determine output files for Dapr logs
    const grpcOutputFile = isDebug ? 'dapr-grpc.log' : (process.platform === 'win32' ? 'nul' : '/dev/null');
    const httpOutputFile = isDebug ? 'dapr-http.log' : (process.platform === 'win32' ? 'nul' : '/dev/null');

    console.log(`[SCRIPT] Running tests matching pattern: ${testMatchPattern}`);
    console.log(`[SCRIPT] Outputting Dapr logs to ${grpcOutputFile} (gRPC) and ${httpOutputFile} (HTTP)`);

    // Ensure we're in the project root
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);

    // Set up cleanup handler
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

    try {
      // Run prebuild
      console.log('[SCRIPT] Running prebuild...');
      execSync('npm run prebuild', { stdio: 'inherit' });

      // Start Dapr instances
      console.log('[SCRIPT] Starting Dapr instances...');
      await startDaprInstances(grpcOutputFile, httpOutputFile);

      // Wait a moment for Dapr instances to fully start
      console.log('[SCRIPT] Waiting for Dapr instances to initialize...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Run tests
      console.log('[SCRIPT] Starting tests...');
      execSync(`npm run test:e2e "${testMatchPattern}"`, {
        stdio: 'inherit',
        cwd: projectRoot
      });

      console.log('=======================================================');
      console.log('Common E2E tests completed successfully!');
      console.log('=======================================================');

    } finally {
      // Stop Dapr instances
      await stopDapr();
    }

  } catch (error) {
    console.error('Common E2E tests failed:', error.message);
    await stopDapr();
    process.exit(1);
  }
}

async function startDaprInstances(grpcOutputFile, httpOutputFile) {
  const projectRoot = process.cwd();

  // Start Dapr with gRPC
  console.log('[SCRIPT] Starting Dapr gRPC instance...');
  const grpcArgs = [
    'run',
    '--app-id', 'test-suite-grpc',
    '--app-protocol', 'grpc',
    '--app-port', TEST_SERVER_GRPC_PORT.toString(),
    '--dapr-grpc-port', TEST_DAPR_GRPC_PORT.toString(),
    '--components-path', './test/components/common'
  ];

  grpcProcess = spawn('dapr', grpcArgs, {
    cwd: projectRoot,
    stdio: grpcOutputFile === '/dev/null' || grpcOutputFile === 'nul' ? 'ignore' : ['ignore', fs.openSync(grpcOutputFile, 'w'), fs.openSync(grpcOutputFile, 'w')],
    detached: false
  });

  // Start Dapr with HTTP
  console.log('[SCRIPT] Starting Dapr HTTP instance...');
  const httpArgs = [
    'run',
    '--app-id', 'test-suite-http',
    '--app-protocol', 'http',
    '--app-port', TEST_SERVER_HTTP_PORT.toString(),
    '--dapr-http-port', TEST_DAPR_HTTP_PORT.toString(),
    '--components-path', './test/components/common'
  ];

  httpProcess = spawn('dapr', httpArgs, {
    cwd: projectRoot,
    stdio: httpOutputFile === '/dev/null' || httpOutputFile === 'nul' ? 'ignore' : ['ignore', fs.openSync(httpOutputFile, 'w'), fs.openSync(httpOutputFile, 'w')],
    detached: false
  });
}

async function stopDapr() {
  console.log('[SCRIPT] Stopping Dapr instances...');

  try {
    // Try to stop via dapr CLI first
    try {
      execSync('dapr stop --app-id test-suite-grpc', { stdio: 'pipe' });
    } catch (error) {
      console.warn('Warning: Could not stop test-suite-grpc via CLI');
    }

    try {
      execSync('dapr stop --app-id test-suite-http', { stdio: 'pipe' });
    } catch (error) {
      console.warn('Warning: Could not stop test-suite-http via CLI');
    }
  } catch (error) {
    console.warn('Warning: Error stopping Dapr instances via CLI');
  }

  // Kill spawned processes if they exist
  if (grpcProcess && !grpcProcess.killed) {
    try {
      grpcProcess.kill('SIGTERM');
    } catch (error) {
      console.warn('Warning: Could not kill gRPC process');
    }
  }

  if (httpProcess && !httpProcess.killed) {
    try {
      httpProcess.kill('SIGTERM');
    } catch (error) {
      console.warn('Warning: Could not kill HTTP process');
    }
  }
}

function cleanup() {
  stopDapr().catch(() => {
    // Ignore cleanup errors
  });
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
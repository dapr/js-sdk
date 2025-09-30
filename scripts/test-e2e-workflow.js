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

const { execSync } = require('child_process');
const path = require('path');

/**
 * Cross-platform workflow end-to-end test runner for Dapr JS SDK
 * Replaces test-e2e-workflow.sh with a Node.js implementation that works on all platforms
 * Manages DurableTask sidecar container and runs workflow tests
 */

async function main() {
  try {
    console.log('=======================================================');
    console.log('========= Dapr JS SDK Workflow E2E Tests =============');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log('Description: Running workflow end-to-end tests with DurableTask sidecar');
    console.log('=======================================================');

    // Ensure we're in the project root
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);

    // Set up cleanup handler
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

    try {
      // Start the sidecar if it is not running yet
      await startSidecar();

      // Run workflow E2E tests
      console.log('Running workflow E2E tests');
      execSync('npm run test:e2e:workflow:internal', {
        stdio: 'inherit',
        cwd: projectRoot
      });

      console.log('=======================================================');
      console.log('Workflow E2E tests completed successfully!');
      console.log('=======================================================');

    } finally {
      // Stop sidecar
      await stopSidecar();
    }

  } catch (error) {
    console.error('Workflow E2E tests failed:', error.message);
    await stopSidecar();
    process.exit(1);
  }
}

async function startSidecar() {
  console.log('Checking DurableTask sidecar status...');

  // Check if container is already running
  try {
    const runningResult = execSync('docker ps -q -f name=durabletask-sidecar', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    if (runningResult.trim()) {
      console.log('DurableTask sidecar is already running');
      return;
    }
  } catch (error) {
    // Continue to check for exited containers
  }

  // Check for exited containers and clean them up
  try {
    const exitedResult = execSync('docker ps -aq -f status=exited -f name=durabletask-sidecar', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    if (exitedResult.trim()) {
      console.log('Removing exited DurableTask sidecar container...');
      execSync('docker rm durabletask-sidecar', { stdio: 'pipe' });
    }
  } catch (error) {
    // Continue to start new container
  }

  // Start the sidecar container
  console.log('Starting Sidecar');
  const dockerArgs = [
    'run',
    '--name', 'durabletask-sidecar',
    '-d',
    '--rm',
    '-p', '4001:4001',
    '--env', 'DURABLETASK_SIDECAR_LOGLEVEL=Debug',
    'cgillum/durabletask-sidecar:latest',
    'start',
    '--backend', 'Emulator'
  ];

  execSync(`docker ${dockerArgs.join(' ')}`, {
    stdio: 'inherit'
  });

  // Wait a moment for the sidecar to fully start
  console.log('Waiting for sidecar to initialize...');
  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function stopSidecar() {
  console.log('Stopping Sidecar');

  try {
    // Check if container exists and is running
    const runningResult = execSync('docker ps -q -f name=durabletask-sidecar', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    if (runningResult.trim()) {
      execSync('docker stop durabletask-sidecar', { stdio: 'pipe' });
      console.log('DurableTask sidecar stopped successfully');
    } else {
      console.log('DurableTask sidecar was not running');
    }
  } catch (error) {
    console.warn('Warning: Could not stop DurableTask sidecar:', error.message);
  }
}

function cleanup() {
  stopSidecar().catch(() => {
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
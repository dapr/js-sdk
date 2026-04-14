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
 * Cross-platform end-to-end test runner for Dapr JS SDK
 * Replaces test-e2e.sh with a Node.js implementation that works on all platforms
 */

async function main() {
  try {
    console.log('=======================================================');
    console.log('============== Dapr JS SDK E2E Tests =================');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log('Description: Running end-to-end tests (gRPC and HTTP)');
    console.log('=======================================================');

    // Ensure we're in the project root
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);

    // Run test initialization using Node.js version
    console.log('Initializing test environment...');
    execSync('node ./scripts/test-init.js', {
      stdio: 'inherit',
      cwd: projectRoot
    });

    // Start gRPC tests
    console.log('Running gRPC tests');
    execSync('npm run test:e2e:grpc', {
      stdio: 'inherit',
      cwd: projectRoot
    });

    // Start HTTP tests
    console.log('Running HTTP tests');
    execSync('npm run test:e2e:http', {
      stdio: 'inherit',
      cwd: projectRoot
    });

    console.log('=======================================================');
    console.log('All E2E tests completed successfully!');
    console.log('=======================================================');

  } catch (error) {
    console.error('E2E tests failed:', error.message);
    process.exit(1);
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
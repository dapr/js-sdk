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

/**
 * Cross-platform prebuild script for Dapr JS SDK
 * Replaces prebuild.sh with a Node.js implementation that works on all platforms
 */

async function main() {
  try {
    console.log('=======================================================');
    console.log('================= Dapr JS SDK Prebuild ===============');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log('Description: Preparing build environment and dependencies');
    console.log('=======================================================');

    // Ensure we're in the project root
    const projectRoot = path.resolve(__dirname, '..');
    const protoDir = path.join('dapr', 'proto');
    process.chdir(projectRoot);

    // Step 1: Ensure proto directory exists
    console.log('Ensuring proto directory structure...');
    await fs.ensureDir(protoDir);

    // Step 2: Check if proto files need to be fetched/updated
    console.log('Checking proto files...');
    const protoExists = await fs.pathExists(protoDir);

    if (!protoExists || (await fs.readdir(protoDir)).length === 0) {
      console.log('Proto files missing or empty, fetching...');
      await runScript('fetch-proto');
    }

    // Step 3: Build/update gRPC bindings if needed
    console.log('Checking gRPC bindings...');
    await execSync('npx buf generate');

    // // Step 4: Ensure TypeScript types are available
    // console.log('Verifying TypeScript compilation setup...');
    // try {
    //   execSync('npx tsc --noEmit --skipLibCheck', {
    //     stdio: 'pipe',
    //     cwd: projectRoot
    //   });
    //   console.log('TypeScript compilation check passed');
    // } catch (error) {
    //   console.warn('TypeScript compilation check failed, but continuing...');
    //   console.warn(error.message);
    // }
    //
    // console.log('=======================================================');
    // console.log('Prebuild completed successfully!');
    // console.log('=======================================================');

  } catch (error) {
    console.error('Prebuild failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run another script in the scripts directory
 */
async function runScript(scriptName) {
  const scriptPath = path.join(__dirname, `${scriptName}.sh`);
  const jsScriptPath = path.join(__dirname, `${scriptName}.js`);

  // Try to run Node.js version first, fall back to bash
  if (await fs.pathExists(jsScriptPath)) {
    console.log(`Running ${scriptName}.js...`);
    execSync(`node "${jsScriptPath}"`, { stdio: 'inherit' });
  } else if (await fs.pathExists(scriptPath)) {
    console.log(`Running ${scriptName}.sh...`);
    if (process.platform === 'win32') {
      // On Windows, try to run with bash (Git Bash, WSL, etc.)
      try {
        execSync(`bash "${scriptPath}"`, { stdio: 'inherit' });
      } catch (error) {
        console.warn(`Could not run ${scriptName}.sh on Windows. Consider converting it to Node.js.`);
        throw error;
      }
    } else {
      execSync(`bash "${scriptPath}"`, { stdio: 'inherit' });
    }
  } else {
    console.warn(`Script ${scriptName} not found, skipping...`);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { main };
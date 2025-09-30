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
 * Cross-platform build script for Dapr JS SDK
 * Replaces build.sh with a Node.js implementation that works on all platforms
 * Builds the TypeScript package and prepares it for publishing
 */
async function main() {
  try {
    console.log('=======================================================');
    console.log('==================== Dapr JS SDK ====================');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log('Description: Build the package in build/');
    console.log('=======================================================');

    // Ensure we're in the project root
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);

    // Prepare build
    console.log('Preparing Build');
    const buildDir = path.join(projectRoot, 'build');
    await fs.remove(buildDir);
    await fs.ensureDir(buildDir);

    // Optional: Build Protobuf (commented out in original script)
    // console.log('');
    // console.log('Building Protobuf');
    // await runScript('build-grpc');

    // Build Package
    console.log('Building Library');
    execSync('npx tsc --outDir ./build/', {
      stdio: 'inherit',
      cwd: projectRoot
    });

    // Prepare Publish
    console.log('Preparing Publish');

    // Copy package.json
    const packageJsonSrc = path.join(projectRoot, 'package.json');
    const packageJsonDest = path.join(buildDir, 'package.json');
    await fs.copy(packageJsonSrc, packageJsonDest);
    console.log('Copied package.json');

    // Copy README.md
    const readmeSrc = path.join(projectRoot, 'README.md');
    const readmeDest = path.join(buildDir, 'README.md');
    if (await fs.pathExists(readmeSrc)) {
      await fs.copy(readmeSrc, readmeDest);
      console.log('Copied README.md');
    } else {
      console.warn('README.md not found, skipping...');
    }

    // Copy Proto Files
    const protoSrc = path.join(projectRoot, 'src', 'proto');
    const protoDest = path.join(buildDir, 'proto');
    if (await fs.pathExists(protoSrc)) {
      await fs.copy(protoSrc, protoDest);
      console.log('Copied proto files');
    } else {
      console.warn('Proto files not found, skipping...');
    }

    console.log('=======================================================');
    console.log('Build completed successfully!');
    console.log(`Output directory: ${buildDir}`);
    console.log('=======================================================');

  } catch (error) {
    console.error('Build failed:', error.message);
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

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
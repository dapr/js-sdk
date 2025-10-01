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

/**
 * Cross-platform proto file fetching script for Dapr JS SDK
 * Downloads and extracts Dapr proto files from the official Dapr repository
 */

// Configuration
const DAPR_VERSION = process.env.DAPR_VERSION || 'v1.16.0'; // Default version, can be overridden
const DAPR_REPO_URL = 'https://raw.githubusercontent.com/dapr/dapr/';
const PROTO_BASE_PATH = 'dapr/proto';
const LOCAL_PROTO_DIR = path.join('dapr', 'proto');

// Proto files to download (commonly used Dapr proto files)
const PROTO_FILES = [
  'common/v1/common.proto',
  'runtime/v1/dapr.proto',
  'runtime/v1/appcallback.proto'
];

async function main() {
  try {
    console.log('=======================================================');
    console.log('============== Dapr JS SDK Proto Fetcher =============');
    console.log('=======================================================');
    console.log(`Executing in ${process.cwd()}`);
    console.log(`Dapr Version: ${DAPR_VERSION}`);
    console.log('Description: Fetch Dapr proto files from GitHub');
    console.log('=======================================================');

    // Ensure we're in the project root
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);

    // Clean and create proto directory
    console.log('Preparing proto directory...');
    await fs.remove(LOCAL_PROTO_DIR);
    await fs.ensureDir(LOCAL_PROTO_DIR);

    // Download individual files via GitHub API
    try {
      await fetchProtoViaHTTP();
      console.log('Successfully fetched proto files via HTTP');
    } catch (error) {
      console.error('All fetch methods failed');
      throw error;
    }

    console.log('=======================================================');
    console.log('Proto files fetched successfully!');
    console.log('=======================================================');

  } catch (error) {
    console.error('Proto fetch failed:', error.message);
    process.exit(1);
  }
}

/**
 * Fetch proto files via HTTP (fallback method)
 */
async function fetchProtoViaHTTP() {
  console.log('Fetching proto files via HTTP...');

  for (const protoFile of PROTO_FILES) {
    console.log(`Downloading ${protoFile}...`);

    const url = `${DAPR_REPO_URL}${DAPR_VERSION}/${PROTO_BASE_PATH}/${protoFile}`;
    const localPath = path.join(LOCAL_PROTO_DIR, protoFile);

    // Ensure directory exists
    await fs.ensureDir(path.dirname(localPath));

    // Download file
    await downloadFile(url, localPath);
  }
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url, localPath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode === 200) {
        const writeStream = fs.createWriteStream(localPath);
        response.pipe(writeStream);

        writeStream.on('finish', () => {
          writeStream.close();
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

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
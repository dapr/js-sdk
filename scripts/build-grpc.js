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

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const { execSync } = require("child_process");
const { main: fetchProto } = require("./fetch-proto");

async function main() {
  await fetchProto();
  execSync("npx --no-install buf generate", {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Failed to generate gRPC bindings:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { main };

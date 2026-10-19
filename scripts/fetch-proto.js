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
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

const DAPR_VERSION = "6801e6d54e908e0f7625e2a467d40359c3eb77d6";
const DURABLETASK_VERSION = "89e5df3ffbbac9ac043997b109718db2c2b182b6";

async function request(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "dapr-js-sdk-proto-fetcher" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
  }
  return response;
}

async function listProtoFiles(repo, version, selectPath) {
  const apiUrl = `https://api.github.com/repos/${repo}`;
  const commit = await (await request(`${apiUrl}/commits/${encodeURIComponent(version)}`)).json();
  const tree = await (await request(`${apiUrl}/git/trees/${commit.sha}?recursive=1`)).json();
  if (tree.truncated) {
    throw new Error("GitHub returned a truncated repository tree; no proto files were updated");
  }
  const files = tree.tree
    .filter((entry) => entry.type === "blob" && entry.path.endsWith(".proto") && selectPath(entry.path))
    .map((entry) => ({
      url: `https://raw.githubusercontent.com/${repo}/${commit.sha}/${entry.path}`,
      path: selectPath(entry.path),
    }));
  if (files.length === 0) {
    throw new Error(`No proto files found in ${repo} at ${commit.sha}`);
  }
  return files;
}

async function fetchProtoFiles(
  version = DAPR_VERSION,
  projectRoot = path.resolve(__dirname, ".."),
  durabletaskVersion = DURABLETASK_VERSION,
) {
  const daprFiles = await listProtoFiles("dapr/dapr", version, (file) =>
    file === "dapr/proto/common/v1/common.proto" || file.startsWith("dapr/proto/runtime/v1/") ? file : undefined,
  );
  const durabletaskFiles = await listProtoFiles("dapr/durabletask-protobuf", durabletaskVersion, (file) =>
    file.startsWith("protos/") ? `dapr/proto/durabletask/v1/${file.slice("protos/".length)}` : undefined,
  );
  const files = [...daprFiles, ...durabletaskFiles];
  const stagingDir = await fs.mkdtemp(path.join(os.tmpdir(), "dapr-proto-"));
  try {
    for (const file of files) {
      const response = await request(file.url);
      const localPath = path.join(stagingDir, file.path);
      await fs.ensureDir(path.dirname(localPath));
      let content = await response.text();
      if (file.path.startsWith("dapr/proto/durabletask/")) {
        content = content.replace(/import "([^"/]+\.proto)";/g, 'import "dapr/proto/durabletask/v1/$1";');
      }
      await fs.writeFile(localPath, content);
    }
    for (const destination of [projectRoot, path.join(projectRoot, "src", "proto")]) {
      await fs.copy(path.join(stagingDir, "dapr", "proto"), path.join(destination, "dapr", "proto"));
    }
  } finally {
    await fs.remove(stagingDir);
  }
  console.log(`Updated ${daprFiles.length} common/runtime protos and ${durabletaskFiles.length} durabletask protos`);
}

async function main() {
  await fetchProtoFiles(
    process.env.DAPR_VERSION || DAPR_VERSION,
    path.resolve(__dirname, ".."),
    process.env.DURABLETASK_VERSION || DURABLETASK_VERSION,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Proto fetch failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { main, fetchProtoFiles };

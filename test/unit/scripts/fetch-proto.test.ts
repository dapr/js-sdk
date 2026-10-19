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

import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchProtoFiles } = require("../../../scripts/fetch-proto");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs-extra");

jest.mock("fs-extra", () => ({
  mkdtemp: jest.fn(),
  ensureDir: jest.fn(),
  writeFile: jest.fn(),
  copy: jest.fn(),
  remove: jest.fn(),
}));

describe("proto fetching", () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const projectRoot = path.resolve("proto-test-project");
  const stagingDir = path.resolve("proto-test-staging");
  const entry = (file: string) => ({ type: "blob", path: file });
  const json = (value: unknown) => new Response(JSON.stringify(value));

  beforeEach(() => {
    jest.clearAllMocks();
    fs.mkdtemp.mockResolvedValue(stagingDir);
    fetchMock = jest.spyOn(global, "fetch");
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockRepositories() {
    fetchMock
      .mockResolvedValueOnce(json({ sha: "dapr-sha" }))
      .mockResolvedValueOnce(
        json({
          tree: [
            entry("dapr/proto/common/v1/common.proto"),
            entry("dapr/proto/runtime/v1/dapr.proto"),
            entry("dapr/proto/runtime/v1/binarystore.proto"),
            entry("dapr/proto/internals/v1/status.proto"),
            entry("dapr/proto/components/v1/common.proto"),
            entry("dapr/proto/operator/v1/operator.proto"),
            entry("dapr/proto/placement/v1/placement.proto"),
            entry("dapr/proto/scheduler/v1/scheduler.proto"),
            entry("dapr/proto/sentry/v1/sentry.proto"),
            entry("dapr/proto/workflows/v1/mcp.proto"),
            entry("dapr/proto/runtime/v1/README.md"),
          ],
        }),
      )
      .mockResolvedValueOnce(json({ sha: "durabletask-sha" }))
      .mockResolvedValueOnce(json({ tree: [entry("protos/orchestration.proto"), entry("README.md")] }));
  }

  it("fetches only common, external runtime, and durabletask protos into both source locations", async () => {
    mockRepositories();
    fetchMock.mockImplementation(
      async () => new Response('import "orchestration.proto";\nimport "google/protobuf/any.proto";'),
    );

    await fetchProtoFiles("master", projectRoot, "main");

    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(fetchMock.mock.calls.slice(4).map(([url]) => url)).toEqual([
      "https://raw.githubusercontent.com/dapr/dapr/dapr-sha/dapr/proto/common/v1/common.proto",
      "https://raw.githubusercontent.com/dapr/dapr/dapr-sha/dapr/proto/runtime/v1/dapr.proto",
      "https://raw.githubusercontent.com/dapr/dapr/dapr-sha/dapr/proto/runtime/v1/binarystore.proto",
      "https://raw.githubusercontent.com/dapr/durabletask-protobuf/durabletask-sha/protos/orchestration.proto",
    ]);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(stagingDir, "dapr", "proto", "durabletask", "v1", "orchestration.proto"),
      'import "dapr/proto/durabletask/v1/orchestration.proto";\nimport "google/protobuf/any.proto";',
    );
    expect(fs.copy.mock.calls).toEqual([
      [path.join(stagingDir, "dapr", "proto"), path.join(projectRoot, "dapr", "proto")],
      [path.join(stagingDir, "dapr", "proto"), path.join(projectRoot, "src", "proto", "dapr", "proto")],
    ]);
    expect(fs.remove).toHaveBeenCalledWith(stagingDir);
  });

  it("rejects truncated trees without changing local protos", async () => {
    fetchMock.mockResolvedValueOnce(json({ sha: "sha" })).mockResolvedValueOnce(json({ truncated: true }));
    await expect(fetchProtoFiles("master", projectRoot)).rejects.toThrow("truncated");
    expect(fs.copy).not.toHaveBeenCalled();
    expect(fs.mkdtemp).not.toHaveBeenCalled();
  });

  it("rejects empty selections without changing local protos", async () => {
    fetchMock.mockResolvedValueOnce(json({ sha: "sha" })).mockResolvedValueOnce(json({ tree: [] }));
    await expect(fetchProtoFiles("master", projectRoot)).rejects.toThrow("No proto files");
    expect(fs.copy).not.toHaveBeenCalled();
  });

  it("reports failed downloads and cleans staging without copying partial results", async () => {
    mockRepositories();
    fetchMock.mockResolvedValueOnce(new Response("Not Found", { status: 404 }));
    await expect(fetchProtoFiles("master", projectRoot)).rejects.toThrow("HTTP 404");
    expect(fs.copy).not.toHaveBeenCalled();
    expect(fs.remove).toHaveBeenCalledWith(stagingDir);
  });
});

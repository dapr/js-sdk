/*
Copyright 2026 The Dapr Authors
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

import HTTPClient from "../../../../src/implementation/Client/HTTPClient/HTTPClient";
import HTTPClientMetadata from "../../../../src/implementation/Client/HTTPClient/metadata";

describe("http/metadata", () => {
  const getMetadata = () => {
    const client = new HTTPClient({ daprHost: "", daprPort: "", communicationProtocol: 0 });
    const execute = jest.spyOn(client, "execute").mockResolvedValue({ runtimeVersion: "1.17.0" });
    return { metadata: new HTTPClientMetadata(client), execute };
  };

  describe("getBulkPublishApiVersion", () => {
    it.each([
      ["1.16.12", "v1.0-alpha1"],
      ["1.9.0", "v1.0-alpha1"],
      ["0.17.0", "v1.0-alpha1"],
      ["1.17.0", "v1.0"],
      ["1.18.0", "v1.0"],
      ["2.0.0", "v1.0"],
      ["v1.17.0-rc.1", "v1.0"],
      ["1.16.12+build.1", "v1.0-alpha1"],
      ["  V1.17  ", "v1.0"],
      ["edge", "v1.0"],
      [" EDGE ", "v1.0"],
    ])("selects %s's bulk publish endpoint as %s", async (runtimeVersion, apiVersion) => {
      const { metadata, execute } = getMetadata();
      execute.mockResolvedValue({ runtimeVersion });

      await expect(metadata.getBulkPublishApiVersion()).resolves.toBe(apiVersion);
      expect(execute).toHaveBeenCalledWith("/metadata");
    });

    it.each([undefined, "", "latest", "development", "edge-unknown", "1", "invalid"])(
      "rejects unknown runtime version '%s' and retries the lookup",
      async (runtimeVersion) => {
        const { metadata, execute } = getMetadata();
        execute.mockResolvedValueOnce({ runtimeVersion });

        await expect(metadata.getBulkPublishApiVersion()).rejects.toThrow(
          `Unable to determine Dapr runtime version from metadata: '${runtimeVersion ?? ""}'.`,
        );
        await expect(metadata.getBulkPublishApiVersion()).resolves.toBe("v1.0");
        expect(execute).toHaveBeenCalledTimes(2);
      },
    );

    it("shares an in-flight lookup and caches successful results", async () => {
      const { metadata, execute } = getMetadata();
      let resolveMetadata!: (response: object) => void;
      execute.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveMetadata = resolve;
          }),
      );

      const first = metadata.getBulkPublishApiVersion();
      expect(metadata.getBulkPublishApiVersion()).toBe(first);
      expect(execute).toHaveBeenCalledTimes(1);

      resolveMetadata({ runtimeVersion: "1.16.12" });
      await expect(first).resolves.toBe("v1.0-alpha1");
      await expect(metadata.getBulkPublishApiVersion()).resolves.toBe("v1.0-alpha1");
      expect(execute).toHaveBeenCalledTimes(1);
    });

    it("propagates request failures to all callers and retries on the next call", async () => {
      const { metadata, execute } = getMetadata();
      const error = new Error("Metadata unavailable");
      execute.mockRejectedValueOnce(error);

      const results = await Promise.allSettled([
        metadata.getBulkPublishApiVersion(),
        metadata.getBulkPublishApiVersion(),
      ]);
      expect(results).toEqual([
        { status: "rejected", reason: error },
        { status: "rejected", reason: error },
      ]);
      expect(execute).toHaveBeenCalledTimes(1);

      await expect(metadata.getBulkPublishApiVersion()).resolves.toBe("v1.0");
      expect(execute).toHaveBeenCalledTimes(2);
    });

    it("does not share cached versions between sidecars", async () => {
      const first = getMetadata();
      const second = getMetadata();
      second.execute.mockResolvedValue({ runtimeVersion: "1.16.12" });

      await expect(first.metadata.getBulkPublishApiVersion()).resolves.toBe("v1.0");
      await expect(second.metadata.getBulkPublishApiVersion()).resolves.toBe("v1.0-alpha1");
    });
  });

  it.each([
    ["1.16.0", "v1.0-alpha1", "v1.0-alpha1"],
    ["1.17.0", "v1.0", "v1.0-alpha1"],
    ["1.17.0-rc.1", "v1.0", "v1.0-alpha1"],
    ["1.18.0-rc.1", "v1.0", "v1.0-alpha1"],
    ["1.18.0", "v1.0", "v1.0"],
    ["edge", "v1.0", "v1.0"],
  ])("keeps bulk publish and Jobs decisions independent on %s", async (runtimeVersion, bulkVersion, jobsVersion) => {
    const { metadata, execute } = getMetadata();
    execute.mockResolvedValue({ runtimeVersion });

    const bulk = metadata.getBulkPublishApiVersion();
    const jobs = metadata.getJobsApiVersion();
    expect(metadata.getBulkPublishApiVersion()).toBe(bulk);
    expect(metadata.getJobsApiVersion()).toBe(jobs);
    await expect(bulk).resolves.toBe(bulkVersion);
    await expect(jobs).resolves.toBe(jobsVersion);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("retries a failed Jobs check without invalidating a successful bulk publish decision", async () => {
    const { metadata, execute } = getMetadata();
    execute.mockResolvedValue({ runtimeVersion: "1.15.0" });
    const bulk = metadata.getBulkPublishApiVersion();
    await expect(bulk).resolves.toBe("v1.0-alpha1");
    await expect(metadata.getJobsApiVersion()).rejects.toThrow("requires Dapr runtime 1.16");

    execute.mockResolvedValue({ runtimeVersion: "1.16.0" });
    await expect(metadata.getJobsApiVersion()).resolves.toBe("v1.0-alpha1");
    expect(metadata.getBulkPublishApiVersion()).toBe(bulk);
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it("keeps get() fresh and preserves edge as the reported runtime version", async () => {
    const { metadata, execute } = getMetadata();
    execute.mockResolvedValue({ runtimeVersion: "edge" });
    await metadata.getBulkPublishApiVersion();
    await metadata.getJobsApiVersion();
    await expect(metadata.get()).resolves.toEqual({ runtimeVersion: "edge" });

    execute.mockResolvedValue({ runtimeVersion: "edge", extended: { updated: "true" } });
    await expect(metadata.get()).resolves.toEqual({ runtimeVersion: "edge", extended: { updated: "true" } });
    expect(execute).toHaveBeenCalledTimes(4);
  });
});

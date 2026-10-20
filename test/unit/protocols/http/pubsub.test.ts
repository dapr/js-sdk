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
import HTTPClientPubSub from "../../../../src/implementation/Client/HTTPClient/pubsub";

const httpError = (status: number, errorMsg = "") =>
  new Error(JSON.stringify({ error: "Not Found", error_msg: errorMsg, status }));

// Lets every pending publish run up to its first round trip to the sidecar.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe("http/pubsub", () => {
  const messages = [{ hello: "world" }, { hello: "world 2" }];

  const getPubSub = () => {
    const client = new HTTPClient({
      daprHost: "",
      daprPort: "",
      communicationProtocol: 0,
    });
    const executeMetadata = jest.spyOn(client, "execute").mockResolvedValue({ runtimeVersion: "1.17.0" });
    const execute = jest.spyOn(client, "executeWithApiVersion");
    return { pubsub: new HTTPClientPubSub(client), execute, executeMetadata };
  };

  const publishConcurrently = (pubsub: HTTPClientPubSub, count = 3) =>
    Promise.all(Array.from({ length: count }, () => pubsub.publishBulk("my-pubsub", "my-topic", messages)));

  describe("publishBulk should prefer the stable v1.0 endpoint", () => {
    it("should call the stable v1.0 bulk publish endpoint", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      execute.mockResolvedValue({});

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(0);
      expect(execute).toHaveBeenCalledTimes(1);
      const [apiVersion, path] = execute.mock.calls[0];
      expect(apiVersion).toBe("v1.0");
      expect(path).toContain("/publish/bulk/my-pubsub/my-topic");
      expect(executeMetadata).toHaveBeenCalledWith("/metadata");
    });

    it("should use v1.0-alpha1 on runtimes older than 1.17", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockResolvedValue({ runtimeVersion: "1.16.12" });
      execute.mockResolvedValue({});

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(0);
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute.mock.calls[0][0]).toBe("v1.0-alpha1");
      expect(execute.mock.calls[0][1]).toContain("/publish/bulk/my-pubsub/my-topic");
    });

    it("should not misroute through the single-publish endpoint when a component is named bulk", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockResolvedValue({ runtimeVersion: "1.16.12" });
      execute.mockResolvedValue({});

      await pubsub.publishBulk("bulk", "my-topic", messages);

      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute.mock.calls[0][0]).toBe("v1.0-alpha1");
      expect(execute.mock.calls[0][1]).toContain("/publish/bulk/bulk/my-topic");
    });

    it("should query the runtime version once when concurrent calls publish", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockResolvedValue({ runtimeVersion: "1.16.12" });
      execute.mockResolvedValue({});

      const results = await publishConcurrently(pubsub);

      expect(results.map((res) => res.failedMessages.length)).toEqual([0, 0, 0]);
      expect(executeMetadata).toHaveBeenCalledTimes(1);
      expect(execute.mock.calls.map((call) => call[0])).toEqual(["v1.0-alpha1", "v1.0-alpha1", "v1.0-alpha1"]);
    });

    it("should hold concurrent publishes until the runtime version is known", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      let completeProbe!: (res: object) => void;
      executeMetadata.mockImplementation(
        () =>
          new Promise((resolve) => {
            completeProbe = resolve;
          }),
      );
      execute.mockResolvedValue({});

      const pending = publishConcurrently(pubsub);
      await flushPromises();
      expect(execute).not.toHaveBeenCalled();

      completeProbe({ runtimeVersion: "1.16.12" });
      const results = await pending;

      expect(results.map((res) => res.failedMessages.length)).toEqual([0, 0, 0]);
      expect(execute.mock.calls.map((call) => call[0])).toEqual(["v1.0-alpha1", "v1.0-alpha1", "v1.0-alpha1"]);
    });

    it("should not fail concurrent calls when the first call fails for another reason", async () => {
      const { pubsub, execute } = getPubSub();
      execute.mockRejectedValueOnce(httpError(500)).mockResolvedValue({});

      const results = await publishConcurrently(pubsub);

      expect(results.map((res) => res.failedMessages.length)).toEqual([2, 0, 0]);
      expect(execute.mock.calls.map((call) => call[0])).toEqual(["v1.0", "v1.0", "v1.0"]);
    });

    it("should retry metadata after the metadata request fails", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockRejectedValueOnce(httpError(500)).mockResolvedValue({ runtimeVersion: "1.16.12" });
      execute.mockResolvedValue({});

      const failed = await pubsub.publishBulk("my-pubsub", "my-topic", messages);
      expect(failed.failedMessages.length).toBe(2);
      expect(execute).not.toHaveBeenCalled();

      await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(executeMetadata).toHaveBeenCalledTimes(2);
      expect(execute.mock.calls.map((call) => call[0])).toEqual(["v1.0-alpha1"]);
    });

    it("should continue using alpha1 when it reports failed entries", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockResolvedValue({ runtimeVersion: "1.16.12" });
      execute
        .mockRejectedValueOnce(
          new Error(
            JSON.stringify({
              error: "Internal Server Error",
              error_msg: JSON.stringify({ failedEntries: [{ entryID: "1", error: "failed to publish" }] }),
              status: 500,
            }),
          ),
        )
        .mockResolvedValue({});

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", [
        { entryID: "1", event: { hello: "world" }, contentType: "application/json" },
        { entryID: "2", event: { hello: "world 2" }, contentType: "application/json" },
      ]);

      expect(res.failedMessages.map((failed) => failed.message.entryID)).toEqual(["1"]);

      execute.mockClear();
      await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(execute.mock.calls.map((call) => call[0])).toEqual(["v1.0-alpha1"]);
    });

    it("should not publish when runtime metadata has no usable version", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockResolvedValue({});
      execute.mockResolvedValue({});

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(execute).not.toHaveBeenCalled();
      expect(res.failedMessages.length).toBe(2);
    });

    it("should use the stable v1.0 endpoint on an edge runtime", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockResolvedValue({ runtimeVersion: "edge" });
      execute.mockResolvedValue({});

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(0);
      expect(execute.mock.calls[0][0]).toBe("v1.0");
    });

    it("should parse runtime versions with a v prefix and prerelease suffix", async () => {
      const { pubsub, execute, executeMetadata } = getPubSub();
      executeMetadata.mockResolvedValue({ runtimeVersion: "v1.17.0-rc.1" });
      execute.mockResolvedValue({});
      await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(execute.mock.calls[0][0]).toBe("v1.0");
    });

    it("should map failed entries reported by the bulk publish endpoint", async () => {
      const { pubsub, execute } = getPubSub();
      execute.mockRejectedValue(
        new Error(
          JSON.stringify({
            error: "Internal Server Error",
            error_msg: JSON.stringify({ failedEntries: [{ entryID: "1", error: "failed to publish" }] }),
            status: 500,
          }),
        ),
      );

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", [
        { entryID: "1", event: { hello: "world" }, contentType: "application/json" },
        { entryID: "2", event: { hello: "world 2" }, contentType: "application/json" },
      ]);

      expect(res.failedMessages.length).toBe(1);
      expect(res.failedMessages[0].message.entryID).toBe("1");
      expect(res.failedMessages[0].error.message).toBe("failed to publish");
    });
  });
});

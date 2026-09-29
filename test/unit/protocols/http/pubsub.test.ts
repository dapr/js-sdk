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

describe("http/pubsub", () => {
  const messages = [{ hello: "world" }, { hello: "world 2" }];

  const getPubSub = () => {
    const client = new HTTPClient({
      daprHost: "",
      daprPort: "",
      communicationProtocol: 0,
    });
    const execute = jest.spyOn(client, "executeWithApiVersion");
    return { pubsub: new HTTPClientPubSub(client), execute };
  };

  describe("publishBulk should prefer the stable v1.0 endpoint", () => {
    it("should call the stable v1.0 bulk publish endpoint", async () => {
      const { pubsub, execute } = getPubSub();
      execute.mockResolvedValue({});

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(0);
      expect(execute).toHaveBeenCalledTimes(1);
      const [apiVersion, path] = execute.mock.calls[0];
      expect(apiVersion).toBe("v1.0");
      expect(path).toContain("/publish/bulk/my-pubsub/my-topic");
    });

    it("should fall back to v1.0-alpha1 when the stable endpoint is missing", async () => {
      const { pubsub, execute } = getPubSub();
      execute.mockRejectedValueOnce(httpError(404)).mockResolvedValueOnce({});

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(res.failedMessages.length).toBe(0);
      expect(execute).toHaveBeenCalledTimes(2);
      expect(execute.mock.calls[0][0]).toBe("v1.0");
      expect(execute.mock.calls[1][0]).toBe("v1.0-alpha1");
      expect(execute.mock.calls[1][1]).toContain("/publish/bulk/my-pubsub/my-topic");
    });

    it("should only probe the stable endpoint once when falling back", async () => {
      const { pubsub, execute } = getPubSub();
      execute.mockRejectedValueOnce(httpError(404)).mockResolvedValue({});

      await pubsub.publishBulk("my-pubsub", "my-topic", messages);
      await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(execute).toHaveBeenCalledTimes(3);
      expect(execute.mock.calls.map((call) => call[0])).toEqual(["v1.0", "v1.0-alpha1", "v1.0-alpha1"]);
    });

    it("should not fall back when the stable endpoint fails for another reason", async () => {
      const { pubsub, execute } = getPubSub();
      execute.mockRejectedValue(httpError(500));

      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);

      expect(execute).toHaveBeenCalledTimes(1);
      expect(res.failedMessages.length).toBe(2);
    });

    it("should not remember the fallback when the alpha1 endpoint also returns 404", async () => {
      const { pubsub, execute } = getPubSub();
      execute.mockRejectedValue(httpError(404));

      // A 404 from both endpoints means the pub/sub component was not found,
      // not that the runtime predates the stable endpoint.
      const res = await pubsub.publishBulk("my-pubsub", "my-topic", messages);
      expect(res.failedMessages.length).toBe(2);

      execute.mockClear();
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

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

import fetch, { Response } from "node-fetch";
import { CommunicationProtocolEnum, DaprClient, StateConsistencyEnum } from "../../../../src";
import { CustomSerializer } from "../../../fixtures/CustomSerializer";
import { serializeJsonValue } from "../../../../src/serialization/Serialization.util";

const mockClient = { getState: jest.fn() };
jest.mock("node-fetch", () => ({ ...jest.requireActual("node-fetch"), __esModule: true, default: jest.fn() }));
jest.mock("@connectrpc/connect", () => ({
  ...jest.requireActual("@connectrpc/connect"),
  createClient: () => mockClient,
}));

describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])(
  "%s state getWithMetadata",
  (communicationProtocol) => {
    let client: DaprClient;
    const setResponse = (body: string, etag = "version-1") => {
      jest.mocked(fetch).mockResolvedValue(
        new Response(body || undefined, {
          status: body ? 200 : 204,
          headers: {
            ...(etag ? { ETag: etag } : {}),
            "metadata.partitionKey": "tenant-a",
            "Content-Type": "application/json",
          },
        }),
      );
      mockClient.getState.mockResolvedValue({ data: Buffer.from(body), etag, metadata: { partitionKey: "tenant-a" } });
    };
    beforeEach(() => {
      jest.resetAllMocks();
      client = new DaprClient({ communicationProtocol, daprApiToken: "test-token" });
      client.daprClient.setIsInitialized(true);
      setResponse('{"count":1}');
    });
    afterEach(async () => {
      await client.stop();
      jest.restoreAllMocks();
    });

    it("returns ETag and response metadata, forwarding read options without changing the key", async () => {
      const key = "folder/key ?#%";
      const options = { consistency: StateConsistencyEnum.CONSISTENCY_STRONG, metadata: { partitionKey: "a & b" } };
      const result = await client.state.getWithMetadata("store", key, options);
      expect(result).toEqual({
        key,
        value: { count: 1 },
        etag: "version-1",
        metadata:
          communicationProtocol === CommunicationProtocolEnum.HTTP
            ? { partitionkey: "tenant-a" }
            : { partitionKey: "tenant-a" },
      });
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        const [url, request] = jest.mocked(fetch).mock.calls[0];
        const parsed = new URL(String(url));
        expect(parsed.pathname).toBe(`/v1.0/state/store/${encodeURIComponent(key)}`);
        expect(Object.fromEntries(parsed.searchParams)).toEqual({
          consistency: "strong",
          "metadata.partitionKey": "a & b",
        });
        expect(request?.method).toBe("GET");
        expect(new (jest.requireActual("node-fetch").Headers)(request?.headers).get("dapr-api-token")).toBe(
          "test-token",
        );
      } else {
        expect(mockClient.getState).toHaveBeenCalledWith(
          expect.objectContaining({
            storeName: "store",
            key,
            consistency: StateConsistencyEnum.CONSISTENCY_STRONG,
            metadata: options.metadata,
          }),
        );
      }
    });

    it.each(['"text"', "false", "0", "null", "plain text", ""])(
      "decodes %j and tolerates a missing ETag",
      async (body) => {
        setResponse(body, "");
        let expected: unknown;
        try {
          expected = JSON.parse(body);
        } catch {
          expected = body;
        }
        const result = await client.state.getWithMetadata("store", "key");
        expect(result.value).toEqual(expected);
        expect(result.etag).toBeUndefined();
      },
    );

    it("uses the configured serializer for the value", async () => {
      const serializer = new CustomSerializer();
      await client.stop();
      client = new DaprClient({ communicationProtocol, serializer });
      client.daprClient.setIsInitialized(true);
      setResponse(JSON.stringify(serializeJsonValue({ count: 42n }, serializer)));
      const result = await client.state.getWithMetadata("store", "key");
      expect(result.value).toEqual({ count: 42n });
      expect(result.etag).toBe("version-1");
    });

    it("propagates failed requests", async () => {
      const error = new Error("state unavailable");
      jest.mocked(fetch).mockRejectedValue(error);
      mockClient.getState.mockRejectedValue(error);
      await expect(client.state.getWithMetadata("store", "key")).rejects.toBe(error);
    });

    it("keeps the existing get return value", async () => {
      await expect(client.state.get("store", "key")).resolves.toEqual({ count: 1 });
    });
  },
);

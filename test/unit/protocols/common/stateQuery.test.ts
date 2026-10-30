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
import { CommunicationProtocolEnum, DaprClient } from "../../../../src";

const mockClient = { queryStateAlpha1: jest.fn() };
jest.mock("node-fetch", () => ({
  ...jest.requireActual("node-fetch"),
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@connectrpc/connect", () => ({
  ...jest.requireActual("@connectrpc/connect"),
  createClient: () => mockClient,
}));

describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])(
  "%s state query metadata",
  (communicationProtocol) => {
    let client: DaprClient;
    const query = { filter: { EQ: { status: "pending" } }, sort: [], page: { limit: 10 } };

    beforeEach(() => {
      jest.resetAllMocks();
      client = new DaprClient({ communicationProtocol });
      client.daprClient.setIsInitialized(true);
      jest.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ results: [], token: "next" }), {
          headers: { "Content-Type": "application/json" },
        }),
      );
      mockClient.queryStateAlpha1.mockResolvedValue({ results: [], token: "next" });
    });

    afterEach(async () => {
      await client.stop();
      jest.restoreAllMocks();
    });

    it.each<Record<string, string> | undefined>([
      undefined,
      {},
      { queryIndexName: "orders & pending/索引", empty: "" },
    ])("passes metadata %j separately from the query", async (metadata) => {
      if (metadata) Object.freeze(metadata);
      const result = await client.state.query("store", query, metadata);
      expect(result).toEqual({ results: [], token: "next" });
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        expect(fetch).toHaveBeenCalledTimes(1);
        const [url, request] = jest.mocked(fetch).mock.calls[0];
        const parsed = new URL(String(url));
        expect(parsed.pathname).toBe("/v1.0-alpha1/state/store/query");
        expect(Object.fromEntries(parsed.searchParams)).toEqual(
          Object.fromEntries(Object.entries(metadata ?? {}).map(([key, value]) => [`metadata.${key}`, value])),
        );
        expect(request?.method).toBe("POST");
        expect(JSON.parse(request?.body as string)).toEqual(query);
      } else {
        expect(mockClient.queryStateAlpha1).toHaveBeenCalledTimes(1);
        expect(mockClient.queryStateAlpha1).toHaveBeenCalledWith(
          expect.objectContaining({ storeName: "store", query: JSON.stringify(query), metadata: metadata ?? {} }),
        );
      }
    });

    it("preserves the existing two-argument call", async () => {
      await expect(client.state.query("store", query)).resolves.toEqual({ results: [], token: "next" });
    });
  },
);

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
import { Code, ConnectError } from "@connectrpc/connect";
import { CommunicationProtocolEnum, DaprClient, StateConcurrencyEnum, StateConsistencyEnum } from "../../../../src";
import { KeyValuePairType } from "../../../../src/types/KeyValuePair.type";
import { CustomSerializer } from "../../../fixtures/CustomSerializer";

const mockClient = {
  deleteBulkState: jest.fn(),
  deleteState: jest.fn(),
};
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
  "%s bulk state deletion",
  (communicationProtocol) => {
    let client: DaprClient;
    const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), verbose: jest.fn(), debug: jest.fn() };

    beforeEach(() => {
      jest.resetAllMocks();
      client = new DaprClient({ communicationProtocol, logger: { service: logger } });
      client.daprClient.setIsInitialized(true);
      jest.mocked(fetch).mockImplementation(async () => new Response(undefined, { status: 204 }));
      mockClient.deleteBulkState.mockResolvedValue({});
    });
    afterEach(async () => {
      await client.stop();
      jest.restoreAllMocks();
    });

    it("maps keys, ETags, state options, and merged metadata without mutating inputs", async () => {
      const options = Object.freeze({
        consistency: StateConsistencyEnum.CONSISTENCY_STRONG,
        concurrency: StateConcurrencyEnum.CONCURRENCY_FIRST_WRITE,
      });
      const items = Object.freeze([
        Object.freeze({
          key: "first",
          etag: "version-1",
          options,
          metadata: Object.freeze({ partitionKey: "item", itemOnly: "one" }),
        }),
        Object.freeze({ key: "second", metadata: Object.freeze({ itemOnly: "two" }) }),
      ]);
      const shared = Object.freeze({ metadata: Object.freeze({ partitionKey: "shared", sharedOnly: "all" }) });
      await expect(client.state.deleteBulk("store", items, shared)).resolves.toEqual({});

      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        expect(fetch).toHaveBeenCalledTimes(2);
        for (const [index, [url, request]] of jest.mocked(fetch).mock.calls.entries()) {
          const parsed = new URL(String(url));
          expect(parsed.pathname).toBe(`/v1.0/state/store/${items[index].key}`);
          expect(Object.fromEntries(parsed.searchParams)).toEqual({
            "metadata.partitionKey": "shared",
            "metadata.itemOnly": index === 0 ? "one" : "two",
            "metadata.sharedOnly": "all",
            ...(index === 0 ? { consistency: "strong", concurrency: "first-write" } : {}),
          });
          expect(request?.method).toBe("DELETE");
          expect(request?.body).toBeUndefined();
          if (index === 0) {
            expect(request?.headers).toEqual(expect.objectContaining({ "If-Match": "version-1" }));
          } else {
            expect(request?.headers).not.toHaveProperty("If-Match");
          }
        }
      } else {
        expect(mockClient.deleteBulkState).toHaveBeenCalledTimes(1);
        expect(mockClient.deleteBulkState).toHaveBeenCalledWith(
          expect.objectContaining({
            storeName: "store",
            states: [
              expect.objectContaining({
                key: "first",
                etag: expect.objectContaining({ value: "version-1" }),
                options: expect.objectContaining(options),
                metadata: { partitionKey: "shared", itemOnly: "one", sharedOnly: "all" },
                value: new Uint8Array(0),
              }),
              expect.objectContaining({
                key: "second",
                metadata: { partitionKey: "shared", itemOnly: "two", sharedOnly: "all" },
                value: new Uint8Array(0),
              }),
            ],
          }),
        );
        const second = mockClient.deleteBulkState.mock.calls[0][0].states[1];
        expect(second.etag).toBeUndefined();
        expect(second.options).toBeUndefined();
        expect(mockClient.deleteState).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
      }
    });

    it("accepts key-only entries without options", async () => {
      await expect(client.state.deleteBulk("store", [{ key: "key" }])).resolves.toEqual({});
      if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
        expect(new URL(String(jest.mocked(fetch).mock.calls[0][0])).search).toBe("");
      } else {
        const state = mockClient.deleteBulkState.mock.calls[0][0].states[0];
        expect(state.metadata).toEqual({});
        expect(state.etag).toBeUndefined();
        expect(state.options).toBeUndefined();
      }
    });

    it("ignores values in existing key-value arrays and never invokes the serializer", async () => {
      const serializer = new CustomSerializer();
      const serialize = jest.spyOn(serializer, "serialize").mockImplementation(() => {
        throw new Error("Delete must not serialize values");
      });
      await client.stop();
      client = new DaprClient({ communicationProtocol, serializer });
      client.daprClient.setIsInitialized(true);
      const items: KeyValuePairType[] = [{ key: "key", value: 42n }];
      await expect(client.state.deleteBulk("store", items)).resolves.toEqual({});
      expect(serialize).not.toHaveBeenCalled();
    });

    it("does not initialize the client or send requests for an empty batch", async () => {
      client.daprClient.setIsInitialized(false);
      const getClient = jest.spyOn(client.daprClient, "getClient");
      await expect(client.state.deleteBulk("store", [])).resolves.toEqual({});
      expect(getClient).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(mockClient.deleteBulkState).not.toHaveBeenCalled();
    });

    if (communicationProtocol === CommunicationProtocolEnum.HTTP) {
      it("encodes key path segments without interpreting query strings or fragments", async () => {
        const key = "folder/key ?metadata.partitionKey=other#%";
        await client.state.deleteBulk("store", [{ key }]);
        const url = new URL(String(jest.mocked(fetch).mock.calls[0][0]));
        expect(url.pathname).toBe(`/v1.0/state/store/${encodeURIComponent(key)}`);
        expect(url.search).toBe("");
        expect(url.hash).toBe("");
      });

      it("waits for all deletes and reports the first failure in input order", async () => {
        const firstError = new Error("first delete failed");
        const secondError = new Error("second delete failed");
        let finishLast!: (response: Response) => void;
        jest
          .mocked(fetch)
          .mockRejectedValueOnce(firstError)
          .mockRejectedValueOnce(secondError)
          .mockImplementationOnce(() => new Promise((resolve) => (finishLast = resolve)));
        let settled = false;
        const result = client.state.deleteBulk("store", [{ key: "a" }, { key: "b" }, { key: "c" }]).then((value) => {
          settled = true;
          return value;
        });
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(settled).toBe(false);
        finishLast(new Response(undefined, { status: 204 }));
        await expect(result).resolves.toEqual({ error: firstError });
        expect(logger.error).toHaveBeenCalledTimes(2);
      });

      it("reports a failed HTTP response even when another delete succeeds", async () => {
        jest
          .mocked(fetch)
          .mockResolvedValueOnce(new Response(undefined, { status: 204 }))
          .mockResolvedValueOnce(new Response("etag mismatch", { status: 409 }));
        const result = await client.state.deleteBulk("store", [{ key: "first" }, { key: "key", etag: "stale" }]);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toContain("etag mismatch");
        expect(logger.error).toHaveBeenCalledTimes(1);
      });
    } else {
      it("preserves RPC failures rather than converting them to successful responses", async () => {
        const error = new ConnectError("etag mismatch", Code.Aborted);
        mockClient.deleteBulkState.mockRejectedValue(error);
        await expect(client.state.deleteBulk("store", [{ key: "key", etag: "stale" }])).rejects.toBe(error);
      });
    }
  },
);

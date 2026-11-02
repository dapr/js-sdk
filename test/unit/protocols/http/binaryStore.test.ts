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

import { Readable } from "node:stream";
import { Agent } from "node:https";
import fetch, { Headers, Response } from "node-fetch";
import { CommunicationProtocolEnum, DaprClient, HTTPClient } from "../../../../src";
import { expectPreAbortedOperationsToReject, readFirstChunkAndClose } from "../../../utils/BinaryStoreTestUtils";

describe("HTTP Binary Store", () => {
  const client = new DaprClient({
    communicationProtocol: CommunicationProtocolEnum.HTTP,
    daprHost: "https://localhost",
    daprPort: "3500",
    daprApiToken: "test-token",
  });
  const transport = client.daprClient;
  if (!(transport instanceof HTTPClient)) {
    throw new Error("Expected HTTP client");
  }
  transport.setIsInitialized(true);
  let request: jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
  let uploaded: Buffer;

  beforeEach(() => {
    uploaded = Buffer.alloc(0);
    request = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(async (_url, options) => {
      if (options?.body instanceof Readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of options.body) {
          chunks.push(Buffer.from(chunk));
        }
        uploaded = Buffer.concat(chunks);
      }
      return new Response(undefined, { status: 204 });
    });
    jest.spyOn(transport, "getClient").mockResolvedValue(Object.assign(request, fetch));
  });

  afterEach(() => jest.restoreAllMocks());

  it("POSTs raw binary bytes with alpha version, escaped names, authentication and user agent", async () => {
    const bytes = Uint8Array.from([99, 0, 128, 255, 99]).subarray(1, 4);
    await client.binaryStore.setBinaryFile("store", "folder/a %\u00e9.bin", bytes, { chunkSize: 1 });
    expect(uploaded).toEqual(Buffer.from([0, 128, 255]));
    expect(request).toHaveBeenCalledWith(
      "https://localhost:3500/v1.0-alpha1/binarystore/store/folder%2Fa%20%25%C3%A9.bin",
      expect.objectContaining({ method: "POST", redirect: "error" }),
    );
    const headers = new Headers(request.mock.calls[0][1]?.headers);
    expect(headers.get("content-type")).toBe("application/octet-stream");
    expect(headers.get("dapr-api-token")).toBe("test-token");
    expect(headers.get("user-agent")).toMatch(/^dapr-sdk-js\/.+ http\/1$/);
    expect(request.mock.calls[0][1]?.agent).toBeInstanceOf(Agent);
  });

  it("uses PUT only when overwrite is requested and supports empty files and streams", async () => {
    await client.binaryStore.setBinaryFile("store", "file", Readable.from([Buffer.from([255])]), { overwrite: true });
    expect(request.mock.calls[0][1]?.method).toBe("PUT");
    expect(uploaded).toEqual(Buffer.from([255]));
    await client.binaryStore.setBinaryFile("store", "empty", Buffer.alloc(0));
    expect(request.mock.calls[1][1]?.method).toBe("POST");
    expect(uploaded).toEqual(Buffer.alloc(0));
  });

  it("streams GET responses without UTF-8 or JSON decoding", async () => {
    const bytes = Buffer.from([0, 128, 255, 123, 125]);
    request.mockResolvedValueOnce(new Response(Readable.from([bytes])));
    expect(await client.binaryStore.getBinaryFileBytes("store", "file")).toEqual(bytes);
    expect(request.mock.calls[0][1]?.method).toBe("GET");
    request.mockResolvedValueOnce(new Response(Readable.from([])));
    expect(await client.binaryStore.getBinaryFileBytes("store", "empty")).toEqual(Buffer.alloc(0));
  });

  it("destroys response streams when consumers stop early", async () => {
    const body = Readable.from([Buffer.from([1]), Buffer.from([2])]);
    request.mockResolvedValueOnce(new Response(body));
    expect(await readFirstChunkAndClose(client.binaryStore.getBinaryFileChunks("store", "file"))).toEqual(
      Buffer.from([1]),
    );
    expect(body.destroyed).toBe(true);
  });

  it("deletes using the same encoded route", async () => {
    await client.binaryStore.deleteBinaryFile("store", "folder/file");
    expect(request).toHaveBeenCalledWith(
      "https://localhost:3500/v1.0-alpha1/binarystore/store/folder%2Ffile",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it.each([404, 409, 413, 500])("propagates HTTP %s and the runtime error body", async (status) => {
    const body = JSON.stringify({ errorCode: "ERR_BINARY_STORE", message: "runtime failure" });
    request.mockImplementation(async () => new Response(body, { status }));
    for (const operation of [
      () => client.binaryStore.setBinaryFile("store", "file", Buffer.alloc(0)),
      () => client.binaryStore.getBinaryFileBytes("store", "file"),
      () => client.binaryStore.deleteBinaryFile("store", "file"),
    ]) {
      await expect(operation()).rejects.toThrow(`"status":${status}`);
    }
    await expect(client.binaryStore.getBinaryFileBytes("store", "file")).rejects.toThrow("runtime failure");
  });

  it("propagates network and mid-download errors", async () => {
    const error = new Error("connection reset");
    request.mockRejectedValueOnce(error);
    await expect(client.binaryStore.getBinaryFileBytes("store", "file")).rejects.toBe(error);
    request.mockResolvedValueOnce(
      new Response(
        Readable.from(
          (async function* () {
            yield Buffer.from([1]);
            throw error;
          })(),
        ),
      ),
    );
    await expect(client.binaryStore.getBinaryFileBytes("store", "file")).rejects.toBe(error);
  });

  it("rejects dot segments before URL normalization and validates upload options", async () => {
    for (const fileName of [".", "..", "a/../b", "/file", "file/", "a//b", "a\\b", "a?b", "a#b"]) {
      await expect(client.binaryStore.getBinaryFileBytes("store", fileName)).rejects.toThrow(TypeError);
    }
    await expect(client.binaryStore.setBinaryFile("store", "file", Buffer.alloc(0), { chunkSize: 0 })).rejects.toThrow(
      RangeError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("passes AbortSignal to fetch and rejects pre-aborted operations", async () => {
    const controller = new AbortController();
    await client.binaryStore.setBinaryFile("store", "file", Buffer.alloc(0), { signal: controller.signal });
    expect(request.mock.calls[0][1]?.signal).toBe(controller.signal);
    await expectPreAbortedOperationsToReject(client.binaryStore, controller);
    expect(request).toHaveBeenCalledTimes(1);
  });
});

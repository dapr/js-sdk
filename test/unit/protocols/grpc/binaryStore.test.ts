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

import { Readable, Writable } from "node:stream";
import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import { CommunicationProtocolEnum, DaprClient, GRPCClient } from "../../../../src";
import { expectPreAbortedOperationsToReject, readFirstChunkAndClose } from "../../../utils/BinaryStoreTestUtils";
import {
  GetBinaryFileResponseAlpha1Schema,
  DeleteBinaryFileResponseAlpha1Schema,
  SetBinaryFileRequestAlpha1,
  SetBinaryFileRequestAlpha1Schema,
  SetBinaryFileResponseAlpha1Schema,
} from "../../../../src/proto/dapr/proto/runtime/v1/binarystore_pb";

describe("gRPC Binary Store", () => {
  const client = new DaprClient({ communicationProtocol: CommunicationProtocolEnum.GRPC });
  const transport = client.daprClient;
  if (!(transport instanceof GRPCClient)) {
    throw new Error("Expected gRPC client");
  }
  transport.setIsInitialized(true);
  let requests: SetBinaryFileRequestAlpha1[];

  beforeEach(async () => {
    requests = [];
    const rpc = await transport.getClient();
    jest.spyOn(rpc, "setBinaryFileAlpha1").mockImplementation(async (input) => {
      for await (const message of input) {
        requests.push(create(SetBinaryFileRequestAlpha1Schema, message));
      }
      return create(SetBinaryFileResponseAlpha1Schema);
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it("sends a separate initial request followed by bounded chunks with zero-based sequence numbers", async () => {
    const bytes = Buffer.alloc(65537, 0xff);
    await client.binaryStore.setBinaryFile("store", "folder/file.bin", bytes);
    expect(requests[0].setBinaryFileRequestType).toMatchObject({
      case: "initialRequest",
      value: { componentName: "store", fileName: "folder/file.bin", overwrite: false },
    });
    const payloads = requests.slice(1).map((request) => {
      expect(request.setBinaryFileRequestType.case).toBe("payload");
      if (request.setBinaryFileRequestType.case !== "payload") {
        throw new Error("Expected a payload");
      }
      return request.setBinaryFileRequestType.value;
    });
    expect(payloads.map((payload) => payload.seq)).toEqual([0n, 1n, 2n]);
    expect(payloads.map((payload) => payload.data.length)).toEqual([32768, 32768, 1]);
    expect(Buffer.concat(payloads.map((payload) => Buffer.from(payload.data)))).toEqual(bytes);
  });

  it("supports binary streams, explicit overwrite, custom chunks and typed-array slices", async () => {
    const bytes = Uint8Array.from([99, 0, 128, 255, 99]).subarray(1, 4);
    await client.binaryStore.setBinaryFile("store", "file", Readable.from([bytes]), {
      overwrite: true,
      chunkSize: 2,
    });
    expect(requests[0].setBinaryFileRequestType.value).toMatchObject({ overwrite: true });
    expect(requests.slice(1).map((request) => request.setBinaryFileRequestType.value)).toMatchObject([
      { data: Buffer.from([0, 128]), seq: 0n },
      { data: Buffer.from([255]), seq: 1n },
    ]);
  });

  it("uploads empty files using only the initial request", async () => {
    await client.binaryStore.setBinaryFile("store", "empty", Buffer.alloc(0));
    expect(requests).toHaveLength(1);
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid chunk size %s",
    async (chunkSize) => {
      await expect(client.binaryStore.setBinaryFile("store", "file", Buffer.alloc(1), { chunkSize })).rejects.toThrow(
        RangeError,
      );
      expect(requests).toHaveLength(0);
    },
  );

  it.each(["", "/file", "file/", "a//b", ".", "..", "a/../b", "a\\b", "a?b", "a#b", "a*b", "a[b]"])(
    "rejects invalid file name %s",
    async (fileName) => {
      await expect(client.binaryStore.setBinaryFile("store", fileName, Buffer.alloc(0))).rejects.toThrow(TypeError);
      await expect(client.binaryStore.getBinaryFileBytes("store", fileName)).rejects.toThrow(TypeError);
      await expect(client.binaryStore.deleteBinaryFile("store", fileName)).rejects.toThrow(TypeError);
    },
  );

  it("rejects missing store names and non-binary streams", async () => {
    await expect(client.binaryStore.setBinaryFile("", "file", Buffer.alloc(0))).rejects.toThrow("storeName");
    await expect(client.binaryStore.setBinaryFile("store", "file", Readable.from(["text"]))).rejects.toThrow(
      "Uint8Array",
    );
  });

  it("propagates upload source and RPC errors", async () => {
    const sourceError = new Error("source failed");
    const source = Readable.from(
      (async function* () {
        yield Buffer.from([1]);
        throw sourceError;
      })(),
    );
    await expect(client.binaryStore.setBinaryFile("store", "file", source)).rejects.toBe(sourceError);
    const rpc = await transport.getClient();
    const error = new ConnectError("already exists", Code.AlreadyExists);
    jest.spyOn(rpc, "setBinaryFileAlpha1").mockRejectedValue(error);
    await expect(client.binaryStore.setBinaryFile("store", "file", Buffer.alloc(1))).rejects.toBe(error);
  });

  it("destroys an unread upload source when the runtime rejects the initial request", async () => {
    const rpc = await transport.getClient();
    const error = new ConnectError("missing store", Code.NotFound);
    jest.spyOn(rpc, "setBinaryFileAlpha1").mockRejectedValue(error);
    const source = new Readable({ read() {} });
    await expect(client.binaryStore.setBinaryFile("missing", "file", source)).rejects.toBe(error);
    expect(source.destroyed).toBe(true);
  });

  it("downloads ordered chunks, buffers bytes, and writes to a backpressured destination", async () => {
    const rpc = await transport.getClient();
    jest.spyOn(rpc, "getBinaryFileAlpha1").mockImplementation(async function* () {
      yield create(GetBinaryFileResponseAlpha1Schema, { payload: { data: Uint8Array.from([0, 255]), seq: 0n } });
      yield create(GetBinaryFileResponseAlpha1Schema, { payload: { data: Uint8Array.from([128]), seq: 1n } });
    });
    expect(await client.binaryStore.getBinaryFileBytes("store", "file")).toEqual(Buffer.from([0, 255, 128]));
    const chunks: Buffer[] = [];
    const destination = new Writable({
      highWaterMark: 1,
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        setImmediate(callback);
      },
    });
    await client.binaryStore.getBinaryFile("store", "file", destination);
    expect(Buffer.concat(chunks)).toEqual(Buffer.from([0, 255, 128]));
    expect(destination.writableFinished).toBe(true);
    expect(rpc.getBinaryFileAlpha1).toHaveBeenCalledWith(
      { componentName: "store", fileName: "file" },
      { signal: expect.any(AbortSignal) },
    );
  });

  it("closes download iterators on early exit and destination failure", async () => {
    const rpc = await transport.getClient();
    const closed = jest.fn();
    jest.spyOn(rpc, "getBinaryFileAlpha1").mockImplementation(async function* () {
      try {
        while (true) {
          yield create(GetBinaryFileResponseAlpha1Schema, { payload: { data: Buffer.from([1]) } });
        }
      } finally {
        closed();
      }
    });
    expect(await readFirstChunkAndClose(client.binaryStore.getBinaryFileChunks("store", "file"))).toEqual(
      Buffer.from([1]),
    );
    expect(closed).toHaveBeenCalledTimes(1);
    expect(jest.mocked(rpc.getBinaryFileAlpha1).mock.calls[0][1]?.signal?.aborted).toBe(true);
    const error = new Error("destination failed");
    await expect(
      client.binaryStore.getBinaryFile(
        "store",
        "file",
        new Writable({ write: (_chunk, _encoding, callback) => callback(error) }),
      ),
    ).rejects.toBe(error);
    expect(closed).toHaveBeenCalledTimes(2);
  });

  it("does not turn missing files, truncated downloads, or malformed responses into success", async () => {
    const rpc = await transport.getClient();
    const error = new ConnectError("not found", Code.NotFound);
    jest.spyOn(rpc, "getBinaryFileAlpha1").mockImplementation(async function* () {
      yield create(GetBinaryFileResponseAlpha1Schema, { payload: { data: Buffer.from([1]) } });
      throw error;
    });
    await expect(client.binaryStore.getBinaryFileBytes("store", "file")).rejects.toBe(error);
    jest.spyOn(rpc, "getBinaryFileAlpha1").mockImplementation(async function* () {
      yield create(GetBinaryFileResponseAlpha1Schema);
    });
    await expect(client.binaryStore.getBinaryFileBytes("store", "file")).rejects.toThrow("missing its payload");
    jest.spyOn(rpc, "deleteBinaryFileAlpha1").mockRejectedValue(error);
    await expect(client.binaryStore.deleteBinaryFile("store", "file")).rejects.toBe(error);
  });

  it("passes cancellation to every RPC and rejects pre-aborted operations", async () => {
    const rpc = await transport.getClient();
    const controller = new AbortController();
    await client.binaryStore.setBinaryFile("store", "file", Buffer.from([1]), { signal: controller.signal });
    expect(rpc.setBinaryFileAlpha1).toHaveBeenCalledWith(expect.anything(), { signal: controller.signal });
    jest.spyOn(rpc, "getBinaryFileAlpha1").mockImplementation(async function* () {});
    await client.binaryStore.getBinaryFileBytes("store", "file", { signal: controller.signal });
    expect(rpc.getBinaryFileAlpha1).toHaveBeenCalledWith(expect.anything(), { signal: expect.any(AbortSignal) });
    jest.spyOn(rpc, "deleteBinaryFileAlpha1").mockResolvedValue(create(DeleteBinaryFileResponseAlpha1Schema));
    await client.binaryStore.deleteBinaryFile("store", "file", { signal: controller.signal });
    expect(rpc.deleteBinaryFileAlpha1).toHaveBeenCalledWith(expect.anything(), { signal: controller.signal });
    await expectPreAbortedOperationsToReject(client.binaryStore, controller);
  });

  it("forwards cancellation during downloads and removes external abort listeners", async () => {
    const rpc = await transport.getClient();
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, "removeEventListener");
    let rpcSignal: AbortSignal | undefined;
    jest.spyOn(rpc, "getBinaryFileAlpha1").mockImplementation(async function* (_request, options) {
      rpcSignal = options?.signal;
      yield create(GetBinaryFileResponseAlpha1Schema, { payload: { data: Buffer.from([1]) } });
      if (options?.signal?.aborted) {
        throw new ConnectError("canceled", Code.Canceled);
      }
    });
    const chunks = client.binaryStore.getBinaryFileChunks("store", "file", { signal: controller.signal });
    const iterator = chunks[Symbol.asyncIterator]();
    await iterator.next();
    expect(rpcSignal?.aborted).toBe(false);
    controller.abort();
    expect(rpcSignal?.aborted).toBe(true);
    await expect(iterator.next()).rejects.toMatchObject({ code: Code.Canceled });
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});

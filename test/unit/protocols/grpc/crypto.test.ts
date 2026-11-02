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

import { create, MessageInitShape } from "@bufbuild/protobuf";
import { Duplex } from "node:stream";
import { buffer } from "node:stream/consumers";
import GRPCClient from "../../../../src/implementation/Client/GRPCClient/GRPCClient";
import GRPCClientCrypto from "../../../../src/implementation/Client/GRPCClient/crypto";
import {
  DecryptRequestSchema,
  DecryptResponseSchema,
  EncryptRequestSchema,
  EncryptResponseSchema,
} from "../../../../src/proto/dapr/proto/runtime/v1/crypto_pb";
import { EncryptRequest } from "../../../../src/types/crypto/Requests";

type CryptoMessage = MessageInitShape<typeof EncryptRequestSchema> | MessageInitShape<typeof DecryptRequestSchema>;

describe("gRPC crypto", () => {
  const options: EncryptRequest = {
    componentName: "crypto-local",
    keyName: "symmetric256",
    keyWrapAlgorithm: "A256KW",
  };
  let transport: GRPCClient;
  let crypto: GRPCClientCrypto;
  let rpc: Awaited<ReturnType<GRPCClient["getClient"]>>;
  let requests: CryptoMessage[];
  let respond: (input: AsyncIterable<CryptoMessage>) => AsyncIterable<MessageInitShape<typeof EncryptResponseSchema>>;

  beforeEach(async () => {
    transport = new GRPCClient({ daprHost: "127.0.0.1", daprPort: "50001" });
    transport.setIsInitialized(true);
    rpc = await transport.getClient();
    jest.spyOn(transport, "getClient").mockResolvedValue(rpc);
    crypto = new GRPCClientCrypto(transport);
    requests = [];
    respond = async function* (input) {
      for await (const request of input) {
        requests.push(request);
        yield { payload: request.payload };
      }
    };
    jest.spyOn(rpc, "encryptAlpha1").mockImplementation(async function* (input) {
      for await (const response of respond(input)) {
        yield create(EncryptResponseSchema, response);
      }
    });
    jest.spyOn(rpc, "decryptAlpha1").mockImplementation(async function* (input) {
      for await (const response of respond(input)) {
        yield create(DecryptResponseSchema, { payload: response.payload });
      }
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await transport.stop();
  });

  it("encodes all encryption options only in the first message", async () => {
    const opts: EncryptRequest = Object.freeze({
      ...options,
      dataEncryptionCipher: "chacha20-poly1305",
      omitDecryptionKeyName: true,
      decryptionKeyName: "other-key",
    });
    const bytes = Buffer.alloc(4097, 255);
    expect(await crypto.encrypt(bytes, opts)).toEqual(bytes);
    expect(rpc.encryptAlpha1).toHaveBeenCalledTimes(1);
    expect(rpc.decryptAlpha1).not.toHaveBeenCalled();
    expect(requests).toHaveLength(3);
    expect(requests[0].options).toMatchObject(opts);
    expect(requests.slice(1).map((request) => request.options)).toEqual([undefined, undefined]);
    expect(requests.map((request) => request.payload?.seq)).toEqual([0n, 1n, 2n]);
    expect(requests.map((request) => request.payload?.data?.length)).toEqual([2048, 2048, 1]);
  });

  it("defaults optional encryption fields without changing the supplied options", async () => {
    const opts = Object.freeze({ ...options });
    await crypto.encrypt("data", opts);
    expect(requests[0].options).toMatchObject({
      ...options,
      dataEncryptionCipher: "",
      omitDecryptionKeyName: false,
      decryptionKeyName: "",
    });
    expect(opts).toEqual(options);
  });

  it.each([undefined, "override"])("encodes the decryption key override %s", async (keyName) => {
    const bytes = Buffer.alloc(2049, 128);
    expect(await crypto.decrypt(bytes, { componentName: options.componentName, keyName })).toEqual(bytes);
    expect(rpc.decryptAlpha1).toHaveBeenCalledTimes(1);
    expect(rpc.encryptAlpha1).not.toHaveBeenCalled();
    expect(requests).toHaveLength(2);
    expect(requests[0].options).toEqual(
      expect.objectContaining({ componentName: options.componentName, keyName: keyName ?? "" }),
    );
    expect(requests[0].options).not.toHaveProperty("keyWrapAlgorithm");
    expect(requests[1].options).toBeUndefined();
    expect(requests.map((request) => request.payload?.seq)).toEqual([0n, 1n]);
  });

  it("encodes plaintext strings as UTF-8", async () => {
    const text = "Hello \u00e9 \ud83c\udf0d";
    expect(await crypto.encrypt(text, options)).toEqual(Buffer.from(text, "utf8"));
    expect(requests[0].payload?.data).toEqual(Buffer.from(text, "utf8"));
  });

  it("rejects missing encryption options before obtaining the client", async () => {
    // @ts-expect-error Exercise runtime validation for JavaScript callers.
    await expect(crypto.encrypt(undefined)).rejects.toThrow("Parameter 'opts' must be defined");
    await expect(crypto.encrypt({ ...options, componentName: "" })).rejects.toThrow(
      "Option 'componentName' is required",
    );
    await expect(crypto.encrypt({ ...options, keyName: "" })).rejects.toThrow("Option 'keyName' is required");
    // @ts-expect-error Exercise a missing required wrapping algorithm.
    await expect(crypto.encrypt({ componentName: "store", keyName: "key" })).rejects.toThrow(
      "Option 'keyWrapAlgorithm' is required",
    );
    expect(transport.getClient).not.toHaveBeenCalled();
  });

  it("rejects missing decryption options before obtaining the client", async () => {
    // @ts-expect-error Exercise runtime validation for JavaScript callers.
    await expect(crypto.decrypt(undefined)).rejects.toThrow("Parameter 'opts' must be defined");
    expect(transport.getClient).not.toHaveBeenCalled();
  });

  describe.each(["encrypt", "decrypt"] as const)("%s", (operation) => {
    const executeBuffer = (input: Buffer | ArrayBuffer | ArrayBufferView) =>
      operation === "encrypt" ? crypto.encrypt(input, options) : crypto.decrypt(input, options);

    it.each([
      ["Buffer", () => Buffer.from([0, 128, 255])],
      ["ArrayBuffer", () => Uint8Array.from([0, 128, 255]).buffer],
      ["Uint8Array slice", () => Uint8Array.from([99, 0, 128, 255, 99]).subarray(1, 4)],
      ["DataView slice", () => new DataView(Uint8Array.from([99, 0, 128, 255, 99]).buffer, 1, 3)],
    ] as const)("preserves exact %s bytes", async (_name, input) => {
      const expected = Buffer.from([0, 128, 255]);
      expect(await executeBuffer(input())).toEqual(expected);
      expect(requests).toHaveLength(1);
      expect(requests[0].payload?.data).toEqual(expected);
    });

    it.each([null, undefined, 42, {}, [0, 128, 255]])("rejects invalid input %j", async (input) => {
      // @ts-expect-error Exercise input types rejected by the public TypeScript API.
      await expect(executeBuffer(input)).rejects.toThrow(
        "Invalid value for the inData parameter: must be a Buffer, an ArrayBuffer, an ArrayBufferView, or a string",
      );
      expect(transport.getClient).not.toHaveBeenCalled();
    });

    it("returns a duplex before input is available and sequences chunks across writes", async () => {
      const stream = await crypto[operation](options);
      expect(stream).toBeInstanceOf(Duplex);
      expect(stream.readableObjectMode).toBe(false);
      expect(stream.writableObjectMode).toBe(false);
      expect(requests).toHaveLength(0);
      const result = buffer(stream);
      const first = Buffer.alloc(2049, 255);
      const second = Buffer.from([0, 128, 255]);
      stream.write(first);
      stream.end(second);
      expect(await result).toEqual(Buffer.concat([first, second]));
      expect(requests.map((request) => request.payload?.seq)).toEqual([0n, 1n, 2n]);
      expect(requests.map((request) => request.payload?.data?.length)).toEqual([2048, 1, 3]);
      expect(requests[0].options).toBeDefined();
      expect(requests.slice(1).map((request) => request.options)).toEqual([undefined, undefined]);
      expect(stream.writableFinished).toBe(true);
      expect(stream.readableEnded).toBe(true);
    });

    it("returns response bytes rather than the input and concatenates response chunks", async () => {
      const response = Buffer.from([255, 0, 128, 1]);
      respond = async function* (input) {
        for await (const request of input) {
          requests.push(request);
        }
        yield {};
        yield { payload: { data: new Uint8Array(), seq: 0n } };
        yield { payload: { data: response.subarray(0, 2), seq: 1n } };
        yield { payload: { data: response.subarray(2), seq: 2n } };
      };
      expect(await executeBuffer(Buffer.from("input"))).toEqual(response);
    });

    it("returns an empty buffer when the response iterable has no messages", async () => {
      respond = async function* (input) {
        for await (const request of input) {
          requests.push(request);
        }
        yield* [];
      };
      const result = await executeBuffer(Buffer.from("input"));
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result).toEqual(Buffer.alloc(0));
      expect(requests).toHaveLength(1);
    });

    it("propagates client initialization failures", async () => {
      const error = new Error("client unavailable");
      jest.spyOn(transport, "getClient").mockRejectedValue(error);
      await expect(executeBuffer(Buffer.from("input"))).rejects.toBe(error);
      await expect(crypto[operation](options)).rejects.toBe(error);
    });

    it("propagates synchronous RPC failures", async () => {
      const error = new Error("RPC unavailable");
      jest.spyOn(rpc, operation === "encrypt" ? "encryptAlpha1" : "decryptAlpha1").mockImplementation(() => {
        throw error;
      });
      await expect(executeBuffer(Buffer.from("input"))).rejects.toBe(error);
      await expect(crypto[operation](options)).rejects.toBe(error);
    });

    it.each([false, true])("propagates response failures after partial output: %s", async (partialOutput) => {
      const error = new Error("crypto response failed");
      respond = async function* (input) {
        for await (const request of input) {
          requests.push(request);
        }
        if (partialOutput) {
          yield { payload: { data: Buffer.from([255]), seq: 0n } };
        }
        throw error;
      };
      await expect(executeBuffer(Buffer.from("input"))).rejects.toBe(error);
      const stream = await crypto[operation](options);
      const result = buffer(stream);
      stream.end(Buffer.from("input"));
      await expect(result).rejects.toBe(error);
      expect(stream.destroyed).toBe(true);
    });
  });
});

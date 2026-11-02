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

import { Agent } from "node:https";
import { PassThrough, Readable, Writable } from "node:stream";
import { buffer } from "node:stream/consumers";
import { pipeline } from "node:stream/promises";
import fetch, { Headers, Response } from "node-fetch";
import { CommunicationProtocolEnum, DaprClient, HTTPClient, withBaggage } from "../../../../src";
import { EncryptRequest } from "../../../../src/types/crypto/Requests";

describe("HTTP crypto", () => {
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
  const options: EncryptRequest = {
    componentName: "crypto-local",
    keyName: "symmetric256",
    keyWrapAlgorithm: "A256KW",
  };
  let request: jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>>;

  const executeBuffer = (
    operation: "encrypt" | "decrypt",
    bytes: Buffer | ArrayBuffer | ArrayBufferView,
    opts = options,
  ) => (operation === "encrypt" ? client.crypto.encrypt(bytes, opts) : client.crypto.decrypt(bytes, opts));

  beforeEach(() => {
    request = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(async (_url, params) => {
      const body = params?.body;
      if (body instanceof Readable) {
        return new Response(Readable.from([await buffer(body)]));
      }
      if (Buffer.isBuffer(body)) {
        return new Response(body);
      }
      throw new Error("Expected a binary request body");
    });
    jest.spyOn(transport, "getClient").mockResolvedValue(Object.assign(request, fetch));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    request.mockReset();
  });
  afterAll(() => client.stop());

  it("PUTs raw bytes with encoded component names, all crypto headers and transport metadata", async () => {
    const bytes = Buffer.from([0, 128, 255, 123, 125]);
    const opts: EncryptRequest = Object.freeze({
      ...options,
      componentName: "store/a %\u00e9",
      dataEncryptionCipher: "chacha20-poly1305",
      omitDecryptionKeyName: true,
      decryptionKeyName: "other-key",
    });
    const result = await withBaggage({ tenant: "crypto" }, () => client.crypto.encrypt(bytes, opts));
    expect(result).toEqual(bytes);
    expect(request).toHaveBeenCalledWith(
      "https://localhost:3500/v1.0-alpha1/crypto/store%2Fa%20%25%C3%A9/encrypt",
      expect.objectContaining({ method: "PUT", body: bytes, redirect: "error" }),
    );
    const params = request.mock.calls[0][1];
    const headers = new Headers(params?.headers);
    expect(headers.get("content-type")).toBe("application/octet-stream");
    expect(headers.get("dapr-key-name")).toBe("symmetric256");
    expect(headers.get("dapr-key-wrap-algorithm")).toBe("A256KW");
    expect(headers.get("dapr-data-encryption-cipher")).toBe("chacha20-poly1305");
    expect(headers.get("dapr-omit-decryption-key-name")).toBe("true");
    expect(headers.get("dapr-decryption-key-name")).toBe("other-key");
    expect(headers.get("dapr-api-token")).toBe("test-token");
    expect(headers.get("user-agent")).toMatch(/^dapr-sdk-js\/.+ http\/1$/);
    expect(headers.get("baggage")).toBe("tenant=crypto");
    expect(params?.agent).toBeInstanceOf(Agent);
  });

  it("omits unspecified encryption headers and preserves an explicit false option", async () => {
    await client.crypto.encrypt("data", options);
    const headers = new Headers(request.mock.calls[0][1]?.headers);
    expect(headers.has("dapr-data-encryption-cipher")).toBe(false);
    expect(headers.has("dapr-omit-decryption-key-name")).toBe(false);
    expect(headers.has("dapr-decryption-key-name")).toBe(false);
    await client.crypto.encrypt("data", { ...options, omitDecryptionKeyName: false });
    expect(new Headers(request.mock.calls[1][1]?.headers).get("dapr-omit-decryption-key-name")).toBe("false");
  });

  it("decrypts with an optional key override without adding encryption-only headers", async () => {
    const bytes = Buffer.from([255, 128, 0]);
    expect(await client.crypto.decrypt(bytes, { componentName: "store/a" })).toEqual(bytes);
    expect(request.mock.calls[0][0]).toBe("https://localhost:3500/v1.0-alpha1/crypto/store%2Fa/decrypt");
    const headers = new Headers(request.mock.calls[0][1]?.headers);
    expect(headers.get("content-type")).toBe("application/octet-stream");
    expect(headers.has("dapr-key-name")).toBe(false);
    expect(headers.has("dapr-key-wrap-algorithm")).toBe(false);
    await client.crypto.decrypt(bytes, { componentName: "store/a", keyName: "override" });
    expect(new Headers(request.mock.calls[1][1]?.headers).get("dapr-key-name")).toBe("override");
  });

  it.each([
    ["Buffer", () => Buffer.from([0, 128, 255])],
    ["ArrayBuffer", () => Uint8Array.from([0, 128, 255]).buffer],
    ["Uint8Array slice", () => Uint8Array.from([99, 0, 128, 255, 99]).subarray(1, 4)],
    ["DataView slice", () => new DataView(Uint8Array.from([99, 0, 128, 255, 99]).buffer, 1, 3)],
  ] as const)("preserves exact %s bytes in both operations", async (_name, input) => {
    for (const operation of ["encrypt", "decrypt"] as const) {
      expect(await executeBuffer(operation, input())).toEqual(Buffer.from([0, 128, 255]));
    }
  });

  it("encodes strings as UTF-8 and handles empty inputs without choosing the stream overload", async () => {
    expect(await client.crypto.encrypt("Hello \u00e9 \ud83c\udf0d", options)).toEqual(
      Buffer.from("Hello \u00e9 \ud83c\udf0d", "utf8"),
    );
    expect(await client.crypto.encrypt("", options)).toEqual(Buffer.alloc(0));
    expect(await client.crypto.encrypt(Buffer.alloc(0), options)).toEqual(Buffer.alloc(0));
    expect(await client.crypto.decrypt(Buffer.alloc(0), options)).toEqual(Buffer.alloc(0));
  });

  it("does not decode binary or JSON-looking responses as text", async () => {
    for (const bytes of [Buffer.from([255, 254, 128, 0]), Buffer.from('{"secret":true}')]) {
      request.mockResolvedValueOnce(new Response(bytes));
      expect(await client.crypto.encrypt("input", options)).toEqual(bytes);
      request.mockResolvedValueOnce(new Response(bytes));
      expect(await client.crypto.decrypt(Buffer.from("ciphertext"), options)).toEqual(bytes);
    }
  });

  it("validates required options and invalid input types before sending requests", async () => {
    // @ts-expect-error Missing required options.
    await expect(client.crypto.encrypt(undefined)).rejects.toThrow("Parameter 'opts' must be defined");
    // @ts-expect-error Missing required options.
    await expect(client.crypto.decrypt(undefined)).rejects.toThrow("Parameter 'opts' must be defined");
    await expect(client.crypto.encrypt({ ...options, componentName: "" })).rejects.toThrow("componentName");
    await expect(client.crypto.decrypt({ componentName: "" })).rejects.toThrow("componentName");
    await expect(client.crypto.encrypt({ ...options, keyName: "" })).rejects.toThrow("keyName");
    // @ts-expect-error Missing wrapping algorithm.
    await expect(client.crypto.encrypt({ componentName: "store", keyName: "key" })).rejects.toThrow("keyWrapAlgorithm");
    // @ts-expect-error Input must not be an arbitrary object.
    await expect(client.crypto.encrypt({}, options)).rejects.toThrow(TypeError);
    // @ts-expect-error Ciphertext must not be a string.
    await expect(client.crypto.decrypt("ciphertext", options)).rejects.toThrow(TypeError);
    expect(request).not.toHaveBeenCalled();
  });

  it.each(["encrypt", "decrypt"] as const)(
    "supports %s streams with backpressure and binary chunks",
    async (operation) => {
      const bytes = Buffer.alloc(256 * 1024 + 17, 255);
      const chunks = Array.from({ length: 17 }, (_, i) => bytes.subarray(i * 16384, (i + 1) * 16384));
      const stream = await client.crypto[operation](options);
      expect(stream.readableObjectMode).toBe(false);
      expect(stream.writableObjectMode).toBe(false);
      const received: Buffer[] = [];
      await pipeline(
        Readable.from(chunks),
        stream,
        new Writable({
          highWaterMark: 1024,
          write(chunk, _encoding, callback) {
            received.push(Buffer.from(chunk));
            setImmediate(callback);
          },
        }),
      );
      expect(Buffer.concat(received)).toEqual(bytes);
      expect(request.mock.calls[0][0]).toBe(`https://localhost:3500/v1.0-alpha1/crypto/crypto-local/${operation}`);
      expect(new Headers(request.mock.calls[0][1]?.headers).get("dapr-api-token")).toBe("test-token");
    },
  );

  it.each(["encrypt", "decrypt"] as const)("finishes an empty %s stream", async (operation) => {
    const stream = await client.crypto[operation](options);
    stream.end();
    expect(await buffer(stream)).toEqual(Buffer.alloc(0));
  });

  it.each([400, 404, 413, 500])("propagates HTTP %s and the runtime error body for both overloads", async (status) => {
    request.mockImplementation(async () => new Response("crypto runtime failure", { status }));
    for (const operation of ["encrypt", "decrypt"] as const) {
      await expect(executeBuffer(operation, Buffer.from([0]))).rejects.toThrow(`"status":${status}`);
      const stream = await client.crypto[operation](options);
      stream.end(Buffer.from([0]));
      await expect(buffer(stream)).rejects.toThrow("crypto runtime failure");
    }
  });

  it("propagates network and response-body errors to buffers and streams", async () => {
    const error = new Error("connection reset");
    for (const operation of ["encrypt", "decrypt"] as const) {
      request.mockRejectedValueOnce(error);
      await expect(executeBuffer(operation, Buffer.from([0]))).rejects.toBe(error);
      request.mockRejectedValueOnce(error);
      const stream = await client.crypto[operation](options);
      stream.end();
      await expect(buffer(stream)).rejects.toBe(error);

      for (const streaming of [false, true]) {
        request.mockResolvedValueOnce(
          new Response(
            Readable.from(
              (async function* () {
                yield Buffer.from([0]);
                throw error;
              })(),
            ),
          ),
        );
        if (streaming) {
          const stream = await client.crypto[operation](options);
          stream.end();
          await expect(buffer(stream)).rejects.toBe(error);
        } else {
          await expect(executeBuffer(operation, Buffer.from([0]))).rejects.toThrow("connection reset");
        }
      }
    }
  });

  it("aborts the HTTP request and destroys its input when the caller destroys the duplex", async () => {
    request.mockImplementation(
      async (_url, params) =>
        new Promise<Response>((_resolve, reject) => {
          params?.signal?.addEventListener("abort", () => reject(new Error("request aborted")));
        }),
    );
    const stream = await client.crypto.encrypt(options);
    const closed = new Promise<void>((resolve) => stream.once("close", resolve));
    const result = buffer(stream);
    stream.destroy();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    await closed;
    const params = request.mock.calls[0][1];
    expect(params?.signal?.aborted).toBe(true);
    expect(params?.body).toBeInstanceOf(Readable);
    expect((params?.body as Readable).destroyed).toBe(true);
  });

  it("cancels the response when the consumer stops early", async () => {
    const body = new PassThrough();
    request.mockResolvedValueOnce(new Response(body));
    const stream = await client.crypto.decrypt(options);
    stream.end();
    body.write(Buffer.from([0, 128, 255]));
    for await (const chunk of stream) {
      expect(chunk).toEqual(Buffer.from([0, 128, 255]));
      break;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(body.destroyed).toBe(true);
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("destroys a response arriving after the duplex was cancelled", async () => {
    let respond!: (response: Response) => void;
    request.mockImplementation(
      async () =>
        new Promise<Response>((resolve) => {
          respond = resolve;
        }),
    );
    const stream = await client.crypto.encrypt(options);
    const result = buffer(stream);
    const error = new Error("cancelled by caller");
    stream.destroy(error);
    await expect(result).rejects.toBe(error);
    const body = new PassThrough();
    respond(new Response(body));
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(body.destroyed).toBe(true);
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("rejects missing and prematurely closed response streams", async () => {
    request.mockResolvedValueOnce(new Response());
    const missing = await client.crypto.encrypt(options);
    missing.end();
    await expect(buffer(missing)).rejects.toThrow("Crypto response is missing its body");

    const body = new PassThrough();
    request.mockResolvedValueOnce(new Response(body));
    const stream = await client.crypto.decrypt(options);
    stream.end();
    const result = buffer(stream);
    body.destroy();
    await expect(result).rejects.toThrow("Premature close");
  });

  it("stops a backpressured upload when the server rejects it before consuming the body", async () => {
    request.mockResolvedValueOnce(new Response("payload too large", { status: 413 }));
    const source = Readable.from([Buffer.alloc(1024 * 1024)]);
    const stream = await client.crypto.encrypt(options);
    await expect(
      pipeline(source, stream, new Writable({ write: (_chunk, _encoding, callback) => callback() })),
    ).rejects.toThrow("payload too large");
    expect(source.destroyed).toBe(true);
    expect(stream.destroyed).toBe(true);
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("propagates an input pipeline failure and aborts the pending request", async () => {
    const error = new Error("source failed");
    const stream = await client.crypto.encrypt(options);
    const source = Readable.from(
      (async function* () {
        yield Buffer.from([0]);
        throw error;
      })(),
    );
    await expect(pipeline(source, stream, new Writable({ write: (_chunk, _encoding, cb) => cb() }))).rejects.toBe(
      error,
    );
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it.each(["encrypt", "decrypt"] as const)(
    "isolates concurrent %s buffers and streams without serializing",
    async (operation) => {
      let release!: () => void;
      const ready = new Promise<void>((resolve) => {
        release = resolve;
      });
      request.mockImplementation(async (_url, params) => {
        const bytes = params?.body instanceof Readable ? await buffer(params.body) : params?.body;
        if (!Buffer.isBuffer(bytes)) {
          throw new Error("Expected binary input");
        }
        await ready;
        return new Response(Readable.from([bytes]));
      });
      const payloads = Array.from({ length: 8 }, (_, i) => Buffer.alloc(32768 + i, i));
      const results = payloads.map(async (bytes, i) => {
        const opts = { ...options, keyName: `key-${i}` };
        if (i % 2 === 0) {
          return executeBuffer(operation, bytes, opts);
        }
        const stream = await client.crypto[operation](opts);
        stream.end(bytes);
        const result = await buffer(stream);
        expect(stream.readableEnded).toBe(true);
        expect(stream.writableFinished).toBe(true);
        expect(stream.destroyed).toBe(true);
        return result;
      });
      await new Promise<void>((resolve) => setImmediate(resolve));
      try {
        expect(request).toHaveBeenCalledTimes(payloads.length);
        expect(request.mock.calls.map(([, params]) => new Headers(params?.headers).get("dapr-key-name"))).toEqual(
          payloads.map((_, i) => `key-${i}`),
        );
      } finally {
        release();
      }
      expect(await Promise.all(results)).toEqual(payloads);
    },
  );
});

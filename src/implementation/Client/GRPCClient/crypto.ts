/*
Copyright 2023 The Dapr Authors
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

import { Duplex } from "node:stream";
import { create } from "@bufbuild/protobuf";

import GRPCClient from "./GRPCClient";
import { type DecryptRequest, type EncryptRequest } from "../../../types/crypto/Requests";
import IClientCrypto from "../../../interfaces/Client/IClientCrypto";
import {
  EncryptRequestSchema,
  EncryptRequestOptionsSchema,
  DecryptRequestSchema,
  DecryptRequestOptionsSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { StreamPayloadSchema } from "../../../proto/dapr/proto/common/v1/common_pb";
import { DaprChunkedStream, DeferredAsyncIterable } from "../../../utils/Streams.util";

/**
 * gRPC-based cryptography building block implementation.
 *
 * Provides encryption and decryption operations via the Dapr sidecar.
 * Supports streaming for large payloads and both synchronous and streaming APIs.
 *
 * Uses gRPC bidirectional streaming for efficient chunked data processing.
 * Supports multiple cryptographic algorithms configured in the Dapr sidecar.
 *
 * @implements {IClientCrypto}
 * @see {@link https://docs.dapr.io/reference/api/cryptography_api/} Dapr Cryptography API
 * @see {@link DaprClient.crypto} for unified API
 *
 * @internal
 */
export default class GRPCClientCrypto implements IClientCrypto {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC cryptography building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Encrypts data or returns a duplex stream for streaming encryption.
   *
   * **Overload 1:** With data argument - encrypts buffer and returns encrypted Buffer
   * **Overload 2:** Without data - returns a Duplex stream for streaming encryption
   *
   * Uses chunked streaming internally for efficient processing of large payloads.
   * The key wrapping algorithm and encryption cipher are specified in options.
   *
   * @overload
   * @param opts - Encryption options (keyName, componentName, keyWrapAlgorithm required)
   * @returns Promise resolving to a Duplex stream for streaming encryption
   *
   * @overload
   * @param inData - Data to encrypt (Buffer, ArrayBuffer, ArrayBufferView, or string)
   * @param opts - Encryption options (keyName, componentName, keyWrapAlgorithm required)
   * @returns Promise resolving to encrypted Buffer
   *
   * @throws Rejects if required options are missing or encryption fails
   *
   * @example
   * ```typescript
   * // Encrypt a buffer
   * const encrypted = await client.crypto.encrypt(
   *   Buffer.from("secret data"),
   *   {
   *     componentName: "myencryptor",
   *     keyName: "mykey",
   *     keyWrapAlgorithm: "RSA"
   *   }
   * );
   *
   * // Stream large file
   * const stream = await client.crypto.encrypt({
   *   componentName: "myencryptor",
   *   keyName: "mykey",
   *   keyWrapAlgorithm: "RSA"
   * });
   * fs.createReadStream("largefile").pipe(stream).pipe(fs.createWriteStream("encrypted"));
   * ```
   *
   * @see {@link decrypt}
   * @see {@link https://docs.dapr.io/reference/api/cryptography_api/#encrypt}
   */
  encrypt(opts: EncryptRequest): Promise<Duplex>;
  encrypt(inData: Buffer | ArrayBuffer | ArrayBufferView | string, opts: EncryptRequest): Promise<Buffer>;
  async encrypt(
    arg0: Buffer | ArrayBuffer | ArrayBufferView | string | EncryptRequest,
    opts?: EncryptRequest,
  ): Promise<Duplex | Buffer> {
    // Handle overloading
    let inData: Buffer | undefined;
    if (opts === undefined) {
      opts = arg0 as EncryptRequest;
    } else {
      inData = this.toArrayBuffer(arg0);
    }

    if (!opts) {
      throw new Error(`Parameter 'opts' must be defined`);
    }
    if (!opts.componentName) {
      throw new Error(`Option 'componentName' is required`);
    }
    if (!opts.keyName) {
      throw new Error(`Option 'keyName' is required`);
    }
    if (!opts.keyWrapAlgorithm) {
      throw new Error(`Option 'keyWrapAlgorithm' is required`);
    }

    const encryptOpts = opts;
    const client = await this.client.getClient();

    const pusher = new DeferredAsyncIterable<ReturnType<typeof create<typeof EncryptRequestSchema>>>();

    const responseStream = client.encryptAlpha1(pusher);

    const duplexStream = new DaprChunkedStream(pusher, responseStream, (data, seq) =>
      create(EncryptRequestSchema, {
        options:
          seq === 0
            ? create(EncryptRequestOptionsSchema, {
                componentName: encryptOpts.componentName,
                keyName: encryptOpts.keyName,
                keyWrapAlgorithm: encryptOpts.keyWrapAlgorithm,
                dataEncryptionCipher: encryptOpts.dataEncryptionCipher ?? "",
                omitDecryptionKeyName: encryptOpts.omitDecryptionKeyName ?? false,
                decryptionKeyName: encryptOpts.decryptionKeyName ?? "",
              })
            : undefined,
        payload: create(StreamPayloadSchema, { data, seq: BigInt(seq) }),
      }),
    );

    return this.processStream(duplexStream, inData);
  }

  /**
   * Decrypts data or returns a duplex stream for streaming decryption.
   *
   * **Overload 1:** With data argument - decrypts buffer and returns decrypted Buffer
   * **Overload 2:** Without data - returns a Duplex stream for streaming decryption
   *
   * Uses chunked streaming internally for efficient processing of large payloads.
   * The cryptographic key and component name are specified in options.
   *
   * @overload
   * @param opts - Decryption options (componentName required; keyName optional)
   * @returns Promise resolving to a Duplex stream for streaming decryption
   *
   * @overload
   * @param inData - Encrypted data to decrypt (Buffer, ArrayBuffer, ArrayBufferView)
   * @param opts - Decryption options (componentName required; keyName optional)
   * @returns Promise resolving to decrypted Buffer
   *
   * @throws Rejects if options are invalid or decryption fails
   *
   * @example
   * ```typescript
   * // Decrypt a buffer
   * const decrypted = await client.crypto.decrypt(
   *   encryptedBuffer,
   *   {
   *     componentName: "myencryptor",
   *     keyName: "mykey"
   *   }
   * );
   *
   * // Stream large file
   * const stream = await client.crypto.decrypt({
   *   componentName: "myencryptor",
   *   keyName: "mykey"
   * });
   * fs.createReadStream("encrypted").pipe(stream).pipe(fs.createWriteStream("decrypted"));
   * ```
   *
   * @see {@link encrypt}
   * @see {@link https://docs.dapr.io/reference/api/cryptography_api/#decrypt}
   */
  decrypt(opts: DecryptRequest): Promise<Duplex>;
  decrypt(inData: Buffer | ArrayBuffer | ArrayBufferView, opts: DecryptRequest): Promise<Buffer>;
  async decrypt(
    arg0: Buffer | ArrayBuffer | ArrayBufferView | DecryptRequest,
    opts?: DecryptRequest,
  ): Promise<Duplex | Buffer> {
    // Handle overloading
    let inData: Buffer | undefined;
    if (opts === undefined) {
      opts = arg0 as DecryptRequest;
    } else {
      inData = this.toArrayBuffer(arg0);
    }

    if (!opts) {
      throw new Error(`Parameter 'opts' must be defined`);
    }

    const decryptOpts = opts;
    const client = await this.client.getClient();

    const pusher = new DeferredAsyncIterable<ReturnType<typeof create<typeof DecryptRequestSchema>>>();

    const responseStream = client.decryptAlpha1(pusher);

    const duplexStream = new DaprChunkedStream(pusher, responseStream, (data, seq) =>
      create(DecryptRequestSchema, {
        options:
          seq === 0
            ? create(DecryptRequestOptionsSchema, {
                componentName: decryptOpts.componentName,
                keyName: decryptOpts.keyName ?? "",
              })
            : undefined,
        payload: create(StreamPayloadSchema, { data, seq: BigInt(seq) }),
      }),
    );

    return this.processStream(duplexStream, inData);
  }

  /**
   * Converts various input types to a Buffer.
   *
   * @private
   * @param inData - Input data to convert (string, Buffer, ArrayBuffer, ArrayBufferView)
   * @returns The data as a Buffer
   *
   * @throws Throws if input type is invalid
   *
   * @internal
   */
  private toArrayBuffer(inData: Buffer | ArrayBuffer | ArrayBufferView | string | any): Buffer {
    if (typeof inData == "string") {
      return Buffer.from(inData, "utf8");
    } else if (typeof inData == "object" && Buffer.isBuffer(inData)) {
      return inData;
    } else if (typeof inData == "object" && ArrayBuffer.isView(inData)) {
      return Buffer.from(inData.buffer, inData.byteOffset);
    } else if (typeof inData == "object" && inData instanceof ArrayBuffer) {
      return Buffer.from(inData);
    } else {
      throw new Error(
        `Invalid value for the inData parameter: must be a Buffer, an ArrayBuffer, an ArrayBufferView, or a string`,
      );
    }
  }

  /**
   * Handles stream completion when data is provided.
   *
   * If inData is provided, buffers all output chunks and returns a resolved Buffer.
   * If inData is not provided, returns the duplex stream for manual handling.
   *
   * @private
   * @param duplexStream - The DaprChunkedStream instance
   * @param inData - Optional input data (if provided, stream is buffered)
   * @returns Promise resolving to either a Duplex stream or completed Buffer
   *
   * @internal
   */
  private processStream(duplexStream: DaprChunkedStream<any, any>, inData?: Buffer): Promise<Duplex | Buffer> {
    if (!inData) {
      return Promise.resolve(duplexStream);
    }

    return new Promise((resolve, reject) => {
      let data = Buffer.alloc(0);

      duplexStream.on("data", (chunk: Buffer) => {
        if (chunk?.length > 0) {
          data = Buffer.concat([data, chunk]);
        }
      });

      duplexStream.on("end", () => {
        resolve(data);
      });

      duplexStream.on("error", (err: Error) => {
        reject(err);
      });

      duplexStream.write(inData);
      duplexStream.end();
    });
  }
}

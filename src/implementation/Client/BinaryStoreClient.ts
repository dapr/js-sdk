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

import { addAbortSignal, Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import IClientBinaryStore from "../../interfaces/Client/IClientBinaryStore";
import { BinaryStoreOptions, BinaryStoreSetOptions } from "../../types/binarystore/BinaryStoreOptions";

export default abstract class BinaryStoreClient implements IClientBinaryStore {
  abstract setBinaryFile(
    storeName: string,
    fileName: string,
    content: Uint8Array | Readable,
    options?: BinaryStoreSetOptions,
  ): Promise<void>;
  abstract getBinaryFileChunks(
    storeName: string,
    fileName: string,
    options?: BinaryStoreOptions,
  ): AsyncIterable<Buffer>;
  abstract deleteBinaryFile(storeName: string, fileName: string, options?: BinaryStoreOptions): Promise<void>;

  async getBinaryFile(
    storeName: string,
    fileName: string,
    destination: Writable,
    options: BinaryStoreOptions = {},
  ): Promise<void> {
    if (!(destination instanceof Writable)) {
      throw new TypeError("destination must be a Writable stream");
    }
    await pipeline(this.getBinaryFileChunks(storeName, fileName, options), destination, { signal: options.signal });
  }

  async getBinaryFileBytes(storeName: string, fileName: string, options?: BinaryStoreOptions): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of this.getBinaryFileChunks(storeName, fileName, options)) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  protected validateNames(storeName: string, fileName: string): void {
    if (typeof storeName !== "string" || storeName.length === 0) {
      throw new TypeError("storeName is required");
    }
    if (typeof fileName !== "string" || fileName.length === 0) {
      throw new TypeError("fileName is required");
    }
    // Reject names that HTTP URL normalization could silently change.
    if (/[\\*?[\]#]/.test(fileName) || fileName.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new TypeError("fileName contains invalid path segments or characters");
    }
  }

  protected uploadStream(content: Uint8Array | Readable, options: BinaryStoreSetOptions): Readable {
    const chunkSize = options.chunkSize ?? 32 * 1024;
    if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) {
      throw new RangeError("chunkSize must be a positive safe integer");
    }
    if (!(content instanceof Uint8Array) && !(content instanceof Readable)) {
      throw new TypeError("content must be a Uint8Array or a binary Readable stream");
    }
    options.signal?.throwIfAborted();
    const source = content instanceof Readable ? content : Readable.from([content]);
    return Readable.from(
      (async function* () {
        options.signal?.throwIfAborted();
        if (options.signal) {
          addAbortSignal(options.signal, source);
        }
        for await (const chunk of source) {
          if (!(chunk instanceof Uint8Array)) {
            throw new TypeError("content stream must emit Uint8Array chunks");
          }
          for (let offset = 0; offset < chunk.length; offset += chunkSize) {
            options.signal?.throwIfAborted();
            yield Buffer.from(chunk.subarray(offset, offset + chunkSize));
          }
        }
      })(),
      { objectMode: true, highWaterMark: 1 },
    );
  }
}

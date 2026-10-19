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
import { BinaryStoreOptions, BinaryStoreSetOptions } from "../../types/binarystore/BinaryStoreOptions";

/** Binary Store alpha API, requiring Dapr 1.19 or later. */
export default interface IClientBinaryStore {
  /** Upload bytes or a binary readable stream. Existing files are not overwritten by default. */
  setBinaryFile(
    storeName: string,
    fileName: string,
    content: Uint8Array | Readable,
    options?: BinaryStoreSetOptions,
  ): Promise<void>;
  /** Read chunks in order without buffering the entire file. */
  getBinaryFileChunks(storeName: string, fileName: string, options?: BinaryStoreOptions): AsyncIterable<Buffer>;
  /** Write to and end destination, respecting backpressure. */
  getBinaryFile(
    storeName: string,
    fileName: string,
    destination: Writable,
    options?: BinaryStoreOptions,
  ): Promise<void>;
  /** Buffer the complete file in memory. */
  getBinaryFileBytes(storeName: string, fileName: string, options?: BinaryStoreOptions): Promise<Buffer>;
  deleteBinaryFile(storeName: string, fileName: string, options?: BinaryStoreOptions): Promise<void>;
}

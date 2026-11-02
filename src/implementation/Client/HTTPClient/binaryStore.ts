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
import HTTPClient from "./HTTPClient";
import BinaryStoreClient from "../BinaryStoreClient";
import { BinaryStoreOptions, BinaryStoreSetOptions } from "../../../types/binarystore/BinaryStoreOptions";

export default class HTTPClientBinaryStore extends BinaryStoreClient {
  constructor(private readonly client: HTTPClient) {
    super();
  }

  async setBinaryFile(
    storeName: string,
    fileName: string,
    content: Uint8Array | Readable,
    options: BinaryStoreSetOptions = {},
  ): Promise<void> {
    const path = this.path(storeName, fileName);
    const stream = this.uploadStream(content, options);
    try {
      const response = await this.client.executeStreamWithApiVersion("v1.0-alpha1", path, {
        method: options.overwrite ? "PUT" : "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: stream,
        signal: options.signal,
      });
      await response.arrayBuffer();
    } finally {
      if (content instanceof Readable) {
        content.destroy();
      }
      stream.destroy();
    }
  }

  async *getBinaryFileChunks(
    storeName: string,
    fileName: string,
    options: BinaryStoreOptions = {},
  ): AsyncIterable<Buffer> {
    const path = this.path(storeName, fileName);
    options.signal?.throwIfAborted();
    const response = await this.client.executeStreamWithApiVersion("v1.0-alpha1", path, {
      method: "GET",
      signal: options.signal,
    });
    if (!(response.body instanceof Readable)) {
      throw new Error("Binary Store response is missing its body");
    }
    for await (const chunk of response.body) {
      yield Buffer.from(chunk);
    }
  }

  async deleteBinaryFile(storeName: string, fileName: string, options: BinaryStoreOptions = {}): Promise<void> {
    const path = this.path(storeName, fileName);
    options.signal?.throwIfAborted();
    const response = await this.client.executeStreamWithApiVersion("v1.0-alpha1", path, {
      method: "DELETE",
      signal: options.signal,
    });
    await response.arrayBuffer();
  }

  private path(storeName: string, fileName: string): string {
    this.validateNames(storeName, fileName);
    return `/binarystore/${encodeURIComponent(storeName)}/${encodeURIComponent(fileName)}`;
  }
}

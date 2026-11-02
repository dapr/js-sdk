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
import { create } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import BinaryStoreClient from "../BinaryStoreClient";
import { BinaryStoreOptions, BinaryStoreSetOptions } from "../../../types/binarystore/BinaryStoreOptions";
import {
  SetBinaryFileRequestAlpha1,
  SetBinaryFileRequestAlpha1Schema,
} from "../../../proto/dapr/proto/runtime/v1/binarystore_pb";

export default class GRPCClientBinaryStore extends BinaryStoreClient {
  constructor(private readonly client: GRPCClient) {
    super();
  }

  async setBinaryFile(
    storeName: string,
    fileName: string,
    content: Uint8Array | Readable,
    options: BinaryStoreSetOptions = {},
  ): Promise<void> {
    this.validateNames(storeName, fileName);
    const stream = this.uploadStream(content, options);
    try {
      const client = await this.client.getClient();
      await client.setBinaryFileAlpha1(
        (async function* (): AsyncIterable<SetBinaryFileRequestAlpha1> {
          yield create(SetBinaryFileRequestAlpha1Schema, {
            setBinaryFileRequestType: {
              case: "initialRequest",
              value: { componentName: storeName, fileName, overwrite: options.overwrite ?? false },
            },
          });
          let seq = 0n;
          for await (const data of stream) {
            yield create(SetBinaryFileRequestAlpha1Schema, {
              setBinaryFileRequestType: { case: "payload", value: { data, seq: seq++ } },
            });
          }
        })(),
        { signal: options.signal },
      );
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
    this.validateNames(storeName, fileName);
    options.signal?.throwIfAborted();
    const client = await this.client.getClient();
    const controller = new AbortController();
    const abort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) {
      abort();
    }
    try {
      for await (const response of client.getBinaryFileAlpha1(
        { componentName: storeName, fileName },
        { signal: controller.signal },
      )) {
        if (!response.payload) {
          throw new Error("Binary Store response is missing its payload");
        }
        yield Buffer.from(response.payload.data);
      }
    } finally {
      // ConnectRPC's public iterator has no return(); abort explicitly on early exit.
      controller.abort();
      options.signal?.removeEventListener("abort", abort);
    }
  }

  async deleteBinaryFile(storeName: string, fileName: string, options: BinaryStoreOptions = {}): Promise<void> {
    this.validateNames(storeName, fileName);
    options.signal?.throwIfAborted();
    const client = await this.client.getClient();
    await client.deleteBinaryFileAlpha1({ componentName: storeName, fileName }, { signal: options.signal });
  }
}

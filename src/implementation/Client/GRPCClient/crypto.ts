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

export default class GRPCClientCrypto implements IClientCrypto {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

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

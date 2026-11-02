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

import { Duplex, PassThrough, Readable, pipeline } from "node:stream";

import HTTPClient from "./HTTPClient";
import { type DecryptRequest, type EncryptRequest } from "../../../types/crypto/Requests";
import IClientCrypto from "../../../interfaces/Client/IClientCrypto";

export default class HTTPClientCrypto implements IClientCrypto {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  encrypt(opts: EncryptRequest): Promise<Duplex>;
  encrypt(inData: Buffer | ArrayBuffer | ArrayBufferView | string, opts: EncryptRequest): Promise<Buffer>;
  async encrypt(
    arg0: Buffer | ArrayBuffer | ArrayBufferView | string | EncryptRequest,
    opts?: EncryptRequest,
  ): Promise<Duplex | Buffer> {
    const options = opts === undefined ? (arg0 as EncryptRequest) : opts;
    this.validateOptions(options);
    if (!options.keyName) {
      throw new Error("Option 'keyName' is required");
    }
    if (!options.keyWrapAlgorithm) {
      throw new Error("Option 'keyWrapAlgorithm' is required");
    }

    const headers: Record<string, string> = {
      "dapr-key-name": options.keyName,
      "dapr-key-wrap-algorithm": options.keyWrapAlgorithm,
    };
    if (options.dataEncryptionCipher !== undefined) {
      headers["dapr-data-encryption-cipher"] = options.dataEncryptionCipher;
    }
    if (options.omitDecryptionKeyName !== undefined) {
      headers["dapr-omit-decryption-key-name"] = String(options.omitDecryptionKeyName);
    }
    if (options.decryptionKeyName !== undefined) {
      headers["dapr-decryption-key-name"] = options.decryptionKeyName;
    }

    return this.execute(
      "encrypt",
      options.componentName,
      headers,
      opts === undefined ? undefined : this.toBuffer(arg0, true),
    );
  }

  decrypt(opts: DecryptRequest): Promise<Duplex>;
  decrypt(inData: Buffer | ArrayBuffer | ArrayBufferView, opts: DecryptRequest): Promise<Buffer>;
  async decrypt(
    arg0: Buffer | ArrayBuffer | ArrayBufferView | DecryptRequest,
    opts?: DecryptRequest,
  ): Promise<Duplex | Buffer> {
    const options = opts === undefined ? (arg0 as DecryptRequest) : opts;
    this.validateOptions(options);
    const headers: Record<string, string> = {};
    if (options.keyName !== undefined) {
      headers["dapr-key-name"] = options.keyName;
    }
    return this.execute(
      "decrypt",
      options.componentName,
      headers,
      opts === undefined ? undefined : this.toBuffer(arg0, false),
    );
  }

  private validateOptions(opts: DecryptRequest): void {
    if (!opts) {
      throw new Error("Parameter 'opts' must be defined");
    }
    if (!opts.componentName) {
      throw new Error("Option 'componentName' is required");
    }
  }

  private toBuffer(data: unknown, allowString: boolean): Buffer {
    if (allowString && typeof data === "string") {
      return Buffer.from(data, "utf8");
    }
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (ArrayBuffer.isView(data)) {
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    if (data instanceof ArrayBuffer) {
      return Buffer.from(data);
    }
    throw new TypeError(
      `Invalid value for the inData parameter: must be a Buffer, an ArrayBuffer, an ArrayBufferView${
        allowString ? ", or a string" : ""
      }`,
    );
  }

  private async execute(
    operation: "encrypt" | "decrypt",
    componentName: string,
    headers: Record<string, string>,
    inData?: Buffer,
  ): Promise<Duplex | Buffer> {
    const path = `/crypto/${encodeURIComponent(componentName)}/${operation}`;
    const params = {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/octet-stream" },
    };
    if (inData !== undefined) {
      const response = await this.client.executeStreamWithApiVersion("v1.0-alpha1", path, {
        ...params,
        body: inData,
      });
      return response.buffer();
    }

    const input = new PassThrough();
    const output = new PassThrough();
    const controller = new AbortController();
    const stream = Duplex.from({ writable: input, readable: output });
    stream.once("close", () => controller.abort());

    // Return before the response: Dapr buffers crypto output until the request is fully consumed.
    this.client
      .executeStreamWithApiVersion("v1.0-alpha1", path, {
        ...params,
        body: input,
        signal: controller.signal,
      })
      .then(
        (response) => {
          if (!(response.body instanceof Readable)) {
            stream.destroy(new Error("Crypto response is missing its body"));
          } else if (stream.destroyed) {
            response.body.destroy();
          } else {
            pipeline(response.body, output, (error) => {
              if (error) {
                stream.destroy(error);
              }
            });
          }
        },
        (error: Error) => stream.destroy(error),
      );
    return stream;
  }
}

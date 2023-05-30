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

import { Duplex, Readable } from "node:stream";

import GRPCClient from "./GRPCClient";
import { type DecryptRequest, type EncryptRequest } from "../../../types/crypto/Requests";
import IClientCrypto from "../../../interfaces/Client/IClientCrypto";
import {
  EncryptRequestOptions as pbEncryptRequestOptions,
  EncryptRequest as pbEncryptRequest,
  DecryptRequestOptions as pbDecryptRequestOptions,
  DecryptRequest as pbDecryptRequest,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { DaprChunkedStream } from "../../../utils/Streams.util";

export default class GRPCClientCrypto implements IClientCrypto {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async encrypt(opts: EncryptRequest): Promise<Duplex>;
  async encrypt(inData: Buffer | ArrayBuffer | ArrayBufferView | string, opts: EncryptRequest): Promise<Buffer>;
  async encrypt(
    arg0: Buffer | ArrayBuffer | ArrayBufferView | string | EncryptRequest,
    opts?: EncryptRequest,
  ): Promise<Readable | Buffer> {
    // Handle overloading
    // If we have a single argument, assume the user wants to use the Duplex stream-based approach
    let inData: ArrayBufferLike | undefined;
    if (opts === undefined) {
      opts = arg0 as EncryptRequest;
    } else {
      // Throws if arg0 is not a supported type
      inData = this.toArrayBuffer(arg0);
    }

    // Ensure required options are present
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

    // Create the gRPC stream
    const client = await this.client.getClient();
    const grpcStream = client.encryptAlpha1();

    // Create a duplex stream that will send data to the server and read from it
    const duplexStream = new DaprChunkedStream(grpcStream, pbEncryptRequest, (req) => {
      const reqOptions = new pbEncryptRequestOptions();
      reqOptions.setComponentName(opts!.componentName);
      reqOptions.setKeyName(opts!.keyName);
      reqOptions.setKeyWrapAlgorithm(opts!.keyWrapAlgorithm);
      if (opts!.dataEncryptionCipher) {
        reqOptions.setDataEncryptionCipher(opts!.dataEncryptionCipher);
      }
      if (opts!.decryptionKeyName) {
        reqOptions.setDecryptionKeyName(opts!.decryptionKeyName);
      }
      if (opts!.omitDecryptionKeyName) {
        reqOptions.setOmitDecryptionKeyName(opts!.omitDecryptionKeyName);
      }
      req.setOptions(reqOptions);
    });

    // Process the data
    return this.processStream(duplexStream, inData);
  }

  async decrypt(opts: DecryptRequest): Promise<Duplex>;
  async decrypt(inData: Buffer | ArrayBuffer | ArrayBufferView, opts: DecryptRequest): Promise<Buffer>;
  async decrypt(
    arg0: Buffer | ArrayBuffer | ArrayBufferView | DecryptRequest,
    opts?: DecryptRequest,
  ): Promise<Duplex | Buffer> {
    // Handle overloading
    // If we have a single argument, assume the user wants to use the Duplex stream-based approach
    let inData: ArrayBufferLike | undefined;
    if (opts === undefined) {
      opts = arg0 as EncryptRequest;
    } else {
      // Throws if arg0 is not a supported type
      inData = this.toArrayBuffer(arg0);
    }

    // Ensure required options are present
    if (!opts) {
      throw new Error(`Parameter 'opts' must be defined`);
    }

    // Create the gRPC stream
    const client = await this.client.getClient();
    const grpcStream = client.decryptAlpha1();

    // Create a duplex stream that will send data to the server and read from it
    const duplexStream = new DaprChunkedStream(grpcStream, pbDecryptRequest, (req) => {
      const reqOptions = new pbDecryptRequestOptions();
      reqOptions.setComponentName(opts!.componentName);
      if (opts!.keyName) {
        reqOptions.setKeyName(opts!.keyName);
      }
      req.setOptions(reqOptions);
    });

    // Process the data
    return this.processStream(duplexStream, inData);
  }

  private toArrayBuffer(inData: Buffer | ArrayBuffer | ArrayBufferView | string | any): ArrayBufferLike {
    if (typeof inData == "string") {
      return Buffer.from(inData, "utf8");
    } else if (typeof inData == "object" && ArrayBuffer.isView(inData)) {
      return inData.buffer;
    } else if (typeof inData == "object" && (Buffer.isBuffer(inData) || inData instanceof ArrayBuffer)) {
      return inData;
    } else {
      throw new Error(
        `Invalid value for the inData parameter: must be a Buffer, an ArrayBuffer, an ArrayBufferView, or a string`,
      );
    }
  }

  private processStream(duplexStream: DaprChunkedStream<any, any>, inData?: ArrayBufferLike): Promise<Duplex | Buffer> {
    // If the caller did not pass data (as a Buffer etc), return the duplex stream and stop here
    if (!inData) {
      return Promise.resolve(duplexStream);
    }

    // Send the data to the stream and wait for the response
    return new Promise((resolve, reject) => {
      let data = Buffer.alloc(0);

      // Add event listeners
      duplexStream.on("data", (chunk: Buffer | ArrayBufferView | ArrayBuffer) => {
        if (ArrayBuffer.isView(chunk)) {
          chunk = Buffer.from(chunk.buffer);
        } else if (chunk instanceof ArrayBuffer) {
          chunk = Buffer.from(chunk);
        }
        Buffer.concat([data, chunk as Buffer]);
      });
      duplexStream.on("end", () => {
        resolve(data);
      });
      duplexStream.on("error", (err: Error) => {
        reject(err);
      });

      duplexStream.write(inData);
    });
  }
}

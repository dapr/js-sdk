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

import { Readable, Writable } from "node:stream";

import GRPCClient from "./GRPCClient";
import { type DecryptRequest, type EncryptRequest } from "../../../types/crypto/Requests";
import IClientCrypto from "../../../interfaces/Client/IClientCrypto";
import {
  EncryptRequestOptions as pbEncryptRequestOptions,
  EncryptRequest as pbEncryptRequest,
  DecryptRequestOptions as pbDecryptRequestOptions,
  DecryptRequest as pbDecryptRequest,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { StreamPayload as pbStreamPayload } from "../../../proto/dapr/proto/common/v1/common_pb";
import { DaprChunkedStream } from "../../../utils/Streams.util";

export default class GRPCClientCrypto implements IClientCrypto {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async encrypt(inStream: Readable, opts: EncryptRequest): Promise<Readable> {
    // Ensure required options are present
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

    // Create a stream that will read the data from the server
    const outStream = new DaprChunkedStream(grpcStream);

    // Process the stream
    this.processStream(inStream, outStream, grpcStream, pbEncryptRequest, (req) => {
      const reqOptions = new pbEncryptRequestOptions();
      reqOptions.setComponentName(opts.componentName);
      reqOptions.setKeyName(opts.keyName);
      reqOptions.setKeyWrapAlgorithm(opts.keyWrapAlgorithm);
      if (opts.dataEncryptionCipher) {
        reqOptions.setDataEncryptionCipher(opts.dataEncryptionCipher);
      }
      if (opts.decryptionKeyName) {
        reqOptions.setDecryptionKeyName(opts.decryptionKeyName);
      }
      if (opts.omitDecryptionKeyName) {
        reqOptions.setOmitDecryptionKeyName(opts.omitDecryptionKeyName);
      }
      req.setOptions(reqOptions);
    });

    return outStream;
  }

  async decrypt(inStream: Readable, opts: DecryptRequest): Promise<Readable> {
    // Ensure required options are present
    if (!opts.componentName) {
      throw new Error(`Option 'componentName' is required`);
    }

    // Create the gRPC stream
    const client = await this.client.getClient();
    const grpcStream = client.decryptAlpha1();

    // Create a stream that will read the data from the server
    const outStream = new DaprChunkedStream(grpcStream);

    // Process the stream
    this.processStream(inStream, outStream, grpcStream, pbDecryptRequest, (req) => {
      const reqOptions = new pbDecryptRequestOptions();
      reqOptions.setComponentName(opts.componentName);
      if (opts.keyName) {
        reqOptions.setKeyName(opts.keyName);
      }
      req.setOptions(reqOptions);
    });

    return outStream;
  }

  private processStream<T extends pbEncryptRequest | pbDecryptRequest>(
    inStream: Readable,
    outStream: Readable,
    grpcStream: Writable,
    reqFactory: { new (): T },
    setReqOptionsFn: (req: T) => void,
  ) {
    // Read data from the input stream, in chunks of up to 2KB
    // Send the data until we reach the end of the input stream
    let seq = 0;
    inStream.on("readable", function () {
      let chunk: Buffer;
      while ((chunk = inStream.read(2 << 10)) !== null) {
        const req = new reqFactory();

        // If this is the first chunk, add the options
        if (seq == 0) {
          setReqOptionsFn(req);
        }

        // Add the payload
        const reqPayload = new pbStreamPayload();
        reqPayload.setData(chunk);
        reqPayload.setSeq(seq);
        req.setPayload(reqPayload);
        seq++;

        // Send the chunk
        grpcStream.write(req);
      }
    });

    inStream.on("end", function () {
      // When the input stream is done, signal that no more data will be sent to the server
      grpcStream.end();
    });

    inStream.on("error", function (err) {
      // If there's an error reading from the input stream, abort the gRPC strema
      outStream.destroy(err);
    });
  }
}

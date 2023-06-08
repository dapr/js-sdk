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

import HTTPClient from "./HTTPClient";
import { type DecryptRequest, type EncryptRequest } from "../../../types/crypto/Requests";
import IClientCrypto from "../../../interfaces/Client/IClientCrypto";

export default class GRPCClientCrypto implements IClientCrypto {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  encrypt(opts: EncryptRequest): Promise<Duplex>;
  encrypt(inData: Buffer | ArrayBuffer | ArrayBufferView | string, opts: EncryptRequest): Promise<Buffer>;
  encrypt(
    _arg0: Buffer | ArrayBuffer | ArrayBufferView | string | EncryptRequest,
    _opts?: EncryptRequest,
  ): Promise<Duplex | Buffer> {
    throw new Error("`crypto.encrypt` is not available using the HTTP APIs");
  }

  decrypt(opts: DecryptRequest): Promise<Duplex>;
  decrypt(inData: Buffer | ArrayBuffer | ArrayBufferView, opts: DecryptRequest): Promise<Buffer>;
  decrypt(
    _arg0: Buffer | ArrayBuffer | ArrayBufferView | DecryptRequest,
    _opts?: DecryptRequest,
  ): Promise<Duplex | Buffer> {
    throw new Error("`crypto.decrypt` is not available using the HTTP APIs");
  }
}

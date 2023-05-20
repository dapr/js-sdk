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

import { Readable } from "node:stream";

import HTTPClient from "./HTTPClient";
import { type DecryptRequest, type EncryptRequest } from "../../../types/crypto/Requests";
import IClientCrypto from "../../../interfaces/Client/IClientCrypto";

export default class GRPCClientCrypto implements IClientCrypto {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async encrypt(_inStream: Readable, _opts: EncryptRequest): Promise<Readable> {
    throw new Error("`crypto.encrypt` is not available using the HTTP APIs");
  }

  async decrypt(_inStream: Readable, _opts: DecryptRequest): Promise<Readable> {
    throw new Error("`crypto.decrypt` is not available using the HTTP APIs");
  }
}

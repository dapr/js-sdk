/*
Copyright 2022 The Dapr Authors
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

import * as grpc from "@grpc/grpc-js";
import Class from "../../../types/Class";
import IClientProxy from "../../../interfaces/Client/IClientProxy";
import HTTPClient from "./HTTPClient";
import { HTTPNotSupportedError } from "../../../errors/HTTPNotSupportedError";

export default class HTTPClientProxy implements IClientProxy {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async create<T>(_cls: Class<T>, _clientOptions?: Partial<grpc.ClientOptions> | undefined): Promise<T> {
    throw new HTTPNotSupportedError();
  }
}

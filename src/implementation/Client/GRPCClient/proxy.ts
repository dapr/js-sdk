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

import GRPCClient from './GRPCClient';
import * as grpc from "@grpc/grpc-js";
import Class from '../../../types/Class';
import { GRPCClientProxy as GRPCClientProxyImpl } from './GRPCClientProxy';
import IClientProxy from '../../../interfaces/Client/IClientProxy';

export default class GRPCClientProxy implements IClientProxy {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async create<T>(cls: Class<T>, daprAppId: string, clientOptions?: Partial<grpc.ClientOptions> | undefined): Promise<T> {
    const proxy = new GRPCClientProxyImpl<T>(cls, this.client, daprAppId, clientOptions);
    return proxy.build();
  }
}
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

import Class from "../../../types/Class";
import GRPCClient from "./GRPCClient";

export class GRPCClientProxy<T> {
  clsProxy: Class<T>;
  grpcClient: GRPCClient;

  constructor(clsProxy: Class<T>, grpcClient: GRPCClient) {
    this.clsProxy = clsProxy;
    this.grpcClient = grpcClient;
  }

  async build(): Promise<T> {
    throw new Error(
      "GRPCClientProxy is not supported with the ConnectRPC transport. " +
        "Use the DaprClient methods directly instead.",
    );
  }
}

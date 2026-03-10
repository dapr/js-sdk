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

// Note: GRPCClientProxy functionality is currently limited after migration to Connect.
// This is a stub implementation that maintains the interface but does not support
// full proxy functionality. Full support would require @grpc/grpc-js for custom services.
export class GRPCClientProxy<T> {
  clsProxy: Class<T>;
  grpcClient: GRPCClient;
  grpcClientOptions: Record<string, any>;

  constructor(clsProxy: Class<T>, grpcClient: GRPCClient, grpcClientOptions?: Record<string, any>) {
    this.clsProxy = clsProxy;
    this.grpcClient = grpcClient;
    this.grpcClientOptions = grpcClientOptions ?? {};
  }

  async build(): Promise<T> {
    // Ensures the sidecar is started
    await this.grpcClient.start();

    // Note: This proxy functionality is not fully implemented after Connect migration.
    // For custom gRPC services, consider using Connect-generated clients directly.
    throw new Error(
      "GRPCClientProxy is not fully supported after migration to Connect. " +
      "Please use Connect-generated clients for custom services."
    );
  }
}

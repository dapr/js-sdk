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
import { NextCall } from "@grpc/grpc-js/build/src/client-interceptors";
import Class from "../../../types/Class";
import { Settings } from "../../../utils/Settings.util";
import GRPCClient from "./GRPCClient";

export class GRPCClientProxy<T> {
  clsProxy: Class<T>;
  grpcClient: GRPCClient;
  grpcClientOptions: Partial<grpc.ClientOptions>;

  constructor(clsProxy: Class<T>, grpcClient: GRPCClient, grpcClientOptions?: Partial<grpc.ClientOptions>) {
    this.clsProxy = clsProxy;
    this.grpcClient = grpcClient;
    this.grpcClientOptions = grpcClientOptions ?? {};
  }

  generateInterceptors() {
    const interceptors = [];

    // Create an interceptor that adds 'dapr-app-id' to each call as metadata
    const interceptorDaprAppId = (options: grpc.InterceptorOptions, nextCall: NextCall): grpc.InterceptingCall => {
      return new grpc.InterceptingCall(nextCall(options), {
        start: (
          metadata: grpc.Metadata,
          listener: grpc.InterceptingListener,
          next: (metadata: grpc.Metadata, listener: grpc.InterceptingListener | grpc.Listener) => void,
        ) => {
          metadata.add("dapr-app-id", `${Settings.getAppId()}`);
          next(metadata, listener);
        },
      });
    };

    interceptors.push(interceptorDaprAppId);

    return interceptors;
  }

  async build(): Promise<T> {
    // Ensures the sidecar is started
    await this.grpcClient.start();

    // Call our method as defined in the proto
    if (!this.grpcClientOptions.interceptors) {
      this.grpcClientOptions.interceptors = [];
    }

    this.grpcClientOptions.interceptors = [
      ...this.generateInterceptors(),
      ...(this.grpcClient.getGrpcClientOptions().interceptors ?? []),
      ...this.grpcClientOptions.interceptors,
    ];

    const clientCustom = new this.clsProxy(
      `${this.grpcClient.options.daprHost}:${this.grpcClient.options.daprPort}`,
      this.grpcClient.getClientCredentials(),
      this.grpcClientOptions,
    );

    return clientCustom;
  }
}

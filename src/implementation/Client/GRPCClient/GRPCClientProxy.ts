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
import { createClient, Interceptor } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { Settings } from "../../../utils/Settings.util";
import type { GenService } from "@bufbuild/protobuf/codegenv2";

export class GRPCClientProxy<T> {
  clsProxy: Class<T> | GenService<any>;
  grpcClient: GRPCClient;
  grpcClientOptions: Record<string, any>;

  constructor(clsProxy: Class<T> | GenService<any>, grpcClient: GRPCClient, grpcClientOptions?: Record<string, any>) {
    this.clsProxy = clsProxy;
    this.grpcClient = grpcClient;
    this.grpcClientOptions = grpcClientOptions ?? {};
  }

  generateInterceptors(): Interceptor[] {
    const interceptors: Interceptor[] = [];

    // Create an interceptor that adds 'dapr-app-id' to each call as metadata
    const interceptorDaprAppId: Interceptor = (next) => async (req) => {
      req.header.set("dapr-app-id", `${Settings.getAppId()}`);
      return await next(req);
    };

    interceptors.push(interceptorDaprAppId);

    return interceptors;
  }

  async build(): Promise<T> {
    // Ensures the sidecar is started
    await this.grpcClient.start();

    // Combine interceptors from various sources
    const allInterceptors = [
      ...this.generateInterceptors(),
      ...(this.grpcClientOptions.interceptors ?? []),
    ];

    // Create a transport with the interceptors
    const transport = createGrpcTransport({
      baseUrl: `http://${this.grpcClient.options.daprHost}:${this.grpcClient.options.daprPort}`,
      interceptors: allInterceptors,
    });

    // Create and return the Connect client
    const client = createClient(this.clsProxy as GenService<any>, transport);
    return client as T;
  }
}

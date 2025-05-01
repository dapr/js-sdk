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
import { LoggerOptions } from "../logger/LoggerOptions";

export type WorkflowClientOptions = {
  /**
   * Host location of the Dapr sidecar.
   * Default is 127.0.0.1.
   */
  daprHost: string;

  /**
   * Port of the Dapr sidecar running a gRPC server.
   * Default is 50001.
   */
  daprPort: string;

  /**
   * Options related to logging.
   */
  logger?: LoggerOptions;

  /**
   * API token to authenticate with Dapr.
   * See https://docs.dapr.io/operations/security/api-token/.
   */
  daprApiToken?: string;

  /**
   * options used when initializing a grpc Channel instance.
   */
  grpcOptions?: grpc.ChannelOptions;
};

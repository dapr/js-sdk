/*
Copyright 2026 The Dapr Authors
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

import { LoggerOptions } from "../logger/LoggerOptions";
import type { Interceptor } from "@connectrpc/connect";

/**
 * Options for configuring the workflow gRPC transport.
 * Compatible with legacy @grpc/grpc-js ChannelOptions.
 */
export type GrpcChannelOptions = {
  "grpc.max_receive_message_length"?: number;
  "grpc.max_send_message_length"?: number;
  "grpc.primary_user_agent"?: string;
  interceptors?: Interceptor[] | any[];
  [key: string]: any;
};

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
   * Options used when initializing the gRPC channel.
   * Compatible with legacy @grpc/grpc-js ChannelOptions.
   */
  grpcOptions?: GrpcChannelOptions | Record<string, any>;
};

/**
 * Maps legacy @grpc/grpc-js channel options to the equivalent
 * @connectrpc/connect-node transport options.
 */
export function mapGrpcOptions(opts?: GrpcChannelOptions): {
  readMaxBytes?: number;
  writeMaxBytes?: number;
} {
  if (!opts) return {};
  const result: { readMaxBytes?: number; writeMaxBytes?: number } = {};
  if (typeof opts["grpc.max_receive_message_length"] === "number") {
    result.readMaxBytes = opts["grpc.max_receive_message_length"];
  }
  if (typeof opts["grpc.max_send_message_length"] === "number") {
    result.writeMaxBytes = opts["grpc.max_send_message_length"];
  }
  return result;
}

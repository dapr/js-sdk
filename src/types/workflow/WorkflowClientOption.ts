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

/**
 * Configuration options for {@link DaprWorkflowClient} and {@link WorkflowRuntime}.
 *
 * Specifies how to connect to the Dapr sidecar for workflow management and orchestration.
 * Settings include host/port for sidecar communication, authentication, and logging configuration.
 *
 * @example
 * ```typescript
 * const options: Partial<WorkflowClientOptions> = {
 *   daprHost: "localhost",
 *   daprPort: "50001",
 *   daprApiToken: process.env.DAPR_API_TOKEN,
 *   logger: { level: "info" }
 * };
 *
 * const client = new DaprWorkflowClient(options);
 * const runtime = new WorkflowRuntime(options);
 * ```
 *
 * @see {@link DaprWorkflowClient} Workflow client for instance management
 * @see {@link WorkflowRuntime} Workflow runtime for orchestration
 */
export type WorkflowClientOptions = {
  /**
   * Hostname of the Dapr sidecar running the workflow engine.
   *
   * @default "127.0.0.1" (localhost)
   * @env DAPR_HOST
   */
  daprHost: string;

  /**
   * Port number of the gRPC server exposed by the Dapr sidecar.
   * This is the port used for all workflow and orchestration RPC calls.
   *
   * @default "50001"
   * @env DAPR_GRPC_PORT
   */
  daprPort: string;

  /**
   * Logging configuration for the client and runtime.
   *
   * Controls verbosity level, log format, and output destination.
   * Optional; defaults to INFO level logging.
   *
   * @see {@link LoggerOptions}
   */
  logger?: LoggerOptions;

  /**
   * API token for authenticating with the Dapr sidecar (mTLS alternative).
   *
   * When set, this token is included in request metadata for API authentication.
   * Requires the sidecar to be configured with API token validation enabled.
   *
   * @env DAPR_API_TOKEN
   * @see {@link https://docs.dapr.io/operations/security/api-token/}
   */
  daprApiToken?: string;

  /**
   * gRPC channel options for customizing the underlying gRPC connection.
   *
   * Allows fine-tuning connection pooling, keep-alive settings, compression,
   * TLS configuration, and other gRPC-level transport options.
   *
   * @see {@link https://grpc.io/docs/guides/performance-best-practices/}
   */
  grpcOptions?: grpc.ChannelOptions;
};

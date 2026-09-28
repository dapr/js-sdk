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

import { create } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import IClientHealth from "../../../interfaces/Client/IClientHealth";
import { GetMetadataRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";

/**
 * gRPC-based health check building block implementation.
 *
 * Provides health status monitoring for the Dapr sidecar.
 * Uses the metadata endpoint as a proxy for sidecar health (gRPC has no dedicated health endpoint).
 *
 * @implements {IClientHealth}
 * @see {@link https://docs.dapr.io/reference/api/health_api/} Dapr Health API
 * @see {@link DaprClient.health} for unified API
 *
 * @internal
 */
export default class GRPCClientHealth implements IClientHealth {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC health check building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Checks if the Dapr sidecar is healthy and responding.
   *
   * Attempts to fetch sidecar metadata. Returns true if successful, false on any error.
   * Note: gRPC protocol does not have a dedicated health endpoint, so metadata is used as a proxy.
   *
   * @returns Promise resolving to true if sidecar is healthy, false otherwise
   *
   * @example
   * ```typescript
   * const isHealthy = await client.health.isHealthy();
   * if (isHealthy) {
   *   console.log("Sidecar is responsive");
   * } else {
   *   console.log("Sidecar is not responding");
   * }
   * ```
   *
   * @see {@link https://docs.dapr.io/reference/api/health_api/#checking-sidecar-health}
   */
  async isHealthy(): Promise<boolean> {
    const client = await this.client.getClient();

    try {
      await client.getMetadata(create(GetMetadataRequestSchema));
      return true;
    } catch (e) {
      return false;
    }
  }
}

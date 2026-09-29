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
import { GetMetadataRequestSchema, SetMetadataRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientMetadata from "../../../interfaces/Client/IClientMetadata";
import { GetMetadataResponse as GetMetadataResponseResult } from "../../../types/metadata/GetMetadataResponse";

/**
 * gRPC-based metadata building block implementation.
 *
 * Provides access to Dapr sidecar metadata including runtime info, active actors,
 * registered components, and extended metadata. Also allows setting custom metadata key-value pairs.
 *
 * @implements {IClientMetadata}
 * @see {@link https://docs.dapr.io/reference/api/metadata_api} Dapr Metadata API
 * @see {@link DaprClient.metadata} for unified API
 *
 * @internal
 */
export default class GRPCClientMetadata implements IClientMetadata {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC metadata building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Retrieves metadata about the Dapr runtime and sidecar configuration.
   *
   * Returns sidecar ID, active actor counts, registered components, and extended metadata.
   * This is useful for introspection and debugging the Dapr environment.
   *
   * @returns Promise resolving to metadata response containing:
   *          - id: Dapr runtime ID
   *          - actors: Array of active actor types with counts
   *          - components: Array of registered components (state, pub/sub, bindings, etc.)
   *          - extended: Extended metadata key-value pairs
   *
   * @throws Rejects if metadata retrieval fails
   *
   * @example
   * ```typescript
   * const metadata = await client.metadata.get();
   * console.log("Dapr ID:", metadata.id);
   * console.log("Active actors:", metadata.actors); // [{ type: "timer", count: 5 }]
   * console.log("Components:", metadata.components); // [{ name: "statestore", type: "state", ...}]
   * ```
   *
   * @see {@link https://docs.dapr.io/reference/api/metadata_api/#getting-metadata}
   */
  async get(): Promise<GetMetadataResponseResult> {
    const client = await this.client.getClient();
    const res = await client.getMetadata(create(GetMetadataRequestSchema));

    const wrapped: GetMetadataResponseResult = {
      id: res.id,
      actors: res.activeActorsCount.map((a) => ({
        type: a.type,
        count: a.count,
      })),
      extended: Object.entries(res.extendedMetadata).reduce((result: object, [key, value]) => {
        // @ts-ignore
        result[key] = value;
        return result;
      }, {}),
      components: res.registeredComponents.map((c) => ({
        name: c.name,
        type: c.type,
        version: c.version,
        capabilities: c.capabilities,
      })),
    };

    return wrapped;
  }

  /**
   * Sets custom metadata on the Dapr sidecar.
   *
   * Stores a key-value pair in the sidecar's extended metadata dictionary.
   * Useful for runtime configuration and passing data between services.
   *
   * @param key - Metadata key
   * @param value - Metadata value (string)
   *
   * @returns Promise resolving to true if successful, false if set fails
   *
   * @example
   * ```typescript
   * const success = await client.metadata.set("deployment-version", "1.2.3");
   * if (success) {
   *   console.log("Metadata updated");
   * }
   * ```
   *
   * @see {@link get}
   */
  async set(key: string, value: string): Promise<boolean> {
    const client = await this.client.getClient();

    try {
      await client.setMetadata(create(SetMetadataRequestSchema, { key, value }));
      return true;
    } catch (_err) {
      return false;
    }
  }
}


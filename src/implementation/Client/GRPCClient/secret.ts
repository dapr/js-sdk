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
import { GetBulkSecretRequestSchema, GetSecretRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientSecret from "../../../interfaces/Client/IClientSecret";

/**
 * gRPC-based secrets management building block implementation.
 *
 * Provides secure access to secrets stored in external secret management systems.
 * Supports retrieving individual secrets and bulk operations for efficiency.
 *
 * Configured secret stores may include HashiCorp Vault, Azure Key Vault, AWS Secrets Manager, etc.
 *
 * @implements {IClientSecret}
 * @see {@link https://docs.dapr.io/reference/api/secrets_api/} Dapr Secrets API
 * @see {@link DaprClient.secret} for unified API
 *
 * @internal
 */
export default class GRPCClientSecret implements IClientSecret {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC secrets building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Retrieves a single secret from the secret store.
   *
   * @param secretStoreName - Name of the configured secret store
   * @param key - Key of the secret to retrieve
   * @param _metadata - Optional store-specific metadata (unused for most stores)
   *
   * @returns Promise resolving to object with secret key-value pairs
   *
   * @throws Rejects if secret store is unavailable or key does not exist
   *
   * @example
   * ```typescript
   * const secret = await client.secret.get("vault", "database-password");
   * // secret: { "database-password": "p@ssw0rd" }
   * ```
   *
   * @see {@link getSecret}
   */
  async get(secretStoreName: string, key: string, _metadata = ""): Promise<object> {
    const client = await this.client.getClient();

    const res = await client.getSecret(create(GetSecretRequestSchema, {
      storeName: secretStoreName,
      key,
    }));

    // res.data is { [secretKey]: secretValue }
    // Return the first entry as { [key]: value }
    const entries = Object.entries(res.data);
    if (entries.length === 0) {
      return {};
    }
    return { [entries[0][0]]: entries[0][1] };
  }

  async getBulk(secretStoreName: string): Promise<object> {
    const client = await this.client.getClient();

    const res = await client.getBulkSecret(create(GetBulkSecretRequestSchema, {
      storeName: secretStoreName,
    }));

    // res.data is { [key]: SecretResponse } where SecretResponse.secrets is { [secretKey]: secretValue }
    // Convert to { [key]: { [secretKey]: secretValue } }
    const result: Record<string, Record<string, string>> = {};
    for (const [key, secretResponse] of Object.entries(res.data)) {
      result[key] = secretResponse.secrets;
    }
    return result;
  }
}

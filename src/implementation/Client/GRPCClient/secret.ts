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

// https://docs.dapr.io/reference/api/secrets_api/
export default class GRPCClientSecret implements IClientSecret {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

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

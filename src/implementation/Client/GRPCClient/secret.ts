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

import GRPCClient from "./GRPCClient";
import {
  GetBulkSecretRequestSchema,
  GetBulkSecretResponse,
  GetSecretRequestSchema,
  GetSecretResponse,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientSecret from "../../../interfaces/Client/IClientSecret";
import { create } from "@bufbuild/protobuf";
import { convertToMap } from "../../../utils/Client.util";

// https://docs.dapr.io/reference/api/secrets_api/
export default class GRPCClientSecret implements IClientSecret {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // @todo: implement metadata
  async get(secretStoreName: string, key: string, _metadata = ""): Promise<object> {
    const msgService = create(GetSecretRequestSchema);
    msgService.storeName = secretStoreName;
    msgService.key = key;

    const client = await this.client.getClient();
    const res = await client.getSecret(msgService);

    // Convert Map to array of entries, then to objects
    const items = Array.from(convertToMap(res.data).entries())
      .map((item) => ({ [item[0]]: item[1] }));

    // Return the first item (it's a single get)
    return items[0];
  }

  async getBulk(secretStoreName: string): Promise<object> {
    const msgService = create(GetBulkSecretRequestSchema);
    msgService.storeName = secretStoreName;

    const client = await this.client.getClient();
    const res = await client.getBulkSecret(msgService);

    // https://docs.dapr.io/reference/api/secrets_api/#response-body-1
    // Convert the data map to a plain object
    const result: any = {};
    for (const [key, value] of Object.entries(res.data)) {
      result[key] = value.secrets;
    }
    return result;
  }
}

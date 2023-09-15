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
  GetBulkSecretRequest,
  GetBulkSecretResponse,
  GetSecretRequest,
  GetSecretResponse,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientSecret from "../../../interfaces/Client/IClientSecret";
import { promisify } from "util";

// https://docs.dapr.io/reference/api/secrets_api/
export default class GRPCClientSecret implements IClientSecret {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // @todo: implement metadata
  async get(secretStoreName: string, key: string, _metadata = ""): Promise<object> {
    const msgService = new GetSecretRequest();
    msgService.setStoreName(secretStoreName);
    msgService.setKey(key);

    const client = await this.client.getClient();

    const getSecret = promisify<GetSecretRequest, GetSecretResponse>(client.getSecret).bind(client);
    const res = await getSecret(msgService);

    // Convert [ [ 'TEST_SECRET_1', 'secret_val_1' ] ] => [ { TEST_SECRET_1: 'secret_val_1' } ]
    const items = res
      .getDataMap()
      .getEntryList()
      .map((item) => ({ [item[0]]: item[1] }));

    return items[0];
  }

  async getBulk(secretStoreName: string): Promise<object> {
    const msgService = new GetBulkSecretRequest();
    msgService.setStoreName(secretStoreName);

    const client = await this.client.getClient();

    const getBulkSecret = promisify<GetBulkSecretRequest, GetBulkSecretResponse>(client.getBulkSecret).bind(client);
    const res = await getBulkSecret(msgService);

    // https://docs.dapr.io/reference/api/secrets_api/#response-body-1
    // @ts-ignore
    // tslint:disable-next-line
    return res.getDataMap()["map_"];
  }
}

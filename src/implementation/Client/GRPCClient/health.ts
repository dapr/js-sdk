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
import IClientHealth from "../../../interfaces/Client/IClientHealth";
import { GetMetadataRequest, GetMetadataResponse } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";

// https://docs.dapr.io/reference/api/health_api/
export default class GRPCClientHealth implements IClientHealth {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // There is no gRPC implementation of /healthz, so we try to fetch the metadata
  async isHealthy(): Promise<boolean> {
    const client = await this.client.getClient();

    return new Promise((resolve, _reject) => {
      try {
        client.getMetadata(new GetMetadataRequest(), (err, _res: GetMetadataResponse) => {
          if (err) {
            return resolve(false);
          }

          return resolve(true);
        });
      } catch (e) {
        return resolve(false);
      }
    });
  }
}

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
import IClientSidecar from "../../../interfaces/Client/IClientSidecar";
import { GetMetadataRequest, GetMetadataResponse, ShutdownRequest } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

// https://docs.dapr.io/reference/api/secrets_api/
export default class GRPCClientSidecar implements IClientSidecar {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async shutdown(): Promise<void> {
    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.shutdown(new ShutdownRequest(), (err, _res: Empty) => {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
    });
  }

  static async isStarted(client: GRPCClient): Promise<boolean> {
    const callClient = await client.getClient(false);

    return new Promise((resolve, _reject) => {
      try {
        callClient.getMetadata(new GetMetadataRequest(), (err, _res: GetMetadataResponse) => {
          if (err) {
            return resolve(false);
          }

          return resolve(true);
        });
      } catch (_e) {
        return resolve(false);
      }
    });
  }
}

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
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { promisify } from "util";

// https://docs.dapr.io/reference/api/secrets_api/
export default class GRPCClientSidecar implements IClientSidecar {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async shutdown(): Promise<void> {
    const client = await this.client.getClient();

    const shutdown = promisify(client.shutdown).bind(client);
    await shutdown(new Empty());
  }

  static async isStarted(client: GRPCClient): Promise<boolean> {
    const callClient = await client.getClient(false);

    const getMetadata = promisify(callClient.getMetadata).bind(callClient);
    let isStarted = false;
    try {
      await getMetadata(new Empty());
      isStarted = true;
    } catch (e) {
      // Nothing to do
    }

    return isStarted;
  }
}

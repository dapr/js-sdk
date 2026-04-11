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
import IClientSidecar from "../../../interfaces/Client/IClientSidecar";
import { GetMetadataRequestSchema, ShutdownRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";

// https://docs.dapr.io/reference/api/secrets_api/
export default class GRPCClientSidecar implements IClientSidecar {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async shutdown(): Promise<void> {
    const client = await this.client.getClient();
    await client.shutdown(create(ShutdownRequestSchema));
  }

  static async isStarted(client: GRPCClient): Promise<boolean> {
    const callClient = await client.getClient(false);

    try {
      await callClient.getMetadata(create(GetMetadataRequestSchema));
      return true;
    } catch (_e) {
      return false;
    }
  }
}

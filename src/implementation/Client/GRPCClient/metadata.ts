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
  GetMetadataRequest,
  GetMetadataResponse,
  SetMetadataRequest,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import IClientMetadata from "../../../interfaces/Client/IClientMetadata";
import { GetMetadataResponse as GetMetadataResponseResult } from "../../../types/metadata/GetMetadataResponse";

// https://docs.dapr.io/reference/api/metadata_api
export default class GRPCClientMetadata implements IClientMetadata {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // There is no gRPC implementation of /healthz, so we try to fetch the metadata
  async get(): Promise<GetMetadataResponseResult> {
    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.getMetadata(new GetMetadataRequest(), (err, res: GetMetadataResponse) => {
        if (err) {
          return reject(err);
        }

        const wrapped: GetMetadataResponseResult = {
          id: res.getId(),
          actors: res.getActiveActorsCountList().map((a) => ({
            type: a.getType(),
            count: a.getCount(),
          })),
          extended: res
            .getExtendedMetadataMap()
            .toObject()
            .reduce((result: object, [key, value]) => {
              // @ts-ignore
              result[key] = value;
              return result;
            }, {}),
          components: res.getRegisteredComponentsList().map((c) => ({
            name: c.getName(),
            type: c.getType(),
            version: c.getVersion(),
            capabilities: c.getCapabilitiesList(),
          })),
        };

        return resolve(wrapped);
      });
    });
  }

  async set(key: string, value: string): Promise<boolean> {
    const msg = new SetMetadataRequest();
    msg.setKey(key);
    msg.setValue(value);

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.setMetadata(msg, (err, _res: Empty) => {
        if (err) {
          return reject(false);
        }

        return resolve(true);
      });
    });
  }
}

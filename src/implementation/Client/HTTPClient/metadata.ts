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

import HTTPClient from "./HTTPClient";
import { GetMetadataResponse } from "../../../types/metadata/GetMetadataResponse";
import IClientMetadata from "../../../interfaces/Client/IClientMetadata";

// https://docs.dapr.io/reference/api/metadata_api
export default class HTTPClientMetadata implements IClientMetadata {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async get(): Promise<GetMetadataResponse> {
    const result = await this.client.execute(`/metadata`);
    return result as GetMetadataResponse;
  }

  async set(key: string, value: string): Promise<boolean> {
    await this.client.execute(`/metadata/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
      },
      body: value,
    });

    return true;
  }
}

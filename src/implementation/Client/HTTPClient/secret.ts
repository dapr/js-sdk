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
import IClientSecret from "../../../interfaces/Client/IClientSecret";

// https://docs.dapr.io/reference/api/secrets_api/
export default class HTTPClientSecret implements IClientSecret {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async get(secretStoreName: string, key: string, metadata = ""): Promise<object> {
    const result = await this.client.execute(`/secrets/${secretStoreName}/${key}${metadata ? `?${metadata}` : ""}`);
    return result as object;
  }

  async getBulk(secretStoreName: string): Promise<object> {
    const result = await this.client.execute(`/secrets/${secretStoreName}/bulk`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return result as object;
  }
}

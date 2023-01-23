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
import IClientBinding from "../../../interfaces/Client/IClientBinding";

// https://docs.dapr.io/reference/api/bindings_api/
export default class HTTPClientBinding implements IClientBinding {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  // Send an event to an external system
  async send(bindingName: string, operation: string, data: any, metadata: object = {}): Promise<object> {
    const result = await this.client.execute(`/bindings/${bindingName}`, {
      method: "POST",
      body: {
        operation,
        data,
        metadata,
      },
    });

    return result as object;
  }
}

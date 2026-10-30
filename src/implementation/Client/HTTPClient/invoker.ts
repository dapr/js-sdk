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
import { HttpMethod } from "../../../enum/HttpMethod.enum";
import IClientInvoker from "../../../interfaces/Client/IClientInvoker";
import { InvokerOptions } from "../../../types/InvokerOptions.type";

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class HTTPClientInvoker implements IClientInvoker {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  /**
   * Invokes a method on a remote service.
   * @deprecated Use a native HTTP or gRPC client for service invocation.
   * @see https://docs.dapr.io/developing-applications/building-blocks/service-invocation/howto-invoke-discover-services/
   */
  async invoke(
    appId: string,
    methodName: string,
    method: HttpMethod = HttpMethod.GET,
    data?: any,
    options: InvokerOptions = {},
  ): Promise<object> {
    const headers = options.headers ?? {};

    const fetchOptions = {
      method,
      headers,
      body: data,
      serializer: this.client.options.serializer,
      responseType: this.client.options.serializer ? ("text" as const) : undefined,
    };

    const result = await this.client.execute(`/invoke/${appId}/method/${methodName}`, fetchOptions);
    if (this.client.options.serializer && typeof result === "string" && result !== "") {
      return this.client.options.serializer.deserialize<object>(result);
    }
    return result as object;
  }
}

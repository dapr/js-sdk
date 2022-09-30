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


import HTTPClient from './HTTPClient';
import { HttpMethod } from '../../../enum/HttpMethod.enum';
import IClientInvoker from '../../../interfaces/Client/IClientInvoker';
import { InvokerOptions } from '../../../types/InvokerOptions.type';


// https://docs.dapr.io/reference/api/service_invocation_api/
export default class HTTPClientInvoker implements IClientInvoker {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async invoke(appId: string, methodName: string, method: HttpMethod = HttpMethod.GET, data?: object, options: InvokerOptions = {}): Promise<object> {

    const headers = options.headers ?? {}
 
    const fetchOptions = {
      method,

      headers
    };

    if (method !== HttpMethod.GET) {
       //@ts-ignore
      fetchOptions.headers['Content-Type'] = 'application/json';

    }

    if (method !== HttpMethod.GET && data !== undefined) {
      //@ts-ignore
      fetchOptions.body = JSON.stringify(data);
    }

    const result = await this.client.execute(`/invoke/${appId}/method/${methodName}`, fetchOptions);
    return result as object;
  }
}

import HTTPClient from './HTTPClient';
import { HttpMethod } from '../../../enum/HttpMethod.enum';
import IClientInvoker from '../../../interfaces/Client/IClientInvoker';

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class HTTPClientInvoker implements IClientInvoker {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async invoke(appId: string, methodName: string, method: HttpMethod = HttpMethod.GET, data: object = {}): Promise<object> {
    const fetchOptions = {
      method
    };

    if (method !== HttpMethod.GET) {
      // @ts-ignore
      fetchOptions.headers = {
        'Content-Type': 'application/json'
      };
    }

    if (method !== HttpMethod.GET && data !== {}) {
      // @ts-ignore
      fetchOptions.body = JSON.stringify(data);
    }

    const result = await this.client.execute(`/invoke/${appId}/method/${methodName}`, fetchOptions);
    return result as object;
  }
}

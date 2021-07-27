import { HttpMethod } from '../../enum/HttpMethod.enum';
import HTTPClient from './HTTPClient';
import IClientInvokerStrategy from '../IClientInvokerStrategy';
import HttpStatusCode from '../../enum/HttpStatusCode.enum';

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class DaprClientInvoker implements IClientInvokerStrategy {
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

    const res = await this.client.execute(`/invoke/${appId}/method/${methodName}`, fetchOptions);

    switch (res.status) {
      case HttpStatusCode.OK: {
        try {
          const json = await res.json();
          return json;
        } catch (e) {
          const text = await res.text();
          return text;
        }
      }
      case HttpStatusCode.NO_CONTENT:
        return {}; // empty response
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "MALFORMED_REQUEST",
          error_msg: `The request was malformed and failed, was the method name given?`
        }));
      case HttpStatusCode.FORBIDDEN:
        throw new Error(JSON.stringify({
          error: "INVOCATION_FORBIDDEN",
          error_msg: `The request was forbidden by access control`
        }))
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify({
          error: "REQUEST_FAILED",
          error_msg: `The request failed with error: ${json}`
        }));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured upstream and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }
}

import HTTPClient from './HTTPClient';
import HttpStatusCode from '../../../enum/HttpStatusCode.enum';
import IClientSecret from '../../../interfaces/Client/IClientSecret';

// https://docs.dapr.io/reference/api/secrets_api/
export default class DaprClientSecret implements IClientSecret {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async get(secretStoreName: string, key: string, metadata: string = ""): Promise<object> {
    const res = await this.client.execute(`/secrets/${secretStoreName}/${key}${metadata ? `?${metadata}` : ""}`);
    
    switch (res.status) {
      case HttpStatusCode.OK: {
        const json = await res.json();
        return json;
      }
      case HttpStatusCode.NO_CONTENT:
        return {}; // empty response, secret not found
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "MALFORMED_REQUEST",
          error_msg: `The request was malformed and failed, is the secret store missing or misconfigured?`
        }));
      case HttpStatusCode.FORBIDDEN:
        throw new Error(JSON.stringify({
          error: "FORBIDDEN",
          error_msg: "Access denied by access control"
        }))
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async getBulk(secretStoreName: string): Promise<object> {
    const res = await this.client.execute(`/secrets/${secretStoreName}/bulk`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      }
    });

    switch (res.status) {
      case HttpStatusCode.OK: {
        const json = await res.json();
        return json;
      }
      case HttpStatusCode.NO_CONTENT:
        return {}; // empty response
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "MALFORMED_REQUEST",
          error_msg: `The request was malformed and failed, is the secret store missing or misconfigured?`
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }
}

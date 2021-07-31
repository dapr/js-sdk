import HTTPClient from './HTTPClient';
import HttpStatusCode from '../../../enum/HttpStatusCode.enum';
import IClientBinding from '../../../interfaces/Client/IClientBinding';

// https://docs.dapr.io/reference/api/bindings_api/
export default class DaprClientBinding implements IClientBinding {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  // Send an event to an external system
  async send(bindingName: string, operation: string, data: any, metadata: object = {}): Promise<object> {
    const res = await this.client.execute(`/bindings/${bindingName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        data,
        metadata
      }),
    });

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
          error_msg: `The request was malformed and failed`
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

import HTTPClient from './HTTPClient';
import IClientBinding from '../../../interfaces/Client/IClientBinding';

// https://docs.dapr.io/reference/api/bindings_api/
export default class HTTPClientBinding implements IClientBinding {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  // Send an event to an external system
  async send(bindingName: string, operation: string, data: any, metadata: object = {}): Promise<object> {
    const result = await this.client.execute(`/bindings/${bindingName}`, {
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

    return result as object;
  }
}

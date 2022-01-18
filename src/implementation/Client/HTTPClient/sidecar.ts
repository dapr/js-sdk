import HTTPClient from './HTTPClient';
import IClientSidecar from '../../../interfaces/Client/IClientSidecar';

// https://docs.dapr.io/reference/api/bindings_api/
export default class HTTPClientSidecar implements IClientSidecar {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async shutdown(): Promise<void> {
    await this.client.execute(`/shutdown`, {
      method: 'POST'
    });
  }
}

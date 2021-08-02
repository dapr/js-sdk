import HTTPClient from './HTTPClient';
import IClientSecret from '../../../interfaces/Client/IClientSecret';

// https://docs.dapr.io/reference/api/secrets_api/
export default class DaprClientSecret implements IClientSecret {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async get(secretStoreName: string, key: string, metadata: string = ""): Promise<object> {
    const result = await this.client.execute(`/secrets/${secretStoreName}/${key}${metadata ? `?${metadata}` : ""}`);
    return result as object;
  }

  async getBulk(secretStoreName: string): Promise<object> {
    const result = await this.client.execute(`/secrets/${secretStoreName}/bulk`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      }
    });

    return result as object;
  }
}

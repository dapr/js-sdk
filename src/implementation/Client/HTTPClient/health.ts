import HTTPClient from './HTTPClient';
import IClientHealth from '../../../interfaces/Client/IClientHealth';

// https://docs.dapr.io/reference/api/health_api/
export default class HTTPClientHealth implements IClientHealth {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  // Send an event to an external system
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.execute(`/healthz`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return true;
    } catch (e) {
      return false;
    }
  }
}

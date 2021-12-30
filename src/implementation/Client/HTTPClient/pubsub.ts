import HTTPClient from './HTTPClient';
import IClientPubSub from '../../../interfaces/Client/IClientPubSub';

// https://docs.dapr.io/reference/api/pubsub_api/
export default class HTTPClientPubSub implements IClientPubSub {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async publish(pubSubName: string, topic: string, data: object = {}): Promise<Boolean> {
    try {
      await this.client.execute(`/publish/${pubSubName}/${topic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  }
}
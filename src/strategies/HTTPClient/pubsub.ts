import IClientPubSubStrategy from '../IClientPubSubStrategy';
import HTTPClient from './HTTPClient';

// https://docs.dapr.io/reference/api/pubsub_api/
export default class DaprClientPubSub implements IClientPubSubStrategy {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async publish(pubSubName: string, topic: string, data: object = {}): Promise<number> {
    const res = await this.client.execute(`/publish/${pubSubName}/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Returns 200 or 500
    return res.status;
  }
}
import { PublishEventRequest } from "../proto/dapr/proto/runtime/v1/dapr_pb";
import GRPCClient from './GRPCClient';

// https://docs.dapr.io/reference/api/pubsub_api/
export default class GRPCClientPubSub {
  client: GRPCClient;

  constructor(client: GRPCClient) {
      this.client = client;
  }

  // @todo: should return a specific typed Promise<TypePubSubPublishResponse> instead of Promise<any>
  async publish(pubSubName: string, topic: string, data: object = {}): Promise<any> {
    const msgService = new PublishEventRequest();
    msgService.setPubsubName(pubSubName);
    msgService.setTopic(topic);
    msgService.setData(Buffer.from(JSON.stringify(data), "utf-8"));

    return new Promise(async (resolve, reject) => {
      const client = this.client.getClient();
      client.publishEvent(msgService, (err, res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/pubsub_api/#expected-http-response
        return resolve({});
      });
    });
  }
}

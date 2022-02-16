import GRPCClient from './GRPCClient';
import IClientSidecar from "../../../interfaces/Client/IClientSidecar";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

// https://docs.dapr.io/reference/api/secrets_api/
export default class GRPCClientSidecar implements IClientSidecar {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.shutdown(new Empty(), (err, _res: Empty) => {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
    });
  }
}
import GRPCClient from './GRPCClient';
import IClientHealth from '../../../interfaces/Client/IClientHealth';
import { GetMetadataResponse } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

// https://docs.dapr.io/reference/api/health_api/
export default class GRPCClientHealth implements IClientHealth {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // There is no gRPC implementation of /healthz, so we try to fetch the metadata
  async isHealthy(): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      const client = this.client.getClient();

      try {
        client.getMetadata(new Empty(), (err, _res: GetMetadataResponse) => {
          if (err) {
            return resolve(false);
          }

          return resolve(true);
        });
      } catch (e) {
        return resolve(false);
      }
    });
  }
}

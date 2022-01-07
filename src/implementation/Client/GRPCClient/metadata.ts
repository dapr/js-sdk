import GRPCClient from './GRPCClient';
import { GetMetadataResponse, SetMetadataRequest } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import IClientMetadata from '../../../interfaces/Client/IClientMetadata';
import { GetMetadataResponse as GetMetadataResponseResult } from '../../../types/metadata/GetMetadataResponse';

// https://docs.dapr.io/reference/api/metadata_api
export default class GRPCClientMetadata implements IClientMetadata {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // There is no gRPC implementation of /healthz, so we try to fetch the metadata
  async get(): Promise<GetMetadataResponseResult> {
    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.getMetadata(new Empty(), (err, res: GetMetadataResponse) => {
        if (err) {
          return reject(err);
        }

        const wrapped: GetMetadataResponseResult = {
          id: res.getId(),
          actors: res.getActiveActorsCountList().map(a => ({
            type: a.getType(),
            count: a.getCount()
          })),
          extended: res.getExtendedMetadataMap().toObject().reduce((result: object, [key, value]) => {
            // @ts-ignore
            result[key] = value;
            return result
          }, {}),
          components: res.getRegisteredComponentsList().map(c => ({
            name: c.getName(),
            type: c.getType(),
            version: c.getVersion()
          }))
        }

        return resolve(wrapped);
      });
    });
  }

  async set(key: string, value: string): Promise<boolean> {
    const msg = new SetMetadataRequest();
    msg.setKey(key);
    msg.setValue(value);

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.setMetadata(msg, (err, res: Empty) => {
        if (err) {
          return reject(false);
        }

        return resolve(true);
      });
    });
  }
}

import HTTPClient from './HTTPClient';
import { GetMetadataResponse } from '../../../types/metadata/GetMetadataResponse';
import IClientMetadata from '../../../interfaces/Client/IClientMetadata';

// https://docs.dapr.io/reference/api/metadata_api
export default class HTTPClientMetadata implements IClientMetadata {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async get(): Promise<GetMetadataResponse> {
    const result = await this.client.execute(`/metadata`);
    return result as GetMetadataResponse;
  }

  async set(key: string, value: string): Promise<boolean> {
    await this.client.execute(`/metadata/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain"
      },
      body: value
    });

    return true;
  }
}

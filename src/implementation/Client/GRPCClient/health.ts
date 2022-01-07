import GRPCClient from './GRPCClient';
import IClientHealth from '../../../interfaces/Client/IClientHealth';

// https://docs.dapr.io/reference/api/health_api/
export default class GRPCClientHealth implements IClientHealth {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

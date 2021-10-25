import GRPCClient from './GRPCClient';
import { InvokeBindingRequest, InvokeBindingResponse } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import IClientBinding from '../../../interfaces/Client/IClientBinding';

// https://docs.dapr.io/reference/api/bindings_api/
export default class GRPCClientBinding implements IClientBinding {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // Send an event to an external system
  // @todo: should pass the metadata object
  // @todo: should return a specific typed Promise<TypeBindingResponse> instead of Promise<object>
  async send(bindingName: string, operation: string, data: any, metadata: object = {}): Promise<object> {
    const msgService = new InvokeBindingRequest();
    msgService.setName(bindingName);
    msgService.setOperation(operation);
    msgService.setData(Buffer.from(JSON.stringify(data), "utf-8"));

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.invokeBinding(msgService, (err, res: InvokeBindingResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/bindings_api/#payload
        return resolve({
          data: res.getData(),
          metadata: res.getMetadataMap(),
          operation
        });
      });
    });
  }
}

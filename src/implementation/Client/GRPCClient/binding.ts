/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import GRPCClient from './GRPCClient';
import { InvokeBindingRequest, InvokeBindingResponse } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import IClientBinding from '../../../interfaces/Client/IClientBinding';
import { types } from 'util';

export class BindingRequest {
  public readonly bindingName: string;
  public readonly operation: string;
  public data?: any;
  public metadata: Record<string, string>;

  constructor(bindingName: string, operation: string) {
    this.bindingName = bindingName;
    this.operation = operation;

    this.metadata = {};
  }

  public setData(data: any) {
    this.data = data;
  }

  public setMetadata(metadata: Record<string, string>) {
    this.metadata = metadata;
  }
}

export class BindingResponse {
  public readonly operation: string;
  public readonly data: Uint8Array | string;
  public readonly metadata: Record<string, string>;

  constructor(operation: string, data: Uint8Array | string, metadata: Record<string, string>) {
    this.operation = operation;
    this.data = data;
    this.metadata = metadata;
  }
}

// https://docs.dapr.io/reference/api/bindings_api/
export default class GRPCClientBinding implements IClientBinding {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  private makeRequest(
    name: string,
    operation: string,
    data: any,
    metadata: Record<string, string>,
  ): Promise<InvokeBindingResponse> {
    const envelope = new InvokeBindingRequest();
    envelope.setName(name);
    envelope.setOperation(operation);
    envelope.setData(data);
    Object.keys(metadata).forEach((key) => {
      envelope.getMetadataMap().set(key, metadata[key]);
    });

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.invokeBinding(envelope, (err, res: InvokeBindingResponse) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  private keyValuePairList2Record(kvpArray: Array<[string, string]>): Record<string, string> {
    const record: Record<string, string> = {};
    for (const kvp of kvpArray) {
      if (kvp.length !== 2) {
        throw new Error('Invalid key-value pair');
      }
      record[kvp[0]] = kvp[1];
    }
    return record;
  }

  async invoke(request: BindingRequest): Promise<BindingResponse> {
    // Sometimes we need to upload files to the object storage through binding, do not serialize binary data.
    let payload = request.data;
    if (!types.isTypedArray(request.data)) {
      payload = Buffer.from(JSON.stringify(request.data), 'utf-8');
    }

    const response = await this.makeRequest(request.bindingName, request.operation, payload, request.metadata);
    return new BindingResponse(
      request.operation,
      response.getData(),
      this.keyValuePairList2Record(response.getMetadataMap().getEntryList()),
    );
  }

  // Send an event to an external system
  async send(
    bindingName: string,
    operation: string,
    data: any,
    metadata: Record<string, string>,
  ): Promise<BindingResponse> {
    const request = new BindingRequest(bindingName, operation);
    request.setData(data);
    request.setMetadata(metadata);
    return await this.invoke(request);
  }
}

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

import GRPCClient from "./GRPCClient";
import  { InvokeBindingRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import type { InvokeBindingResponse } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { create } from "@bufbuild/protobuf"
import IClientBinding from "../../../interfaces/Client/IClientBinding";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { KeyValueType } from "../../../types/KeyValue.type";

// https://docs.dapr.io/reference/api/bindings_api/
export default class GRPCClientBinding implements IClientBinding {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // Send an event to an external system
  // @todo: should return a specific typed Promise<TypeBindingResponse> instead of Promise<object>
  async send(bindingName: string, operation: string, data: any, metadata: KeyValueType = {}): Promise<object> {
    const msgService = create(InvokeBindingRequestSchema);
    msgService.name = bindingName;
    msgService.operation = operation;

    if (data) {
      const serialized = SerializerUtil.serializeGrpc(data);
      msgService.data = serialized.serializedData;
    }

    Object.assign(msgService.metadata, metadata);

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.invokeBinding(msgService, (err: any, res: InvokeBindingResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/bindings_api/#payload
        return resolve({
          data: res.data,
          metadata: res.metadata,
          operation,
        });
      });
    });
  }
}

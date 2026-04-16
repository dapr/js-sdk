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

import { create } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import { InvokeBindingRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientBinding from "../../../interfaces/Client/IClientBinding";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { KeyValueType } from "../../../types/KeyValue.type";

// https://docs.dapr.io/reference/api/bindings_api/
export default class GRPCClientBinding implements IClientBinding {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async send(bindingName: string, operation: string, data: any, metadata: KeyValueType = {}): Promise<object> {
    const req: any = { name: bindingName, operation, metadata: metadata ?? {} };

    if (data) {
      const serialized = SerializerUtil.serializeGrpc(data);
      req.data = serialized.serializedData;
    }

    const client = await this.client.getClient();
    const res = await client.invokeBinding(create(InvokeBindingRequestSchema, req));

    return {
      data: res.data,
      metadata: res.metadata,
      operation,
    };
  }
}

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
import { AnySchema } from "@bufbuild/protobuf/wkt";
import GRPCClient from "./GRPCClient";

import { HttpMethod } from "../../../enum/HttpMethod.enum";
import { HTTPExtensionSchema, InvokeRequestSchema } from "../../../proto/dapr/proto/common/v1/common_pb";
import { InvokeServiceRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import IClientInvoker from "../../../interfaces/Client/IClientInvoker";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { InvokerOptions } from "../../../types/InvokerOptions.type";

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class GRPCClientInvoker implements IClientInvoker {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async invoke(
    appId: string,
    methodName: string,
    method: HttpMethod = HttpMethod.GET,
    data: object = {},
    _options: InvokerOptions = {},
  ): Promise<object> {
    const httpExtension = create(HTTPExtensionSchema, {
      verb: HttpVerbUtil.convertHttpVerbStringToNumber(method),
    });

    const { serializedData, contentType } = SerializerUtil.serializeGrpc(data);
    const maxBytes = (this.client.options.maxBodySizeMb ?? 4) * 1024 * 1024;

    const payloadSize = serializedData.length;

    if (payloadSize > maxBytes) {
      throw new Error(`Payload size ${payloadSize} exceeds maxBodySizeMb (${maxBytes})`);
    }
    const msgSerialized = create(AnySchema, { value: serializedData });

    const msgInvoke = create(InvokeRequestSchema, {
      method: methodName,
      httpExtension,
      data: msgSerialized,
      contentType,
    });

    const msgInvokeService = create(InvokeServiceRequestSchema, {
      id: appId,
      message: msgInvoke,
    });

    const client = await this.client.getClient();
    const res = await client.invokeService(msgInvokeService);

    let resData = "";

    if (res.data) {
      resData = Buffer.from(res.data.value).toString();
    }

    try {
      return JSON.parse(resData);
    } catch (e) {
      throw new Error(
        JSON.stringify({
          error: "COULD_NOT_PARSE_RESULT",
          error_msg: `Could not parse the returned resultset: ${resData}`,
        }),
      );
    }
  }
}

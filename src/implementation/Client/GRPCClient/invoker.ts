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

import { Any } from "google-protobuf/google/protobuf/any_pb";
import GRPCClient from "./GRPCClient";
import { HttpMethod } from "../../../enum/HttpMethod.enum";
import {
  HTTPExtensionSchema,
  InvokeRequestSchema,
  InvokeResponse,
} from "../../../proto/dapr/proto/common/v1/common_pb";
import {  InvokeServiceRequestSchema } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import IClientInvoker from "../../../interfaces/Client/IClientInvoker";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { InvokerOptions } from "../../../types/InvokerOptions.type";
import { create } from "@bufbuild/protobuf";

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class GRPCClientInvoker implements IClientInvoker {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // @todo: should return a specific typed Promise<TypeInvokerInvokeResponse> instead of Promise<nothing>

  async invoke(
    appId: string,
    methodName: string,
    method: HttpMethod = HttpMethod.GET,
    data: object = {},
    _options: InvokerOptions = {},
  ): Promise<object> {
    // InvokeServiceRequest represents the request message for Service invocation.
    const msgInvokeService = create(InvokeServiceRequestSchema);
    msgInvokeService.id = appId;

    const httpExtension = create(HTTPExtensionSchema);
    httpExtension.verb = HttpVerbUtil.convertHttpVerbStringToNumber(method);

    const msgSerialized = new Any();
    const { serializedData, contentType } = SerializerUtil.serializeGrpc(data);
    msgSerialized.setValue(serializedData);

    const msgInvoke = create(InvokeRequestSchema);
    msgInvoke.method = methodName;
    msgInvoke.httpExtension = httpExtension;
    msgInvoke.data = msgSerialized as any;
    msgInvoke.contentType = contentType;

    msgInvokeService.message = msgInvoke;

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.invokeService(msgInvokeService, (err: Error, res: InvokeResponse) => {
        if (err) {
          return reject(err);
        }

        let resData = "";

        if (res.data) {
          resData = Buffer.from(res.data.value).toString();
        }

        try {
          const parsedResData = JSON.parse(resData);
          return resolve(parsedResData);
        } catch (e) {
          throw new Error(
            JSON.stringify({
              error: "COULD_NOT_PARSE_RESULT",
              error_msg: `Could not parse the returned resultset: ${resData}`,
            }),
          );
        }
      });
    });
  }
}

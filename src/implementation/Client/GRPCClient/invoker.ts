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
import GRPCClient from './GRPCClient';

import { HttpMethod } from '../../../enum/HttpMethod.enum';
import { HTTPExtension, InvokeRequest, InvokeResponse } from '../../../proto/dapr/proto/common/v1/common_pb';
import { InvokeServiceRequest } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import IClientInvoker from '../../../interfaces/Client/IClientInvoker';
import * as SerializerUtil from "../../../utils/Serializer.util"

import { InvokerOptions } from "../../../types/InvokerOptions.type";

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class GRPCClientInvoker implements IClientInvoker {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  // @todo: should return a specific typed Promise<TypeInvokerInvokeResponse> instead of Promise<nothing>
  async invoke(appId: string, methodName: string, method: HttpMethod = HttpMethod.GET, data?: object,options:InvokerOptions={}): Promise<object> {
    
    const headers= options.headers!=undefined?options.headers:{}
 
    const fetchOptions = {
      method,
      headers
    };

    if (method !== HttpMethod.GET) {
       //@ts-ignore
      fetchOptions.headers['Content-Type'] = 'application/json';
    }


    if (method !== HttpMethod.GET && data !== undefined) {
      //@ts-ignore
      fetchOptions.body = JSON.stringify(data);
    }

    // InvokeServiceRequest represents the request message for Service invocation.
    const msgInvokeService = new InvokeServiceRequest();
    msgInvokeService.setId(appId);

    const httpExtension = new HTTPExtension();
    httpExtension.setVerb(HttpVerbUtil.convertHttpVerbStringToNumber(method));

    const msgSerialized = new Any();
    const {serializedData, contentType} = SerializerUtil.serializeGrpc(data);
    msgSerialized.setValue(serializedData);

    const msgInvoke = new InvokeRequest();
    msgInvoke.setMethod(methodName);
    msgInvoke.setHttpExtension(httpExtension);
    msgInvoke.setData(msgSerialized);
    msgInvoke.setContentType(contentType);

    msgInvokeService.setMessage(msgInvoke);

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.invokeService(msgInvokeService, (err, res: InvokeResponse) => {
        if (err) {
          return reject(err);
        }

        // const res = await fetch(`${this.daprUrl}/invoke/${appId}/method/${methodName}`, fetchOptions);
        // return ResponseUtil.handleResponse(res);
        const resData = Buffer.from((res.getData() as Any).getValue()).toString();

        try {
          const parsedResData = JSON.parse(resData);
          return resolve(parsedResData);
        } catch (e) {
          throw new Error(JSON.stringify({
            error: "COULD_NOT_PARSE_RESULT",
            error_msg: `Could not parse the returned resultset: ${resData}`
          }));
        }
      })
    })
  }
  
}

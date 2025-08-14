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
import IClientConversation from "../../../interfaces/Client/IClientConversation";
import { ConversationInput } from "../../../types/conversation/ConversationInput.type";
import { ConversationOptions } from "../../../types/conversation/ConversationOptions.type";
import { ConversationResponse } from "../../../types/conversation/ConversationResponse.type";
import { Logger } from "../../../logger/Logger";
import GRPCClient from "./GRPCClient";
import { HTTPExtension, InvokeRequest, InvokeResponse } from "../../../proto/dapr/proto/common/v1/common_pb";
import { InvokeServiceRequest } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import * as HttpVerbUtil from "../../../utils/HttpVerb.util";
import * as SerializerUtil from "../../../utils/Serializer.util";
import { HttpMethod } from "../../../enum/HttpMethod.enum";

// https://docs.dapr.io/reference/api/conversation_api/
export default class GRPCClientConversation implements IClientConversation {
  client: GRPCClient;
  private readonly logger: Logger;

  constructor(client: GRPCClient) {
    this.client = client;
    this.logger = new Logger("GRPCClient", "Conversation", client.options.logger);
  }

  async converseAsync(
    name: string,
    inputs: ConversationInput[],
    options?: ConversationOptions,
  ): Promise<ConversationResponse> {
    this.logger.debug(
      `converse called with name: ${name}, inputs: ${JSON.stringify(inputs)}, options: ${JSON.stringify(options)}`,
    );

    const requestBody = {
      name,
      inputs,
      ...(options ?? {}),
    };

    const msgInvokeService = new InvokeServiceRequest();
    msgInvokeService.setId("dapr");

    const httpExtension = new HTTPExtension();
    httpExtension.setVerb(HttpVerbUtil.convertHttpVerbStringToNumber(HttpMethod.POST));

    const msgSerialized = new Any();
    const { serializedData, contentType } = SerializerUtil.serializeGrpc(requestBody);
    msgSerialized.setValue(serializedData);

    const msgInvoke = new InvokeRequest();

    msgInvoke.setMethod(`/conversation/${name}/converse`);
    msgInvoke.setHttpExtension(httpExtension);
    msgInvoke.setData(msgSerialized);
    msgInvoke.setContentType(contentType);

    msgInvokeService.setMessage(msgInvoke);

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.invokeService(msgInvokeService, (err, res: InvokeResponse) => {
        if (err) {
          this.logger.error(`Error invoking conversation service: ${err.message}`);
          return reject(err);
        }

        let resData = "";

        if (res.getData()) {
          resData = Buffer.from((res.getData() as Any).getValue()).toString();
        }

        try {
          const parsedResData = JSON.parse(resData);
          this.logger.debug(`Conversation response: ${JSON.stringify(parsedResData)}`);
          return resolve(parsedResData as ConversationResponse);
        } catch (e) {
          const error = new Error(
            JSON.stringify({
              error: "COULD_NOT_PARSE_RESULT",
              error_msg: `Could not parse the returned resultset: ${resData}`,
            }),
          );
          this.logger.error(`Error parsing conversation response: ${error.message}`);
          throw error;
        }
      });
    });
  }
}

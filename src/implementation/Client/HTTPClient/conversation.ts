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

import IClientConversation from "../../../interfaces/Client/IClientConversation";
import { ConversationInput } from "../../../types/conversation/ConversationInput.type";
import { ConversationOptions } from "../../../types/conversation/ConversationOptions.type";
import { ConversationResponse } from "../../../types/conversation/ConversationResponse.type";
import { Logger } from "../../../logger/Logger";
import HTTPClient from "./HTTPClient";

// https://docs.dapr.io/reference/api/conversation_api/
export default class HTTPClientConversation implements IClientConversation {
  client: HTTPClient;
  private readonly logger: Logger;

  constructor(client: HTTPClient) {
    this.client = client;
    this.logger = new Logger("HTTPClient", "Conversation", client.options.logger);
  }

  async converseAsync(
    name: string,
    inputs: ConversationInput[],
    options?: ConversationOptions,
  ): Promise<ConversationResponse> {
    const body = {
      name,
      inputs,
      ...(options ?? {}),
    };
    const result = await this.client.executeWithApiVersion("v1.0-alpha2", `/conversation/${name}/converse`, {
      method: "POST",
      body,
    });

    return result as ConversationResponse;
  }
}

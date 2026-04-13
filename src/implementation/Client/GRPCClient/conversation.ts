/*
Copyright 2026 The Dapr Authors
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
import IClientConversation from "../../../interfaces/Client/IClientConversation";
import { ConversationInput } from "../../../types/conversation/ConversationInput.type";
import { ConversationOptions } from "../../../types/conversation/ConversationOptions.type";
import { ConversationResponse } from "../../../types/conversation/ConversationResponse.type";
import { GRPCNotSupportedError } from "../../../errors/GRPCNotSupportedError";

// gRPC support requires proto regeneration; use HTTP protocol for Conversation.
export default class GRPCClientConversation implements IClientConversation {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  converse(_name: string, _inputs: ConversationInput[], _options?: ConversationOptions): Promise<ConversationResponse> {
    throw new GRPCNotSupportedError();
  }
}

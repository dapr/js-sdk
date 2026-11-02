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

import IClientConversation from "../../../interfaces/Client/IClientConversation";
import { ConversationRequestAlpha2, ConversationResponseAlpha2 } from "../../../types/conversation/Conversation.types";
import { fromConversationResponse, toConversationRequest } from "../../../utils/Conversation.util";
import GRPCClient from "./GRPCClient";

export default class GRPCClientConversation implements IClientConversation {
  constructor(private readonly client: GRPCClient) {}

  async converse(request: ConversationRequestAlpha2): Promise<ConversationResponseAlpha2> {
    const message = toConversationRequest(request);
    const client = await this.client.getClient();
    return fromConversationResponse(await client.converseAlpha2(message));
  }
}

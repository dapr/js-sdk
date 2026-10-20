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
import {
  fromConversationHttpResponse,
  toConversationHttpBody,
  toConversationRequest,
} from "../../../utils/Conversation.util";
import HTTPClient from "./HTTPClient";

export default class HTTPClientConversation implements IClientConversation {
  constructor(private readonly client: HTTPClient) {}

  async converse(request: ConversationRequestAlpha2): Promise<ConversationResponseAlpha2> {
    const message = toConversationRequest(request);
    const response = await this.client.executeWithApiVersion(
      "v1.0-alpha2",
      `/conversation/${encodeURIComponent(request.name)}/converse`,
      { method: "POST", body: toConversationHttpBody(message) },
    );
    return fromConversationHttpResponse(response);
  }
}

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

import { ConversationRequestAlpha2, ConversationResponseAlpha2 } from "../../types/conversation/Conversation.types";

/** Conversation Alpha2 (Dapr 1.16+). Advanced options depend on runtime and provider support. */
export default interface IClientConversation {
  /** Send messages to an LLM. Returned tool calls must be validated and executed by the application. */
  converse(request: ConversationRequestAlpha2): Promise<ConversationResponseAlpha2>;
}

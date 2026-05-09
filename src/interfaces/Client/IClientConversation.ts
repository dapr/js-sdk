/*
Copyright 2025 The Dapr Authors
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

import { ConversationInput, ConversationOptions, ConversationResponse } from "../../types/conversation/Conversation.type";

export default interface IClientConversation {
  /**
   * Converse with a LLM service using the Alpha2 Conversation API.
   * @param conversationComponentName - The name of the Conversation component to use
   * @param inputs - The conversation inputs (required)
   * @param options - Optional conversation parameters
   * @returns The conversation response containing the LLM outputs
   */
  converse(
    conversationComponentName: string,
    inputs: ConversationInput[],
    options?: ConversationOptions,
  ): Promise<ConversationResponse>;
}

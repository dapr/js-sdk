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

import { ConversationToolCall } from "./ConversationToolCall.type";

export type ConversationResponse = {
  /**
   * The ID of the chat session
   */
  context_id?: string;
  /**
   * The output of the conversation
   */
  outputs: ConversationOutput[];
};

type ConversationOutput = {
  choices: ConversationResultChoice[];
};

export type ConversationResultChoice = {
  /**
   * Why the model stopped generating.
   * Can be: 'stop', 'length', 'tool_calls', 'content_filter'
   */
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
  /**
   * The index of the choice
   */
  index: number;
  /**
   * Output message content
   */
  message: ConversationResultMessage;
};

export interface ConversationResultMessage {
  content: string;
  tool_calls?: ConversationToolCall[];
}

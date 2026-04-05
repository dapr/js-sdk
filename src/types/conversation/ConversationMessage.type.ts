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

// ConversationToolCall is the tool call request sent by the LLM for the client to execute
export type ConversationToolCallOfFunction = {
  name: string;
  arguments: string;
};

export type ConversationToolCall = {
  id?: string;
  function?: ConversationToolCallOfFunction;
  // Future: custom tool call types will be added here
};

// each message type encodes the sender role via its field name
export type ConversationMessageContent = {
  text: string;
};

export type ConversationMessageOfDeveloper = {
  of_developer: { name?: string; content: ConversationMessageContent[] };
};

export type ConversationMessageOfSystem = {
  of_system: { name?: string; content: ConversationMessageContent[] };
};

export type ConversationMessageOfUser = {
  of_user: { name?: string; content: ConversationMessageContent[] };
};

export type ConversationMessageOfAssistant = {
  of_assistant: { name?: string; content?: ConversationMessageContent[]; tool_calls?: ConversationToolCall[] };
};

export type ConversationMessageOfTool = {
  of_tool: { tool_call_id: string; name: string; content: ConversationMessageContent[] };
};

export type ConversationMessage =
  | ConversationMessageOfDeveloper
  | ConversationMessageOfSystem
  | ConversationMessageOfUser
  | ConversationMessageOfAssistant
  | ConversationMessageOfTool;

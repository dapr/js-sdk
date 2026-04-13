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

// ConversationTool describes a function the LLM may call during the conversation
export type ConversationTool = {
  function: {
    name: string;
    description?: string;
    parameters?: object; 
  };
};

export type ConversationOptions = {
  contextId?: string;
  scrubPII?: boolean;
  temperature?: number;
  metadata?: Record<string, string>;
  parameters?: Record<string, any>;
  tools?: ConversationTool[];
  toolChoice?: string; // "none" | "auto" | "required" | specific tool name
  responseFormat?: object; // JSON Schema for structured output
  promptCacheRetention?: string;
};

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

import { KeyValueType } from "../KeyValue.type";
import { ConversationTool } from "./ConversationTool.type";

export type ConversationOptions = {
  /**
   * Metadata passed to conversation component
   */
  metadata?: KeyValueType;
  /**
   * A time-to-live value for a prompt cache to expire. Uses Golang duration format
   */
  cacheTTL?: number;
  /**
   * A boolean value to enable obfuscation of sensitive information present in the content field. Set this value if PII for this specific content needs to be scrubbed exclusively
   */
  scrub_pii?: boolean;
  /**
   * A float value to control the temperature of the model. Used to optimize for creativity or predictability
   */
  temperature?: number;
  /**
   * The ID of an existing chat (like in ChatGPT)
   */
  context_id?: string;
  /**
   * Tools available to the LLM during this conversation.
   * These are request-scoped and may change between rounds.
   */
  tools?: ConversationTool[];
  /**
   * Parameters for all custom fields (loosely typed)
   */
  parameters?: Record<string, any>;
  /**
   * Controls which (if any) tool is called by the model.
   *
   * 'none' → model will not call any tool and generates text instead (default when no tools).
   * 'auto' → model decides to generate text or call tools (default when tools are present).
   * 'required' → model must call at least one tool.
   * Or: specify a tool name directly (must match exactly).
   */
  tool_choice?: "none" | "auto" | "required" | string;
};

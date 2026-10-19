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

import type { IDaprSerializer } from "./IDaprSerializer";
import { PayloadReference } from "../workflow/payloads/PayloadReference";

/** Preserve workflow JSON.stringify omission semantics unless a provider is explicitly configured. */
export function serializeWorkflowValue(value: unknown, serializer?: IDaprSerializer): string | undefined {
  if (value instanceof PayloadReference) return value.toEnvelope();
  return serializer ? serializer.serialize(value) : JSON.stringify(value);
}

export function deserializeWorkflowValue<T = unknown>(data: string, serializer?: IDaprSerializer): T {
  return serializer ? serializer.deserialize<T>(data) : JSON.parse(data);
}

export function isJsonContentType(contentType = "application/json"): boolean {
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

/** Embed a payload in a JSON-only Dapr envelope without changing its format. */
export function serializeJsonValue(
  value: unknown,
  serializer: IDaprSerializer,
  contentType = serializer.contentType,
): unknown {
  const encoded = serializer.serialize(value);
  return isJsonContentType(contentType) ? JSON.parse(encoded) : encoded;
}

export function deserializeJsonValue<T = unknown>(value: unknown, serializer: IDaprSerializer): T {
  if (isJsonContentType(serializer.contentType)) {
    return serializer.deserialize<T>(JSON.stringify(value));
  }
  if (typeof value !== "string") {
    throw new TypeError("Expected a string payload for the configured serializer");
  }
  return serializer.deserialize<T>(value);
}

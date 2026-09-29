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

import { createHash } from "crypto";

const RFC4122_NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export function newDeterministicGuid(namespace: string, name: string): string {
  const namespaceBytes = parseUuid(namespace);
  const nameBytes = Buffer.from(name, "utf8");

  const hash = createHash("sha1");
  hash.update(namespaceBytes);
  hash.update(nameBytes);
  const digest = hash.digest();

  const bytes = Buffer.alloc(16);
  digest.copy(bytes, 0, 0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return formatUuid(bytes);
}

export function newDefaultNamespaceGuid(instanceId: string, counter: number): string {
  return newDeterministicGuid(instanceId, counter.toString());
}

export function parseUuid(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, "");
  return Buffer.from(hex, "hex");
}

export function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export { RFC4122_NAMESPACE_DNS };

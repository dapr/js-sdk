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

import { Code, ConnectError } from "@connectrpc/connect";
import { Readable } from "node:stream";
import BinaryStoreClient from "../../src/implementation/Client/BinaryStoreClient";
import type { BinaryStoreOptions, BinaryStoreSetOptions, IWorkflowPayloadManifest, PayloadReference } from "../../src";

export class MemoryPayloadStore extends BinaryStoreClient {
  readonly files = new Map<string, Buffer>();
  reads = 0;
  writes = 0;
  closedReads = 0;

  async setBinaryFile(store: string, key: string, content: Uint8Array | Readable, options: BinaryStoreSetOptions = {}) {
    options.signal?.throwIfAborted();
    this.validateNames(store, key);
    this.writes++;
    const name = `${store}/${key}`;
    if (this.files.has(name) && !options.overwrite) throw new ConnectError("exists", Code.AlreadyExists);
    const chunks: Buffer[] = [];
    for await (const chunk of this.uploadStream(content, options)) chunks.push(Buffer.from(chunk));
    this.files.set(name, Buffer.concat(chunks));
  }

  async *getBinaryFileChunks(store: string, key: string, options: BinaryStoreOptions = {}) {
    this.reads++;
    try {
      options.signal?.throwIfAborted();
      const bytes = this.files.get(`${store}/${key}`);
      if (!bytes) throw new ConnectError("missing", Code.NotFound);
      for (let i = 0; i < bytes.length; i += 7) {
        options.signal?.throwIfAborted();
        yield bytes.subarray(i, i + 7);
      }
    } finally {
      this.closedReads++;
    }
  }

  async deleteBinaryFile(store: string, key: string, options: BinaryStoreOptions = {}) {
    options.signal?.throwIfAborted();
    if (!this.files.delete(`${store}/${key}`)) throw new ConnectError("missing", Code.NotFound);
  }
}

export class MemoryPayloadManifest implements IWorkflowPayloadManifest {
  readonly references = new Map<string, Map<string, PayloadReference>>();
  async record(instanceId: string, reference: PayloadReference) {
    const values = this.references.get(instanceId) ?? new Map<string, PayloadReference>();
    values.set(reference.toEnvelope(), reference);
    this.references.set(instanceId, values);
  }
  async list(instanceId: string) {
    return [...(this.references.get(instanceId)?.values() ?? [])];
  }
  async clear(instanceId: string) {
    this.references.delete(instanceId);
  }
}

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

import { createHash } from "node:crypto";
import { addAbortSignal, Readable } from "node:stream";
import { Code, ConnectError } from "@connectrpc/connect";
import type IClientBinaryStore from "../../interfaces/Client/IClientBinaryStore";
import type { IDaprSerializer } from "../../serialization/IDaprSerializer";
import { JsonSerializer } from "../../serialization/JsonSerializer";
import { PayloadReference } from "./PayloadReference";
import {
  BinaryStorePayloadOptions,
  PayloadKind,
  PayloadSite,
  PayloadWritePreference,
} from "./BinaryStorePayloadOptions";
import { PayloadIntegrityError, PayloadNotFoundError, PayloadRehydrationLimitError } from "./PayloadErrors";

/** Explicit storage/resolution and automatic boundary conversion over the existing Binary Store API. */
export class BinaryStoreWorkflowPayloadResolver {
  readonly options: Readonly<
    Required<Omit<BinaryStorePayloadOptions, "manifest">> & Pick<BinaryStorePayloadOptions, "manifest">
  >;

  constructor(
    private readonly client: IClientBinaryStore,
    options: BinaryStorePayloadOptions,
    readonly serializer: IDaprSerializer = new JsonSerializer(),
  ) {
    this.options = Object.freeze({
      storeName: options.storeName,
      keyPrefix: options.keyPrefix ?? "workflow-payloads",
      writePreference: options.writePreference ?? PayloadWritePreference.Preserve,
      offloadSites: options.offloadSites ?? PayloadKind.All,
      offloadThreshold: options.offloadThreshold === undefined ? 64 * 1024 : options.offloadThreshold,
      skipWriteIfExists: options.skipWriteIfExists ?? true,
      maxInMemoryRehydrationSize: options.maxInMemoryRehydrationSize ?? 16 * 1024 * 1024,
      verifyIntegrityOnRead: options.verifyIntegrityOnRead ?? true,
      resolutionCacheSize: options.resolutionCacheSize ?? 128,
      manifest: options.manifest,
    });
    const o = this.options;
    if (
      typeof o.storeName !== "string" ||
      !o.storeName.trim() ||
      typeof o.keyPrefix !== "string" ||
      !o.keyPrefix.trim() ||
      o.keyPrefix.split("/").some((part) => !part || part === "." || part === "..") ||
      /[\\*?[\]#]/.test(o.keyPrefix)
    ) {
      throw new TypeError("A storeName and valid binary-store keyPrefix are required");
    }
    if (!Object.values(PayloadWritePreference).includes(o.writePreference)) {
      throw new TypeError("Invalid payload writePreference");
    }
    if (
      !Number.isInteger(o.offloadSites) ||
      o.offloadSites < 0 ||
      o.offloadSites > PayloadKind.All ||
      (o.offloadThreshold !== null && (!Number.isSafeInteger(o.offloadThreshold) || o.offloadThreshold <= 0)) ||
      !Number.isSafeInteger(o.maxInMemoryRehydrationSize) ||
      o.maxInMemoryRehydrationSize <= 0 ||
      !Number.isSafeInteger(o.resolutionCacheSize) ||
      o.resolutionCacheSize < 0
    ) {
      throw new RangeError("Invalid binary-store payload size, cache size, or offload sites");
    }
  }

  async store<T>(value: T, instanceId: string, signal?: AbortSignal): Promise<PayloadReference<T>> {
    signal?.throwIfAborted();
    return (await this.storeSerialized(this.serializer.serialize(value), instanceId, signal)).asTyped<T>();
  }

  async resolve<T>(reference: PayloadReference<T>, signal?: AbortSignal): Promise<T> {
    return this.serializer.deserialize<T>(await this.resolveSerialized(reference, signal));
  }

  /** Raw stored bytes, without rehydration limits or stage reversal. Destroy the stream on early exit. */
  open(reference: PayloadReference, signal?: AbortSignal): Readable {
    signal?.throwIfAborted();
    const stream = Readable.from(this.readChunks(reference, signal), { objectMode: false });
    return signal ? addAbortSignal(signal, stream) : stream;
  }

  async encode(wire: string | undefined, site: PayloadSite, signal?: AbortSignal): Promise<string | undefined> {
    signal?.throwIfAborted();
    const reference = PayloadReference.parse(wire);
    const o = this.options;
    if (site.requireInline || o.writePreference === PayloadWritePreference.PreferInline) {
      return reference ? this.resolveSerialized(reference, signal) : wire;
    }
    if (
      !wire ||
      reference ||
      o.writePreference === PayloadWritePreference.Preserve ||
      !(o.offloadSites & site.kind) ||
      (o.offloadThreshold !== null && Buffer.byteLength(wire, "utf8") < o.offloadThreshold)
    ) {
      return wire;
    }
    return (await this.storeSerialized(wire, site.instanceId, signal)).toEnvelope();
  }

  async storeSerialized(wire: string, instanceId: string, signal?: AbortSignal): Promise<PayloadReference> {
    signal?.throwIfAborted();
    if (typeof instanceId !== "string" || !instanceId.trim()) throw new TypeError("instanceId must not be empty");
    const bytes = Buffer.from(wire, "utf8");
    const hash = createHash("sha256").update(bytes).digest("hex");
    const key = `${this.options.keyPrefix}/${instanceId}/${hash}`;
    try {
      await this.client.setBinaryFile(this.options.storeName, key, bytes, { signal });
    } catch (error) {
      if (signal?.aborted || !this.options.skipWriteIfExists || !hasStatus(error, Code.AlreadyExists, 409)) throw error;
    }
    const reference = new PayloadReference(this.options.storeName, key, bytes.length, hash);
    await this.options.manifest?.record(instanceId, reference, signal);
    return reference;
  }

  async resolveSerialized(reference: PayloadReference, signal?: AbortSignal): Promise<string> {
    signal?.throwIfAborted();
    const limit = this.options.maxInMemoryRehydrationSize;
    if (reference.size > limit) throw new PayloadRehydrationLimitError(reference, limit);
    if (reference.stages.length) throw new TypeError("Workflow payload stage reversal is not supported");
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of this.readChunks(reference, signal)) {
      length += chunk.length;
      if (length > limit) throw new PayloadRehydrationLimitError(reference, limit);
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks, length);
    if (this.options.verifyIntegrityOnRead) {
      const actual = createHash("sha256").update(bytes).digest("hex");
      if (actual !== reference.contentHash) throw new PayloadIntegrityError(reference, actual);
    }
    return bytes.toString("utf8");
  }

  /** Explicit only: never delete data automatically on completion or workflow purge. */
  async deletePayloads(instanceId: string, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    const manifest = this.options.manifest;
    if (!manifest) throw new Error("Payload cleanup requires a durable IWorkflowPayloadManifest");
    for (const reference of await manifest.list(instanceId, signal)) {
      try {
        await this.client.deleteBinaryFile(reference.storeName, reference.key, { signal });
      } catch (error) {
        if (signal?.aborted || !hasStatus(error, Code.NotFound, 404)) throw error;
      }
    }
    await manifest.clear(instanceId, signal);
  }

  private async *readChunks(reference: PayloadReference, signal?: AbortSignal): AsyncIterable<Buffer> {
    try {
      signal?.throwIfAborted();
      for await (const chunk of this.client.getBinaryFileChunks(reference.storeName, reference.key, { signal })) {
        signal?.throwIfAborted();
        yield chunk;
      }
    } catch (error) {
      if (!signal?.aborted && hasStatus(error, Code.NotFound, 404)) throw new PayloadNotFoundError(reference, error);
      throw error;
    }
  }
}

function hasStatus(error: unknown, grpc: Code, http: number): boolean {
  if (error instanceof ConnectError) return error.code === grpc;
  if (!(error instanceof Error)) return false;
  // HTTPClient's streaming API reports the structured Dapr HTTP error as its message.
  try {
    return JSON.parse(error.message)?.status === http;
  } catch {
    return false;
  }
}

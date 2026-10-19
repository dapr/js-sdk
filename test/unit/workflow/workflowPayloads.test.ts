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
import { Code, ConnectError } from "@connectrpc/connect";
import {
  BinaryStoreWorkflowPayloadResolver,
  PayloadReference,
  PayloadKind,
  PayloadWritePreference,
  PayloadIntegrityError,
  PayloadNotFoundError,
  PayloadRehydrationLimitError,
  PayloadNotResolvableError,
  type BinaryStorePayloadOptions,
} from "../../../src";
import { WorkflowPayloadHandler } from "../../../src/workflow/payloads/WorkflowPayloadHandler";
import { serializeWorkflowValue } from "../../../src/serialization/Serialization.util";
import { MemoryPayloadStore, MemoryPayloadManifest } from "../../utils/WorkflowPayloadTestUtils";
import { CustomSerializer } from "../../fixtures/CustomSerializer";

const hash = createHash("sha256").update('{"message":"hello"}').digest("hex");
const body = { v: 1, store: "binarystore", key: `workflow-payloads/instance/${hash}`, size: 19, sha256: hash };
const envelope = JSON.stringify({ $daprRef: body });
const site = { kind: PayloadKind.WorkflowInput, instanceId: "instance" };

describe("PayloadReference cross-SDK envelope", () => {
  it("writes the exact .NET v1 field names, order, and omission of empty stages", () => {
    const reference = new PayloadReference(body.store, body.key, body.size, hash);
    expect(reference.toEnvelope()).toBe(envelope);
    expect(JSON.stringify(reference)).toBe(envelope);
    expect(PayloadReference.parse(envelope)).toEqual(reference);
    expect(reference.asTyped<{ message: string }>()).toEqual(reference);
    expect(Object.isFrozen(reference)).toBe(true);
  });

  it.each([
    "null",
    "false",
    "0",
    '"text"',
    "[]",
    "{}",
    '{"nested":{"$daprRef":{}}}',
    '{"$daprRef":{},"user":true}',
    "custom:not-json",
    "{custom-format}",
  ])("does not mistake ordinary data for an envelope: %s", (wire) => {
    expect(PayloadReference.parse(wire)).toBeUndefined();
  });

  it("recognizes whitespace, property order, nullable stages, and escaped sentinel", () => {
    expect(PayloadReference.parse(` \n${JSON.stringify({ $daprRef: { ...body, stages: null } })}`)?.key).toBe(body.key);
    expect(PayloadReference.parse(envelope.replace("$daprRef", "\\u0024daprRef"))?.key).toBe(body.key);
  });

  it.each([
    null,
    {},
    { ...body, v: 0 },
    { ...body, v: 2 },
    { ...body, v: 1.5 },
    { ...body, store: "" },
    { ...body, key: " " },
    { ...body, size: -1 },
    { ...body, size: 1.5 },
    { ...body, size: Number.MAX_SAFE_INTEGER + 1 },
    { ...body, sha256: "not-a-hash" },
    { ...body, stages: {} },
    { ...body, stages: [null] },
    { ...body, stages: [{ n: "" }] },
    { ...body, stages: [{ n: "gzip", m: { level: 3 } }] },
  ])("rejects invalid reserved envelopes: %j", (value) => {
    expect(() => PayloadReference.parse(JSON.stringify({ $daprRef: value }))).toThrow();
  });

  it("rejects malformed reserved JSON rather than treating it as an inline payload", () => {
    expect(() => PayloadReference.parse('{"$daprRef":')).toThrow(SyntaxError);
  });

  it("preserves stage metadata without allowing caller mutation", () => {
    const stages = [{ name: "gzip", metadata: { level: "5" } }];
    const reference = new PayloadReference("store", "key", 1, hash, stages);
    stages[0].metadata.level = "9";
    expect(JSON.parse(reference.toEnvelope()).$daprRef.stages).toEqual([{ n: "gzip", m: { level: "5" } }]);
    expect(PayloadReference.parse(reference.toEnvelope())?.stages[0].metadata?.level).toBe("5");
  });
});

describe("binary-store payload conversion", () => {
  let store: MemoryPayloadStore;
  const resolver = (options: Partial<BinaryStorePayloadOptions> = {}) =>
    new BinaryStoreWorkflowPayloadResolver(store, { storeName: "binarystore", ...options });

  beforeEach(() => {
    store = new MemoryPayloadStore();
  });

  it.each([null, false, 0, "", "YWJj", { nested: ["\u00e9", 0, false] }, [1, "two"]])(
    "explicitly stores and resolves JSON value %j under every policy",
    async (value) => {
      for (const writePreference of Object.values(PayloadWritePreference)) {
        const payloads = resolver({ writePreference });
        const reference = await payloads.store(value, "instance");
        const wire = JSON.stringify(value);
        expect(reference.size).toBe(Buffer.byteLength(wire));
        expect(reference.contentHash).toBe(createHash("sha256").update(wire).digest("hex"));
        expect(reference.key).toBe(`workflow-payloads/instance/${reference.contentHash}`);
        expect(await payloads.resolve(reference)).toEqual(value);
      }
    },
  );

  it("preserves default inline payloads and existing references without reading or writing", async () => {
    const payloads = resolver();
    expect(await payloads.encode('{"value":1}', site)).toBe('{"value":1}');
    expect(await payloads.encode(envelope, site)).toBe(envelope);
    expect(await payloads.encode(undefined, site)).toBeUndefined();
    expect(store.writes).toBe(0);
    expect(store.reads).toBe(0);
  });

  it.each([3, 4, 5])("measures the inclusive threshold in UTF-8 bytes (threshold %s)", async (offloadThreshold) => {
    const payloads = resolver({ writePreference: PayloadWritePreference.PreferReference, offloadThreshold });
    const wire = await payloads.encode('"\u00e9"', site); // Four bytes, not three UTF-16 code units.
    expect(!!PayloadReference.parse(wire)).toBe(offloadThreshold <= 4);
  });

  it("honors per-boundary flags and null thresholds", async () => {
    const payloads = resolver({
      writePreference: PayloadWritePreference.PreferReference,
      offloadThreshold: null,
      offloadSites: PayloadKind.ActivityOutput,
    });
    expect(await payloads.encode("0", site)).toBe("0");
    expect(
      PayloadReference.parse(await payloads.encode("0", { ...site, kind: PayloadKind.ActivityOutput })),
    ).toBeDefined();
    expect(await payloads.encode("", { ...site, kind: PayloadKind.ActivityOutput })).toBe("");
  });

  it("inlines references when preferred or required, even with offloading enabled", async () => {
    const reference = await resolver().store({ value: 1 }, "instance");
    for (const writePreference of Object.values(PayloadWritePreference)) {
      const payloads = resolver({ writePreference, offloadThreshold: null });
      expect(await payloads.encode(reference.toEnvelope(), { ...site, requireInline: true })).toBe('{"value":1}');
    }
    expect(
      await resolver({ writePreference: PayloadWritePreference.PreferInline }).encode(reference.toEnvelope(), site),
    ).toBe('{"value":1}');
  });

  it("keeps envelope encoding independent of the custom serializer", async () => {
    const serializer = new CustomSerializer();
    const payloads = new BinaryStoreWorkflowPayloadResolver(store, { storeName: "binarystore" }, serializer);
    const reference = await payloads.store({ value: 123n }, "instance");
    expect(serializeWorkflowValue(reference, serializer)).toBe(reference.toEnvelope());
    expect(await payloads.resolve(reference)).toEqual({ value: 123n });
    const handler = new WorkflowPayloadHandler(payloads, serializer);
    expect(await handler.read(reference.toEnvelope())).toEqual({ value: 123n });
    expect(await handler.read(reference.toEnvelope(), true)).toEqual(reference);
  });

  it("deduplicates content-addressed writes without overwriting, but can report duplicates", async () => {
    const first = await resolver().store("value", "instance");
    expect(await resolver().store("value", "instance")).toEqual(first);
    expect(store.files.size).toBe(1);
    await expect(resolver({ skipWriteIfExists: false }).store("value", "instance")).rejects.toMatchObject({
      code: Code.AlreadyExists,
    });
    expect((await resolver().store("value", "another-instance")).key).not.toBe(first.key);
  });

  it("propagates storage failures instead of silently keeping large payloads inline", async () => {
    const error = new ConnectError("unavailable", Code.Unavailable);
    jest.spyOn(store, "setBinaryFile").mockRejectedValue(error);
    await expect(
      resolver({ writePreference: PayloadWritePreference.PreferReference, offloadThreshold: null }).encode("123", site),
    ).rejects.toBe(error);
  });

  it("handles structured HTTP duplicate and not-found errors", async () => {
    jest.spyOn(store, "setBinaryFile").mockRejectedValue(new Error('{"status":409}'));
    const reference = await resolver().store("value", "instance");
    jest.spyOn(store, "getBinaryFileChunks").mockImplementation(() => {
      throw new Error('{"status":404}');
    });
    await expect(resolver().resolve(reference)).rejects.toBeInstanceOf(PayloadNotFoundError);
  });

  it("checks both declared and actual read sizes and disposes the iterator on overflow", async () => {
    const reference = await resolver().store("x".repeat(100), "instance");
    const payloads = resolver({ maxInMemoryRehydrationSize: 16 });
    await expect(payloads.resolve(reference)).rejects.toBeInstanceOf(PayloadRehydrationLimitError);
    expect(store.reads).toBe(0);
    const understated = new PayloadReference(reference.storeName, reference.key, 1, reference.contentHash);
    await expect(payloads.resolve(understated)).rejects.toBeInstanceOf(PayloadRehydrationLimitError);
    expect(store.closedReads).toBe(1);
  });

  it("checks SHA-256, supports opt-out, and rejects stage reversal", async () => {
    const reference = await resolver().store("value", "instance");
    store.files.set(`${reference.storeName}/${reference.key}`, Buffer.from('"altered"'));
    await expect(resolver().resolve(reference)).rejects.toBeInstanceOf(PayloadIntegrityError);
    expect(await resolver({ verifyIntegrityOnRead: false }).resolve(reference)).toBe("altered");
    const staged = new PayloadReference(reference.storeName, reference.key, reference.size, hash, [{ name: "gzip" }]);
    await expect(resolver().resolve(staged)).rejects.toThrow("stage reversal");
  });

  it("streams beyond the buffering limit and releases the source on early exit", async () => {
    const reference = await resolver().store("x".repeat(100), "instance");
    const payloads = resolver({ maxInMemoryRehydrationSize: 1 });
    const chunks: Buffer[] = [];
    for await (const chunk of payloads.open(reference)) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).toString()).toBe(JSON.stringify("x".repeat(100)));
    for await (const _chunk of payloads.open(reference)) break;
    expect(store.closedReads).toBe(2);
  });

  it("propagates cancellation before writes and reads, and during streaming", async () => {
    const reference = await resolver().store("long enough to chunk", "instance");
    const controller = new AbortController();
    const source = resolver().open(reference, controller.signal);
    const iterator = source[Symbol.asyncIterator]();
    await iterator.next();
    controller.abort();
    await expect(iterator.next()).rejects.toThrow();
    await expect(resolver().store("value", "instance", controller.signal)).rejects.toThrow();
    await expect(resolver().resolve(reference, controller.signal)).rejects.toThrow();
    expect(store.writes).toBe(1);
  });

  it("requires an explicit reference contract when leaving an envelope unresolved", async () => {
    const handler = new WorkflowPayloadHandler();
    expect(await handler.read(envelope, true)).toBeInstanceOf(PayloadReference);
    await expect(handler.read(envelope)).rejects.toBeInstanceOf(PayloadNotResolvableError);
    await expect(handler.read("123", true)).rejects.toThrow("requires a PayloadReference");
    await expect(handler.encode(envelope, { ...site, requireInline: true })).rejects.toBeInstanceOf(
      PayloadNotResolvableError,
    );
  });

  it("caches immutable wire bytes per execution, not caller-mutable objects; evicts at capacity", async () => {
    const payloads = resolver({ resolutionCacheSize: 1 });
    const reference = await payloads.store({ count: 1 }, "instance");
    const handler = new WorkflowPayloadHandler(payloads, undefined, true);
    const first = (await handler.read(reference.toEnvelope())) as { count: number };
    first.count = 9;
    expect(await handler.read(reference.toEnvelope())).toEqual({ count: 1 });
    expect(store.reads).toBe(1);
    const second = await payloads.store(2, "instance");
    await handler.read(second.toEnvelope());
    await handler.read(reference.toEnvelope());
    expect(store.reads).toBe(3);
    await new WorkflowPayloadHandler(payloads, undefined, true).read(reference.toEnvelope());
    expect(store.reads).toBe(4);
  });

  it("does not retain failed reads in the execution cache", async () => {
    const payloads = resolver();
    const reference = PayloadReference.parse(envelope)!;
    const handler = new WorkflowPayloadHandler(payloads, undefined, true);
    await expect(handler.read(envelope)).rejects.toBeInstanceOf(PayloadNotFoundError);
    store.files.set(`${reference.storeName}/${reference.key}`, Buffer.from('{"message":"hello"}'));
    expect(await handler.read(envelope)).toEqual({ message: "hello" });
    expect(store.reads).toBe(2);
  });

  it("shares concurrent reads when caching is enabled and supports disabling the cache", async () => {
    for (const resolutionCacheSize of [128, 0]) {
      const payloads = resolver({ resolutionCacheSize });
      const reference = await payloads.store("value", "instance");
      const handler = new WorkflowPayloadHandler(payloads, undefined, true);
      const reads = store.reads;
      expect(await Promise.all([handler.read(reference.toEnvelope()), handler.read(reference.toEnvelope())])).toEqual([
        "value",
        "value",
      ]);
      expect(store.reads - reads).toBe(resolutionCacheSize ? 1 : 2);
    }
  });

  it("applies defaults to undefined options without changing explicit zero, false, or null", () => {
    const payloads = resolver({
      offloadThreshold: undefined,
      writePreference: undefined,
      resolutionCacheSize: 0,
      verifyIntegrityOnRead: false,
    });
    expect(payloads.options.offloadThreshold).toBe(64 * 1024);
    expect(payloads.options.writePreference).toBe(PayloadWritePreference.Preserve);
    expect(payloads.options.resolutionCacheSize).toBe(0);
    expect(payloads.options.verifyIntegrityOnRead).toBe(false);
    expect(resolver({ offloadThreshold: null }).options.offloadThreshold).toBeNull();
  });

  it("cleans only manifest-owned references explicitly and retains records after failures", async () => {
    const manifest = new MemoryPayloadManifest();
    const payloads = resolver({ manifest });
    const owned = await payloads.store("owned", "one");
    const retained = await payloads.store("retained", "two");
    await payloads.store("owned", "one");
    expect(await manifest.list("one")).toHaveLength(1);
    const error = new ConnectError("denied", Code.PermissionDenied);
    jest.spyOn(store, "deleteBinaryFile").mockRejectedValueOnce(error);
    await expect(payloads.deletePayloads("one")).rejects.toBe(error);
    expect(await manifest.list("one")).toHaveLength(1);
    await payloads.deletePayloads("one");
    expect(await manifest.list("one")).toHaveLength(0);
    expect(store.files.has(`${retained.storeName}/${retained.key}`)).toBe(true);
    await expect(payloads.resolve(owned)).rejects.toBeInstanceOf(PayloadNotFoundError);
    await expect(resolver().deletePayloads("one")).rejects.toThrow("IWorkflowPayloadManifest");
  });

  it.each([
    { storeName: "" },
    { keyPrefix: "/root" },
    { keyPrefix: "a/../b" },
    { keyPrefix: "a\\b" },
    { offloadThreshold: 0 },
    { offloadThreshold: -1 },
    { maxInMemoryRehydrationSize: 0 },
    { resolutionCacheSize: -1 },
    { resolutionCacheSize: 0.5 },
    { offloadSites: 1024 },
  ])("validates configuration %j", (options) => {
    expect(() => resolver(options)).toThrow();
  });
});

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

import { Component, WorkflowHarness } from "@dapr/testcontainer-node";
import { spawn, execFile, type ChildProcessWithoutNullStreams } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import {
  BinaryStoreWorkflowPayloadResolver,
  PayloadReference,
  PayloadWritePreference,
  PayloadRehydrationLimitError,
  PayloadIntegrityError,
  PayloadNotFoundError,
  DaprClient,
  CommunicationProtocolEnum,
  DaprWorkflowClient,
  WorkflowRuntime,
  WorkflowContext,
  WorkflowActivityContext,
  WorkflowRuntimeStatus,
  type TWorkflow,
  type Task,
  type BinaryStorePayloadOptions,
} from "../../../src";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { DAPR_TEST_VERSION, evaluateMinimumDaprRuntime } from "../helpers/runtimeVersion";
import { CustomSerializer } from "../../fixtures/CustomSerializer";

const gate = evaluateMinimumDaprRuntime("1.19.0", DAPR_TEST_VERSION);
const describePayloads = gate.supported ? describe : describe.skip;
const dotnetProject = join(__dirname, "payload-interop-dotnet", "PayloadInterop.csproj");
const dotnetDll = join(__dirname, "payload-interop-dotnet", "bin", "Debug", "net10.0", "PayloadInterop.dll");

async function buildDotnetFixture(): Promise<void> {
  const run = promisify(execFile);
  const configured = process.env.DAPR_DOTNET_SDK_PATH;
  const source = configured ?? (await mkdtemp(join(tmpdir(), "dapr-payload-interop-")));
  try {
    if (!configured) {
      await run("git", ["init", "--quiet", source]);
      await run(
        "git",
        [
          "-C",
          source,
          "fetch",
          "--quiet",
          "--depth",
          "1",
          "https://github.com/dapr/dotnet-sdk.git",
          "5ae2908a059a25c9793a60fc3f45a8be1c22c522",
        ],
        { timeout: 120_000 },
      );
      await run("git", ["-C", source, "checkout", "--quiet", "--detach", "FETCH_HEAD"]);
    }
    await run(
      "dotnet",
      ["build", dotnetProject, `-p:DaprDotnetSdkPath=${source}`, "--verbosity", "quiet", "--nologo"],
      { timeout: 180_000, maxBuffer: 4 * 1024 * 1024 },
    );
  } finally {
    if (!configured) await rm(source, { recursive: true, force: true });
  }
}

function dotnet(args: string[], input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn("dotnet", [dotnetDll, ...args]);
    let stdout = "";
    let stderr = "";
    process.stdout.on("data", (data) => {
      stdout += data;
    });
    process.stderr.on("data", (data) => {
      stderr += data;
    });
    process.on("error", reject);
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error("Timed out waiting for .NET payload fixture"));
    }, 60_000);
    process.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) reject(new Error(`.NET payload fixture failed (${code}): ${stderr}\n${stdout}`));
      else resolve(stdout.trim());
    });
    process.stdin.on("error", reject);
    process.stdin.end(input);
  });
}

async function startDotnetWorker(endpoint: string, storeEndpoint: string): Promise<ChildProcessWithoutNullStreams> {
  const process = spawn("dotnet", [dotnetDll, "worker", endpoint, storeEndpoint]);
  return await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error(`.NET worker did not become ready: ${output}`));
    }, 60_000);
    process.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    process.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`.NET worker exited (${code}): ${output}`));
    });
    process.stderr.on("data", (data) => {
      output += data;
    });
    process.stdout.on("data", (data) => {
      output += data;
      if (output.includes("READY")) {
        clearTimeout(timeout);
        resolve(process);
      }
    });
  });
}

async function stopDotnetWorker(process: ChildProcessWithoutNullStreams): Promise<void> {
  if (process.exitCode !== null) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error(".NET worker shutdown timed out"));
    }, 15_000);
    process.once("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`.NET worker exited with code ${code}`));
    });
    process.stdin.end("\n");
  });
}

describePayloads(`workflow binary-store payloads (${gate.reason ?? DAPR_TEST_VERSION})`, () => {
  let harness: WorkflowHarness;
  let binaryClient: DaprClient;
  let client: DaprWorkflowClient;
  let runtime: WorkflowRuntime;
  let payloads: BinaryStoreWorkflowPayloadResolver;
  const options = () => ({ daprHost: harness.getHost(), daprPort: String(harness.getGrpcPort()) });
  const resolver = (extra: Partial<BinaryStorePayloadOptions> = {}) =>
    new BinaryStoreWorkflowPayloadResolver(binaryClient.binaryStore, {
      storeName: "payloads",
      writePreference: PayloadWritePreference.PreferReference,
      offloadThreshold: 64,
      ...extra,
    });

  beforeAll(async () => {
    harness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE });
    harness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withComponent(
        new Component("payloads", "binarystore.in-memory", "v1", [
          { name: "maxSize", value: "32Mi" },
          { name: "maxTotalSize", value: "128Mi" },
        ]),
      );
    await harness.start();
    binaryClient = new DaprClient({ ...options(), communicationProtocol: CommunicationProtocolEnum.GRPC });
  }, 180_000);

  beforeEach(() => {
    payloads = resolver();
    client = new DaprWorkflowClient({ ...options(), payloads });
    runtime = new WorkflowRuntime({ ...options(), payloads });
  });

  afterEach(async () => {
    if (runtime.isReady) await runtime.stop();
    await client.stop();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await binaryClient?.stop();
      await harness?.stop();
    });
  }, 60_000);

  async function waitForStatus(id: string) {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      const state = await client.getWorkflowState(id, true);
      if (state?.getCustomStatus<{ waiting: boolean }>()?.waiting) return;
      if (state?.runtimeStatus === WorkflowRuntimeStatus.FAILED)
        throw new Error(state.workflowFailureDetails?.getErrorMessage());
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Workflow ${id} did not become ready for its event`);
  }

  it("offloads large inputs, activity/child results, events, continue-as-new and custom status", async () => {
    const document = { text: "\u00e9".repeat(70_000) };
    const workflow: TWorkflow = function* (
      ctx: WorkflowContext,
      input: { text: string; continued?: boolean },
    ): Generator<Task<unknown>, unknown, unknown> {
      if (!input.continued) {
        ctx.setCustomStatus({ waiting: true, text: input.text });
        const event = yield ctx.waitForExternalEvent("continue");
        expect(event).toEqual(document);
        ctx.continueAsNew({ ...input, continued: true });
        return;
      }
      const activity = yield ctx.callActivity("echo", input);
      const child = yield ctx.callChildWorkflow("child", activity);
      ctx.setCustomStatus(child);
      return child;
    };
    runtime
      .registerWorkflowByName("large", workflow)
      .registerWorkflowByName("child", (_ctx, input) => {
        return input;
      })
      .registerActivityWithName("echo", (_ctx, input) => input);
    await runtime.start();
    const id = await client.scheduleNewWorkflow("large", document);
    await waitForStatus(id);
    const originalHistory = await client.getWorkflowHistory(id);
    const started = originalHistory.find((e) => e.eventType.case === "executionStarted")!.eventType;
    if (started.case !== "executionStarted") throw new Error("Missing input");
    expect(PayloadReference.parse(started.value.input)).toBeDefined();
    await client.raiseEvent(id, "continue", document);
    const state = await client.waitForWorkflowCompletion(id, true, 60);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.getOutput()).toEqual({ ...document, continued: true });
    expect(state?.getCustomStatus()).toEqual({ ...document, continued: true });
    expect(state?.getOutputReference()).toBeDefined();
    const history = await client.getWorkflowHistory(id);
    for (const event of history) {
      if (event.eventType.case === "taskScheduled")
        expect(PayloadReference.parse(event.eventType.value.input)).toBeDefined();
      if (event.eventType.case === "taskCompleted")
        expect(PayloadReference.parse(event.eventType.value.result)).toBeDefined();
      if (event.eventType.case === "childWorkflowInstanceCompleted")
        expect(PayloadReference.parse(event.eventType.value.result)).toBeDefined();
    }
    await client.purgeWorkflow(id);
    // Purge must not delete data another workflow or retained reference could still need.
    expect(await payloads.resolve(state!.getOutputReference()!)).toEqual({ ...document, continued: true });
  }, 90_000);

  it("streams explicit references without automatic buffering, including oversized state outputs", async () => {
    payloads = resolver({ maxInMemoryRehydrationSize: 128, writePreference: PayloadWritePreference.Preserve });
    runtime = new WorkflowRuntime({ ...options(), payloads });
    client = new DaprWorkflowClient({ ...options(), payloads });
    const data = { text: "x".repeat(256 * 1024) };
    const reference = await payloads.store(data, randomUUID());
    runtime.registerWorkflowByName(
      "stream",
      async function* (ctx, input: PayloadReference): AsyncGenerator<Task<unknown>, unknown, unknown> {
        expect(input).toBeInstanceOf(PayloadReference);
        const stream = yield ctx.openPayload(input);
        const chunks: Buffer[] = [];
        for await (const chunk of stream as Readable) chunks.push(Buffer.from(chunk));
        expect(JSON.parse(Buffer.concat(chunks).toString())).toEqual(data);
        return yield ctx.callActivity("referenceEcho", input, { resultAsReference: true });
      },
      { inputAsReference: true },
    );
    runtime.registerActivityWithName("referenceEcho", (_ctx, input) => input, { inputAsReference: true });
    await runtime.start();
    const id = await client.scheduleNewWorkflow("stream", reference);
    const state = await client.waitForWorkflowCompletion(id, true, 60);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.getOutputReference()).toEqual(reference);
    expect(() => state?.getOutput()).toThrow(PayloadRehydrationLimitError);
    await client.purgeWorkflow(id);
  }, 90_000);

  it.each([PayloadWritePreference.Preserve, PayloadWritePreference.PreferInline])(
    "replays historical references after a worker restart with write policy %s",
    async (writePreference) => {
      const input = { text: "retained".repeat(20_000) };
      const workflow: TWorkflow = function* (ctx, value): Generator<Task<unknown>, unknown, unknown> {
        ctx.setCustomStatus({ waiting: true });
        yield ctx.waitForExternalEvent("finish");
        return value;
      };
      runtime.registerWorkflowByName("migration", workflow);
      await runtime.start();
      const id = await client.scheduleNewWorkflow("migration", input);
      await waitForStatus(id);
      await runtime.stop();
      const next = resolver({ writePreference });
      runtime = new WorkflowRuntime({ ...options(), payloads: next });
      runtime.registerWorkflowByName("migration", workflow);
      await runtime.start();
      await client.raiseEvent(id, "finish");
      const state = await client.waitForWorkflowCompletion(id, true, 60);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.getInputReference()).toBeDefined();
      expect(state?.getOutput()).toEqual(input);
      expect(state?.getOutputReference()).toBeUndefined();
      await client.purgeWorkflow(id);
    },
    90_000,
  );

  it.each(["missing", "corrupt", "limit"] as const)(
    "fails explicitly on %s payloads",
    async (mode) => {
      const original = await payloads.store({ text: "x".repeat(1000) }, randomUUID());
      const reference =
        mode === "limit"
          ? new PayloadReference(original.storeName, original.key, 32 * 1024 * 1024, original.contentHash)
          : original;
      if (mode === "missing") await binaryClient.binaryStore.deleteBinaryFile(original.storeName, original.key);
      if (mode === "corrupt")
        await binaryClient.binaryStore.setBinaryFile(original.storeName, original.key, Buffer.from('"corrupt"'), {
          overwrite: true,
        });
      let called = false;
      runtime.registerWorkflowByName("failure", () => {
        called = true;
        return;
      });
      await runtime.start();
      const id = await client.scheduleNewWorkflow("failure", reference);
      const state = await client.waitForWorkflowCompletion(id, false, 60);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.FAILED);
      const completion = (await client.getWorkflowHistory(id)).find(
        (event) => event.eventType.case === "executionCompleted",
      )?.eventType;
      if (completion?.case !== "executionCompleted") throw new Error("Missing completion history");
      expect(completion.value.failureDetails?.errorType).toContain(
        mode === "missing"
          ? "PayloadNotFoundError"
          : mode === "corrupt"
          ? "PayloadIntegrityError"
          : "PayloadRehydrationLimitError",
      );
      expect(called).toBe(false);
      await client.purgeWorkflow(id);
    },
    90_000,
  );

  it("supports non-JSON serializers while leaving the reference envelope as standard JSON", async () => {
    const serializer = new CustomSerializer();
    payloads = new BinaryStoreWorkflowPayloadResolver(
      binaryClient.binaryStore,
      {
        storeName: "payloads",
        writePreference: PayloadWritePreference.PreferReference,
        offloadThreshold: 1,
      },
      serializer,
    );
    client = new DaprWorkflowClient({ ...options(), payloads });
    runtime = new WorkflowRuntime({ ...options(), payloads });
    runtime
      .registerWorkflowByName("custom", function* (ctx, input): Generator<Task<unknown>, unknown, unknown> {
        return yield ctx.callActivity("customEcho", input);
      })
      .registerActivityWithName("customEcho", (_ctx, input) => input);
    await runtime.start();
    const id = await client.scheduleNewWorkflow("custom", { value: 123n });
    const state = await client.waitForWorkflowCompletion(id, true, 60);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.getOutput()).toEqual({ value: 123n });
    expect(state?.getOutputReference()).toBeDefined();
    await client.purgeWorkflow(id);
  }, 90_000);

  describe("actual .NET SDK interoperability", () => {
    beforeAll(buildDotnetFixture, 300_000);

    it.each([
      { name: "null", value: null },
      { name: "false", value: false },
      { name: "zero", value: 0 },
      { name: "empty string", value: "" },
      { name: "Unicode and escaped characters", value: '\u00e9 \u4e16\u754c \ud83d\ude80 \u0000\n"\\/' },
      { name: "JSON-looking string", value: '{"$daprRef":{"v":999}}' },
      { name: "nested values", value: { values: [null, false, 0, "", { title: "\u00e9" }], empty: {} } },
    ])(
      "exchanges $name in both directions without changing envelope metadata",
      async ({ value }) => {
        const endpoint = `http://${harness.getHost()}:${harness.getGrpcPort()}`;
        const fromJs = await payloads.store(value, randomUUID());
        const dotnetWire = await dotnet(["roundtrip", endpoint], fromJs.toEnvelope());
        expect(JSON.parse(dotnetWire)).toEqual(JSON.parse(fromJs.toEnvelope()));
        expect(PayloadReference.parse(dotnetWire)).toEqual(fromJs);
        expect(JSON.parse(await dotnet(["resolve", endpoint], fromJs.toEnvelope()))).toEqual(value);

        const fromDotnet = await dotnet(["store", endpoint, randomUUID()], JSON.stringify(value));
        const reference = PayloadReference.parse(fromDotnet)!;
        expect(reference).toBeDefined();
        expect(await payloads.resolve(reference)).toEqual(value);
        const bytes = await binaryClient.binaryStore.getBinaryFileBytes(reference.storeName, reference.key);
        expect(reference.size).toBe(bytes.length);
        expect(reference.contentHash).toBe(createHash("sha256").update(bytes).digest("hex"));
        expect(reference.key).toMatch(new RegExp(`/${reference.contentHash}$`));
        expect(JSON.parse(await dotnet(["roundtrip", endpoint], reference.toEnvelope()))).toEqual(
          JSON.parse(fromDotnet),
        );
      },
      60_000,
    );

    it.each([false, true])(
      "round-trips optional stages and Unicode metadata without fetching bytes (stages=%s)",
      async (staged) => {
        const reference = new PayloadReference(
          "unavailable-store",
          "folder/\u00e9 \u4e16\u754c.json",
          123,
          "a".repeat(64),
          staged
            ? [{ name: "gzip" }, { name: "custom", metadata: { label: "\u00e9", empty: "", escaped: '\n"\\' } }]
            : [],
        );
        const wire = await dotnet(
          ["roundtrip", `http://${harness.getHost()}:${harness.getGrpcPort()}`],
          reference.toEnvelope(),
        );
        expect(JSON.parse(wire)).toEqual(JSON.parse(reference.toEnvelope()));
        expect(PayloadReference.parse(wire)).toEqual(reference);
        const body = JSON.parse(wire).$daprRef;
        expect(Object.keys(body)).toEqual(
          staged ? ["v", "store", "key", "size", "sha256", "stages"] : ["v", "store", "key", "size", "sha256"],
        );
        if (staged) expect(body.stages[0]).not.toHaveProperty("m");
      },
      60_000,
    );

    it.each(["JS", ".NET"])(
      "detects corruption and deletion of a reference originally written by %s",
      async (producer) => {
        const endpoint = `http://${harness.getHost()}:${harness.getGrpcPort()}`;
        const reference =
          producer === "JS"
            ? await payloads.store({ value: "original" }, randomUUID())
            : PayloadReference.parse(await dotnet(["store", endpoint, randomUUID()], '{"value":"original"}'))!;
        await binaryClient.binaryStore.setBinaryFile(
          reference.storeName,
          reference.key,
          Buffer.from('{"value":"modified"}'),
          { overwrite: true },
        );
        await expect(payloads.resolve(reference)).rejects.toBeInstanceOf(PayloadIntegrityError);
        await expect(dotnet(["resolve", endpoint], reference.toEnvelope())).rejects.toThrow(
          "PayloadIntegrityException",
        );
        await binaryClient.binaryStore.deleteBinaryFile(reference.storeName, reference.key);
        await expect(payloads.resolve(reference)).rejects.toBeInstanceOf(PayloadNotFoundError);
        await expect(dotnet(["resolve", endpoint], reference.toEnvelope())).rejects.toThrow("PayloadNotFoundException");
      },
      60_000,
    );

    it("forwards an unresolved envelope through JS and .NET workers without adding SDK-specific fields", async () => {
      // A nonexistent store and unsupported stage make any accidental rehydration fail.
      const reference = new PayloadReference("unavailable-store", "no-such-file", 32 * 1024 * 1024, "b".repeat(64), [
        { name: "opaque", metadata: { format: "application-owned" } },
      ]);
      const endpoint = `http://${harness.getHost()}:${harness.getGrpcPort()}`;
      runtime.registerWorkflowByName("passthrough", (_ctx, input) => input, { inputAsReference: true });
      await runtime.start();
      const metadataClient = new DaprWorkflowClient(options());
      try {
        const id = randomUUID();
        await dotnet(["schedule", endpoint, "passthrough", id], reference.toEnvelope());
        const state = await metadataClient.waitForWorkflowCompletion(id);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(state?.serializedInput).toBe(reference.toEnvelope());
        expect(state?.serializedOutput).toBe(reference.toEnvelope());
        expect(state?.getOutputReference()).toEqual(reference);
        await metadataClient.purgeWorkflow(id);
        await runtime.stop();

        // Reuse the sidecar after the JS worker has stopped; the .NET worker receives the same envelope.
        const worker = await startDotnetWorker(endpoint, endpoint);
        try {
          const remoteId = await metadataClient.scheduleNewWorkflow(
            "DotnetPassthroughWorkflow",
            state!.getOutputReference(),
          );
          const remoteState = await metadataClient.waitForWorkflowCompletion(remoteId);
          expect(remoteState?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
          expect(remoteState?.serializedOutput).toBe(reference.toEnvelope());
          expect(remoteState?.getOutputReference()).toEqual(reference);
          await metadataClient.purgeWorkflow(remoteId);
        } finally {
          await stopDotnetWorker(worker);
        }
      } finally {
        await metadataClient.stop();
      }
    }, 90_000);

    it("interoperates bidirectionally with the actual .NET SDK, including both workflow workers", async () => {
      const endpoint = `http://${harness.getHost()}:${harness.getGrpcPort()}`;
      const document = {
        title: "\u00e9 \u4e16\u754c",
        content: "cross-SDK".repeat(16_000),
        values: [false, 0, null, "YWJj"],
      };
      const fromDotnet = await dotnet(["store", endpoint, randomUUID()], JSON.stringify(document));
      const dotnetReference = PayloadReference.parse(fromDotnet)!;
      expect(dotnetReference).toBeDefined();
      expect(await payloads.resolve(dotnetReference)).toEqual(document);
      expect(JSON.parse(dotnetReference.toEnvelope())).toEqual(JSON.parse(fromDotnet));

      runtime.registerWorkflowByName(
        "jsReference",
        function* (ctx, input: PayloadReference): Generator<Task<unknown>, unknown, unknown> {
          expect(input).toBeInstanceOf(PayloadReference);
          const materialized = yield ctx.resolvePayload(input);
          return yield ctx.callActivity("jsStore", materialized, { resultAsReference: true });
        },
        { inputAsReference: true },
      );
      runtime.registerActivityWithName("jsStore", (ctx: WorkflowActivityContext, value) =>
        ctx.payloads.store(value, ctx.getWorkflowInstanceId()),
      );
      await runtime.start();
      const jsId = randomUUID();
      expect(await dotnet(["schedule", endpoint, "jsReference", jsId], fromDotnet)).toBe(jsId);
      const jsState = await client.waitForWorkflowCompletion(jsId, true, 60);
      expect(jsState?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(jsState?.getOutput()).toEqual(document);
      const fromJs = jsState!.getOutputReference()!.toEnvelope();
      expect(JSON.parse(await dotnet(["resolve", endpoint], fromJs))).toEqual(document);

      const remote = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE, appId: "payload-dotnet" });
      remote
        .getDaprContainer()
        .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
        .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
      let worker: ChildProcessWithoutNullStreams | undefined;
      let remoteClient: DaprWorkflowClient | undefined;
      try {
        await remote.start();
        worker = await startDotnetWorker(`http://${remote.getHost()}:${remote.getGrpcPort()}`, endpoint);
        remoteClient = new DaprWorkflowClient({
          daprHost: remote.getHost(),
          daprPort: String(remote.getGrpcPort()),
          payloads,
        });
        for (const workflow of ["DotnetReferenceWorkflow", "DotnetAutomaticWorkflow"]) {
          const id = await remoteClient.scheduleNewWorkflow(workflow, PayloadReference.parse(fromJs)!);
          const state = await remoteClient.waitForWorkflowCompletion(id, true, 60);
          expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
          expect(state?.getOutput()).toEqual(document);
          expect(state?.getOutputReference()).toBeDefined();
          await remoteClient.purgeWorkflow(id);
        }
      } finally {
        try {
          if (worker) await stopDotnetWorker(worker);
        } finally {
          try {
            await remoteClient?.stop();
          } finally {
            await remote.stop();
          }
        }
      }
      await client.purgeWorkflow(jsId);
    }, 300_000);
  });
});

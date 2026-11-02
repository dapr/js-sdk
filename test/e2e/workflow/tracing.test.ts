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

import { WorkflowHarness, type DaprTelemetryCollector, type ZipkinSpan } from "@dapr/testcontainer-node";
import { GenericContainer, Network, Wait, type StartedNetwork, type StartedTestContainer } from "testcontainers";
import { context, createTraceState, ROOT_CONTEXT, trace, TraceFlags } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import {
  DaprWorkflowClient,
  WorkflowRuntime,
  WorkflowRuntimeStatus,
  type WorkflowContext,
  type Task,
  type TWorkflow,
} from "../../../src";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
  buildStateRedisComponent,
} from "../helpers/containers";
import { DAPR_TEST_VERSION, evaluateMinimumDaprRuntime } from "../helpers/runtimeVersion";

const describeTracing = evaluateMinimumDaprRuntime("1.17", DAPR_TEST_VERSION).supported ? describe : describe.skip;

describeTracing("workflow Zipkin tracing", () => {
  let harness: WorkflowHarness;
  let network: StartedNetwork;
  let collector: DaprTelemetryCollector;
  let provider: NodeTracerProvider;
  let manager: AsyncLocalStorageContextManager;
  let client: DaprWorkflowClient;
  let runtime: WorkflowRuntime;
  const observations: { instanceId: string; replay: boolean; traceId?: string }[] = [];
  const attempts = new Map<string, number>();

  beforeAll(async () => {
    network = await new Network().start();
    harness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE, network }).enableTelemetryCapture();
    harness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
    await harness.start();
    collector = harness.getTelemetryCollector()!;
    manager = new AsyncLocalStorageContextManager();
    provider = new NodeTracerProvider({
      resource: resourceFromAttributes({ "service.name": "js-workflow-tests" }),
      spanProcessors: [
        new SimpleSpanProcessor(
          new ZipkinExporter({
            url: collector.getZipkinEndpointAddress(),
            serviceName: "js-workflow-tests",
          }),
        ),
      ],
    });
    provider.register({ contextManager: manager });
  }, 180_000);

  beforeEach(() => {
    observations.length = 0;
    attempts.clear();
    const options = { daprHost: harness.getHost(), daprPort: String(harness.getGrpcPort()) };
    // Exercise this checkout, not the SDK bundled in the harness.
    client = new DaprWorkflowClient(options);
    runtime = new WorkflowRuntime(options);
    registerActivities(runtime);
  });

  function registerActivities(target: WorkflowRuntime) {
    for (const name of ["echo", "retry", "fail"]) {
      target.registerActivityWithName(name, async (ctx, input: number) => {
        const before = trace.getSpan(context.active())?.spanContext();
        expect(before).toBeDefined();
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(trace.getSpan(context.active())?.spanContext()).toEqual(before);
        return trace.getTracer("workflow-tests").startActiveSpan("downstream", async (span) => {
          try {
            await new Promise<void>((resolve) => setImmediate(resolve));
            const key = `${ctx.getWorkflowInstanceId()}:${name}`;
            const attempt = (attempts.get(key) ?? 0) + 1;
            attempts.set(key, attempt);
            if (name === "fail" || (name === "retry" && attempt < 3)) {
              throw new Error(`activity failure ${attempt}`);
            }
            return input * 2;
          } finally {
            span.end();
          }
        });
      });
    }
  }

  afterEach(async () => {
    try {
      await runtime?.stop();
    } finally {
      await client?.stop();
      await provider?.forceFlush();
    }
  });

  afterAll(async () => {
    try {
      await provider?.shutdown();
    } finally {
      context.disable();
      trace.disable();
      manager?.disable();
      await runWithCleanupErrorSuppression(async () => {
        try {
          await harness?.stop();
        } finally {
          await network?.stop();
        }
      });
    }
  }, 60_000);

  function observe(ctx: WorkflowContext) {
    observations.push({
      instanceId: ctx.getWorkflowInstanceId(),
      replay: ctx.isReplaying(),
      traceId: trace.getSpan(context.active())?.spanContext().traceId,
    });
  }

  async function schedule(workflow: string, input?: unknown) {
    return trace.getTracer("workflow-tests").startActiveSpan("caller", {}, ROOT_CONTEXT, async (span) => {
      try {
        const id = await client.scheduleNewWorkflow(workflow, input);
        return { id, traceId: span.spanContext().traceId, callerId: span.spanContext().spanId };
      } finally {
        span.end();
      }
    });
  }

  async function complete(id: string, output: unknown, failed = false) {
    const state = await client.waitForWorkflowCompletion(id, true, 30);
    expect(state?.runtimeStatus).toBe(failed ? WorkflowRuntimeStatus.FAILED : WorkflowRuntimeStatus.COMPLETED);
    if (failed) {
      expect(state?.workflowFailureDetails?.getErrorMessage()).toContain("activity failure");
    } else {
      expect(state?.getOutput()).toEqual(output);
    }
  }

  async function assertTrace(traceId: string, activityName: string, expectedCount: number, errors = 0) {
    await provider.forceFlush();
    const matching = (name: string) =>
      collector
        .getZipkinSpans()
        .filter((span) => span.traceId === traceId && span.name?.toLowerCase() === name.toLowerCase());
    const runtimeName = `activity||${activityName}`;
    const sdkName = `WorkflowActivity ${activityName}`;
    await collector.waitForZipkinSpan(
      () => matching(runtimeName).length >= expectedCount && matching(sdkName).length >= expectedCount,
      30_000,
    );
    const runtimeSpans = matching(runtimeName);
    const sdkSpans = matching(sdkName);
    expect(runtimeSpans).toHaveLength(expectedCount);
    expect(sdkSpans).toHaveLength(expectedCount);
    expect(new Set(sdkSpans.map((span) => span.id)).size).toBe(expectedCount);
    expect(new Set(sdkSpans.map((span) => span.parentId)).size).toBe(expectedCount);
    for (const sdk of sdkSpans) {
      expect(runtimeSpans.some((span) => span.id === sdk.parentId)).toBe(true);
      expect(sdk.localEndpoint?.serviceName).toBe("js-workflow-tests");
      expect(sdk.duration).toBeGreaterThan(0);
      expect(matching("downstream").filter((span) => span.parentId === sdk.id)).toHaveLength(1);
    }
    expect(sdkSpans.filter((span) => span.tags?.["otel.status_code"] === "ERROR")).toHaveLength(errors);
    const workflowObservations = observations.filter((entry) => entry.traceId === traceId);
    expect(workflowObservations.length).toBeGreaterThan(0);
    expect(
      collector
        .getZipkinSpans()
        .filter((span) => span.traceId === traceId && span.name === "WorkflowOrchestrationTurn"),
    ).toHaveLength(0);
    expect(trace.getSpan(context.active())).toBeUndefined();
    return sdkSpans;
  }

  it("connects the caller, runtime activity, SDK activity and downstream spans", async () => {
    runtime.registerWorkflowByName("simple", function* (ctx): Generator<Task<number>, number, number> {
      observe(ctx);
      return yield ctx.callActivity("echo", 21);
    });
    await runtime.start();
    const run = await schedule("simple");
    await complete(run.id, 42);
    await assertTrace(run.traceId, "echo", 1);
    const history = await client.getWorkflowHistory(run.id);
    const start = history.find((event) => event.eventType.case === "executionStarted");
    const created = await collector.waitForZipkinSpan(
      (span) => span.traceId === run.traceId && span.name === "create_orchestration||simple",
      30_000,
    );
    expect(created.parentId).toBe(run.callerId);
    expect(start?.eventType.case === "executionStarted" && start.eventType.value.parentTraceContext?.traceParent).toBe(
      `00-${run.traceId}-${created.id}-01`,
    );
    const orchestration = await collector.waitForZipkinSpan(
      (span) => span.traceId === run.traceId && span.name === "orchestration||simple",
      30_000,
    );
    expect(orchestration.parentId).toBe(created.id);
    const activity = await collector.waitForZipkinSpan(
      (span) => span.traceId === run.traceId && span.name === "activity||echo",
      30_000,
    );
    expect(activity.parentId).toBe(orchestration.id);
    expect(observations.every((entry) => entry.traceId === run.traceId)).toBe(true);
    expect(observations.some((entry) => entry.replay)).toBe(true);
  }, 65_000);

  it("preserves tracing through child workflows and asynchronous generators", async () => {
    runtime.registerWorkflowByName("child", async function* (ctx): AsyncGenerator<Task<number>, number, number> {
      await new Promise<void>((resolve) => setImmediate(resolve));
      observe(ctx);
      return yield ctx.callActivity("echo", 5);
    });
    runtime.registerWorkflowByName("parent", function* (ctx): Generator<Task<number>, number, number> {
      observe(ctx);
      return yield ctx.callChildWorkflow("child");
    });
    await runtime.start();
    const run = await schedule("parent");
    await complete(run.id, 10);
    await assertTrace(run.traceId, "echo", 1);
    expect(new Set(observations.map((entry) => entry.instanceId)).size).toBe(2);
    expect(observations.every((entry) => entry.traceId === run.traceId)).toBe(true);
  }, 65_000);

  it("isolates concurrent workflow traces while preserving fan-out/fan-in ancestry", async () => {
    runtime.registerWorkflowByName("parallel", function* (ctx): Generator<Task<number[]>, number[], number[]> {
      observe(ctx);
      return yield ctx.whenAll([1, 2, 3].map((input) => ctx.callActivity<number>("echo", input)));
    });
    await runtime.start();
    const runs = await Promise.all([schedule("parallel"), schedule("parallel")]);
    expect(runs[0].traceId).not.toBe(runs[1].traceId);
    await Promise.all(
      runs.map(async (run) => {
        await complete(run.id, [2, 4, 6]);
        await assertTrace(run.traceId, "echo", 3);
        expect(
          observations.filter((entry) => entry.instanceId === run.id).every((entry) => entry.traceId === run.traceId),
        ).toBe(true);
      }),
    );
  }, 65_000);

  it("emits exactly one activity span per retry attempt and marks only failed attempts", async () => {
    runtime.registerWorkflowByName("retrying", function* (ctx): Generator<Task<number>, number, number> {
      observe(ctx);
      return yield ctx.callActivity("retry", 4, {
        retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 3, backoffCoefficient: 1 },
      });
    });
    await runtime.start();
    const run = await schedule("retrying");
    await complete(run.id, 8);
    await assertTrace(run.traceId, "retry", 3, 2);
    expect(attempts.get(`${run.id}:retry`)).toBe(3);
  }, 65_000);

  it("keeps failed activity spans connected and preserves workflow failure history", async () => {
    runtime.registerWorkflowByName("failing", function* (ctx): Generator<Task<number>, number, number> {
      observe(ctx);
      return yield ctx.callActivity("fail", 1);
    });
    await runtime.start();
    const run = await schedule("failing");
    await complete(run.id, undefined, true);
    await assertTrace(run.traceId, "fail", 1, 1);
    expect((await client.getWorkflowHistory(run.id)).some((event) => event.eventType.case === "taskFailed")).toBe(true);
  }, 65_000);

  it("restores context after timer and external-event replay without duplicating activity spans", async () => {
    const workflow: TWorkflow = function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      observe(ctx);
      yield ctx.callActivity("echo", 1);
      yield ctx.createTimer(1);
      yield ctx.waitForExternalEvent("resume");
      observe(ctx);
      return yield ctx.callActivity("echo", 2);
    };
    runtime.registerWorkflowByName("waiting", workflow);
    await runtime.start();
    const run = await schedule("waiting");
    await client.waitForWorkflowStart(run.id, false, 30);
    await client.raiseEvent(run.id, "resume", "approved");
    await complete(run.id, 4);
    await assertTrace(run.traceId, "echo", 2);
    expect(observations.filter((entry) => entry.replay).length).toBeGreaterThan(1);
    expect(observations.every((entry) => entry.traceId === run.traceId)).toBe(true);
  }, 65_000);

  it("restores the runtime's trace context after continue-as-new", async () => {
    const executionTraces: string[] = [];
    runtime.registerWorkflowByName("continuing", function* (ctx, iteration: number): Generator<
      Task<number>,
      number | undefined,
      number
    > {
      observe(ctx);
      if (!ctx.isReplaying()) {
        const traceId = trace.getSpan(context.active())?.spanContext().traceId;
        expect(traceId).toBeDefined();
        executionTraces.push(traceId!);
      }
      const result = yield ctx.callActivity("echo", iteration);
      if (iteration === 1) {
        ctx.continueAsNew(2);
        return;
      }
      return result;
    });
    await runtime.start();
    const run = await schedule("continuing", 1);
    await complete(run.id, 4);
    expect(executionTraces).toHaveLength(2);
    expect(executionTraces[0]).toBe(run.traceId);
    // The runtime may start a new trace for the next execution. Follow its history,
    // rather than requiring the SDK to invent continuity across executions.
    for (const traceId of new Set(executionTraces)) {
      await assertTrace(traceId, "echo", executionTraces.filter((id) => id === traceId).length);
    }
    const history = await client.getWorkflowHistory(run.id);
    const start = history.find((event) => event.eventType.case === "executionStarted");
    expect(
      start?.eventType.case === "executionStarted" && start.eventType.value.parentTraceContext?.traceParent,
    ).toContain(executionTraces[1]);
  }, 65_000);

  it("preserves W3C tracestate supplied by the scheduling application", async () => {
    const traceId = "abcde01234567890abcde01234567890";
    runtime.registerActivityWithName("state", () =>
      trace.getSpan(context.active())?.spanContext().traceState?.serialize(),
    );
    runtime.registerWorkflowByName("withState", function* (ctx): Generator<Task<string>, string, string> {
      observe(ctx);
      return yield ctx.callActivity("state");
    });
    await runtime.start();
    const id = await context.with(
      trace.setSpanContext(ROOT_CONTEXT, {
        traceId,
        spanId: "1234567890abcdef",
        traceFlags: TraceFlags.SAMPLED,
        traceState: createTraceState("vendor=value"),
      }),
      () => client.scheduleNewWorkflow("withState"),
    );
    await complete(id, "vendor=value");
    await provider.forceFlush();
    const sdk = await collector.waitForZipkinSpan(
      (span: ZipkinSpan) => span.traceId === traceId && span.name?.toLowerCase() === "workflowactivity state",
      30_000,
    );
    await collector.waitForZipkinSpan(
      (span) => span.traceId === traceId && span.id === sdk.parentId && span.name === "activity||state",
      30_000,
    );
  }, 65_000);

  it("connects remote activities and child workflows across applications", async () => {
    let remoteSidecar: StartedTestContainer | undefined;
    let remoteRuntime: WorkflowRuntime | undefined;
    try {
      remoteSidecar = await new GenericContainer(DAPR_TEST_RUNTIME_IMAGE)
        .withNetwork(network)
        .withExposedPorts(3500, 50001)
        .withCopyContentToContainer([
          { content: buildStateRedisComponent(true).toYaml(), target: "/components/statestore.yaml" },
          {
            content: `apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: tracing
spec:
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: "${collector.getZipkinEndpointAddressForDapr()}"
`,
            target: "/tracing.yaml",
          },
        ])
        .withCommand([
          "./daprd",
          "--app-id",
          "workflow-tracing-remote",
          "--dapr-listen-addresses",
          "0.0.0.0",
          "--placement-host-address",
          "placement:50005",
          "--scheduler-host-address",
          "scheduler:51005",
          "--resources-path",
          "/components",
          "--config",
          "/tracing.yaml",
        ])
        .withWaitStrategy(Wait.forLogMessage(/Workflow engine started/i))
        .withStartupTimeout(120_000)
        .start();
      remoteRuntime = new WorkflowRuntime({
        daprHost: remoteSidecar.getHost(),
        daprPort: String(remoteSidecar.getMappedPort(50001)),
      });
      registerActivities(remoteRuntime);
      remoteRuntime.registerWorkflowByName("remoteChild", function* (ctx): Generator<Task<number>, number, number> {
        observe(ctx);
        return yield ctx.callActivity("echo", 3);
      });
      runtime.registerWorkflowByName("remoteParent", function* (ctx): Generator<Task<number>, number, number> {
        observe(ctx);
        const activity = yield ctx.callActivity("echo", 2, { targetAppId: "workflow-tracing-remote" });
        const child = yield ctx.callChildWorkflow("remoteChild", undefined, undefined, {
          targetAppId: "workflow-tracing-remote",
        });
        return activity + child;
      });
      await remoteRuntime.start();
      await runtime.start();
      const run = await schedule("remoteParent");
      await complete(run.id, 10);
      await assertTrace(run.traceId, "echo", 2);
      const remoteSpans = collector
        .getZipkinSpans()
        .filter((span) => span.traceId === run.traceId && span.name === "activity||echo");
      expect(remoteSpans.every((span) => span.localEndpoint?.serviceName === "workflow-tracing-remote")).toBe(true);
      expect(new Set(observations.map((entry) => entry.instanceId)).size).toBe(2);
      expect(observations.every((entry) => entry.traceId === run.traceId)).toBe(true);
    } finally {
      try {
        await remoteRuntime?.stop();
      } finally {
        await runWithCleanupErrorSuppression(async () => {
          await remoteSidecar?.stop();
        });
      }
    }
  }, 180_000);
});

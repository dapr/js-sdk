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

import { create } from "@bufbuild/protobuf";
import { context, createTraceState, ROOT_CONTEXT, SpanStatusCode, trace, TraceFlags } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { TaskHubClient, TaskHubWorker } from "../../../src/workflow/engine";
import { TraceContextSchema } from "../../../src/proto/dapr/proto/durabletask/v1/orchestration_pb";
import { type WorkItem, WorkItemSchema } from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import { getOrchestrationTraceContext, runWithActivityTrace } from "../../../src/workflow/engine/worker/WorkflowTrace";
import {
  newExecutionStartedEvent,
  newTaskCompletedEvent,
  newTaskScheduledEvent,
} from "../../../src/workflow/engine/worker/protoHelpers";

const mockClient = {
  startInstance: jest.fn(),
  hello: jest.fn(),
  getWorkItems: jest.fn(),
  completeActivityTask: jest.fn(),
  completeOrchestratorTask: jest.fn(),
};
jest.mock("@connectrpc/connect", () => ({
  ...jest.requireActual("@connectrpc/connect"),
  createClient: () => mockClient,
}));

const parent = {
  traceId: "0123456789abcdef0123456789abcdef",
  spanId: "0123456789abcdef",
  traceFlags: TraceFlags.SAMPLED,
  traceState: createTraceState("vendor=value"),
  isRemote: true,
};
const wireParent = create(TraceContextSchema, {
  traceParent: `00-${parent.traceId}-${parent.spanId}-01`,
  traceState: "vendor=value",
});
const active = () => trace.getSpan(context.active())?.spanContext();
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

async function runWorkItems(worker: TaskHubWorker, items: WorkItem[]) {
  let completed = 0;
  let resolveCompleted!: () => void;
  const completion = new Promise<void>((resolve) => (resolveCompleted = resolve));
  const complete = jest.fn(async () => {
    if (++completed === items.length) resolveCompleted();
    return {};
  });
  mockClient.completeActivityTask.mockImplementation(complete);
  mockClient.completeOrchestratorTask.mockImplementation(complete);
  mockClient.getWorkItems.mockImplementation(async function* (_request, options: { signal: AbortSignal }) {
    const stopped = new Promise<void>((resolve) =>
      options.signal.addEventListener("abort", () => resolve(), { once: true }),
    );
    yield* items;
    await stopped;
  });
  await worker.start();
  try {
    await completion;
  } finally {
    await worker.stop();
  }
}

describe("workflow OpenTelemetry tracing", () => {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  const manager = new AsyncLocalStorageContextManager();

  beforeAll(() => provider.register({ contextManager: manager }));
  beforeEach(() => {
    exporter.reset();
    jest.resetAllMocks();
    mockClient.hello.mockResolvedValue({});
    mockClient.startInstance.mockImplementation(async (request) => ({ instanceId: request.instanceId }));
  });
  afterAll(async () => {
    await provider.shutdown();
    context.disable();
    trace.disable();
    manager.disable();
  });

  it.each([TraceFlags.SAMPLED, TraceFlags.NONE])(
    "propagates scheduling context and sampling flag %s",
    async (traceFlags) => {
      const client = new TaskHubClient("localhost:50001");
      await context.with(trace.setSpanContext(ROOT_CONTEXT, { ...parent, traceFlags }), () =>
        client.scheduleNewOrchestration("workflow", { value: 1 }, "instance"),
      );
      expect(mockClient.startInstance.mock.calls[0][0]).toMatchObject({
        instanceId: "instance",
        input: '{"value":1}',
        parentTraceContext: {
          traceParent: `00-${parent.traceId}-${parent.spanId}-0${traceFlags}`,
          traceState: "vendor=value",
        },
      });
      expect(active()).toBeUndefined();
    },
  );

  it("leaves untraced scheduling unchanged and preserves RPC errors", async () => {
    const client = new TaskHubClient("localhost:50001");
    await client.scheduleNewOrchestration("workflow", undefined, "instance");
    expect(mockClient.startInstance.mock.calls[0][0].parentTraceContext).toBeUndefined();
    const error = new Error("unavailable");
    mockClient.startInstance.mockRejectedValueOnce(error);
    await expect(client.scheduleNewOrchestration("workflow")).rejects.toBe(error);
    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it("connects worker activity and downstream spans, including asynchronous execution", async () => {
    const worker = new TaskHubWorker("localhost:50001");
    worker.registry.addNamedActivity("echo", async () => {
      const before = active();
      await tick();
      expect(active()).toEqual(before);
      expect(before?.traceState?.serialize()).toBe("vendor=value");
      return trace.getTracer("test").startActiveSpan("downstream", (span) => {
        expect(span.spanContext().traceId).toBe(parent.traceId);
        span.end();
        return 42;
      });
    });
    await runWorkItems(worker, [
      create(WorkItemSchema, {
        request: {
          case: "activityRequest",
          value: { name: "echo", workflowInstance: { instanceId: "instance" }, parentTraceContext: wireParent },
        },
      }),
    ]);
    expect(mockClient.completeActivityTask.mock.calls[0][0].result).toBe("42");
    const spans = exporter.getFinishedSpans();
    const activity = spans.find((span) => span.name === "WorkflowActivity echo")!;
    expect(activity.instrumentationScope.name).toBe("Dapr.Workflow");
    expect(activity.parentSpanContext).toMatchObject({
      traceId: parent.traceId,
      spanId: parent.spanId,
      traceFlags: parent.traceFlags,
      isRemote: true,
    });
    expect(activity.parentSpanContext?.traceState?.serialize()).toBe("vendor=value");
    expect(activity.status.code).toBe(SpanStatusCode.UNSET);
    expect(spans.find((span) => span.name === "downstream")?.parentSpanContext?.spanId).toBe(
      activity.spanContext().spanId,
    );
    expect(spans).toHaveLength(2);
    expect(active()).toBeUndefined();
  });

  it.each(["sync", "async", "unregistered", "deserialize"])(
    "ends and marks %s failures without changing workflow failure responses",
    async (failure) => {
      const worker = new TaskHubWorker("localhost:50001");
      if (failure !== "unregistered") {
        worker.registry.addNamedActivity(
          "fail",
          failure === "async"
            ? async () => {
                await tick();
                throw new Error("activity failure");
              }
            : () => {
                throw new Error("activity failure");
              },
        );
      }
      await runWorkItems(worker, [
        create(WorkItemSchema, {
          request: {
            case: "activityRequest",
            value: {
              name: "fail",
              workflowInstance: { instanceId: "instance" },
              parentTraceContext: wireParent,
              input: failure === "deserialize" ? "not-json" : undefined,
            },
          },
        }),
      ]);
      expect(mockClient.completeActivityTask.mock.calls[0][0].failureDetails).toBeDefined();
      const spans = exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
      expect(spans[0].events[0].name).toBe("exception");
      expect(active()).toBeUndefined();
    },
  );

  it("isolates concurrent activities and restores an unrelated outer context", async () => {
    const outer = trace.setSpanContext(ROOT_CONTEXT, { ...parent, traceId: "a".repeat(32) });
    await context.with(outer, async () => {
      await Promise.all(
        ["b", "c"].map(async (id) => {
          const traceId = id.repeat(32);
          await runWithActivityTrace(
            "parallel",
            create(TraceContextSchema, {
              traceParent: `00-${traceId}-${parent.spanId}-01`,
            }),
            async () => {
              expect(active()?.traceId).toBe(traceId);
              await tick();
              expect(active()?.traceId).toBe(traceId);
            },
          );
          expect(active()?.traceId).toBe("a".repeat(32));
        }),
      );
    });
    expect(new Set(exporter.getFinishedSpans().map((span) => span.spanContext().traceId))).toEqual(
      new Set(["b".repeat(32), "c".repeat(32)]),
    );
    expect(active()).toBeUndefined();
  });

  it.each([
    undefined,
    "",
    "invalid",
    `00-${"0".repeat(32)}-${parent.spanId}-01`,
    `00-${parent.traceId}-${"0".repeat(16)}-01`,
  ])("does not attach missing or invalid context %s to the worker's ambient span", async (traceParent) => {
    await context.with(trace.setSpanContext(ROOT_CONTEXT, parent), async () => {
      await runWithActivityTrace(
        "untraced",
        traceParent === undefined ? undefined : create(TraceContextSchema, { traceParent }),
        async () => {
          await tick();
          expect(active()).toBeUndefined();
        },
      );
      expect(active()).toMatchObject({
        traceId: parent.traceId,
        spanId: parent.spanId,
        traceFlags: parent.traceFlags,
        isRemote: true,
      });
      expect(active()?.traceState?.serialize()).toBe("vendor=value");
    });
    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it("honors unsampled remote context while still propagating it", async () => {
    await runWithActivityTrace(
      "unsampled",
      create(TraceContextSchema, {
        traceParent: `00-${parent.traceId}-${parent.spanId}-00`,
        traceState: "vendor=value",
      }),
      async () => {
        await tick();
        expect(active()).toMatchObject({ traceId: parent.traceId, traceFlags: TraceFlags.NONE });
        expect(active()?.traceState?.serialize()).toBe("vendor=value");
      },
    );
    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it("propagates remote context without a tracer provider and does not install one", async () => {
    trace.disable();
    try {
      await runWithActivityTrace("no-provider", wireParent, async () => {
        await tick();
        expect(active()).toMatchObject({
          traceId: parent.traceId,
          spanId: parent.spanId,
          traceFlags: parent.traceFlags,
          isRemote: true,
        });
        expect(active()?.traceState?.serialize()).toBe("vendor=value");
      });
      expect(exporter.getFinishedSpans()).toEqual([]);
    } finally {
      trace.setGlobalTracerProvider(provider);
    }
  });

  it.each([false, true])(
    "restores workflow history context on live and replay turns without duplicate spans (async: %s)",
    async (asyncGenerator) => {
      const worker = new TaskHubWorker("localhost:50001");
      const observed: { replay: boolean; traceId?: string }[] = [];
      const capture = (replay: boolean) => observed.push({ replay, traceId: active()?.traceId });
      worker.registry.addNamedOrchestrator(
        "workflow",
        asyncGenerator
          ? async function* (ctx) {
              await tick();
              capture(ctx.isReplaying);
              yield ctx.callActivity("echo");
              await tick();
              capture(ctx.isReplaying);
              return "done";
            }
          : function* (ctx) {
              capture(ctx.isReplaying);
              yield ctx.callActivity("echo");
              capture(ctx.isReplaying);
              return "done";
            },
      );
      const start = newExecutionStartedEvent("workflow", "instance");
      if (start.eventType.case !== "executionStarted") throw new Error("Expected start event");
      start.eventType.value.parentTraceContext = wireParent;
      await runWorkItems(worker, [
        create(WorkItemSchema, {
          request: { case: "workflowRequest", value: { instanceId: "instance", newEvents: [start] } },
        }),
        create(WorkItemSchema, {
          request: {
            case: "workflowRequest",
            value: {
              instanceId: "instance",
              pastEvents: [start, newTaskScheduledEvent(1, "echo")],
              newEvents: [newTaskCompletedEvent(1, '"result"')],
            },
          },
        }),
      ]);
      expect(observed).toEqual(
        expect.arrayContaining([
          { replay: false, traceId: parent.traceId },
          { replay: true, traceId: parent.traceId },
        ]),
      );
      expect(observed).toHaveLength(3);
      expect(exporter.getFinishedSpans()).toEqual([]);
      expect(
        mockClient.completeOrchestratorTask.mock.calls.some(([response]) =>
          response.actions.some(
            (action: { workflowActionType: { value: { result?: string } } }) =>
              action.workflowActionType.value.result === '"done"',
          ),
        ),
      ).toBe(true);
      expect(active()).toBeUndefined();
    },
  );

  it("uses the latest execution-start context and clears missing workflow context", () => {
    const start = newExecutionStartedEvent("workflow", "instance");
    if (start.eventType.case !== "executionStarted") throw new Error("Expected start event");
    start.eventType.value.parentTraceContext = wireParent;
    const next = newExecutionStartedEvent("workflow", "instance");
    if (next.eventType.case !== "executionStarted") throw new Error("Expected start event");
    next.eventType.value.parentTraceContext = create(TraceContextSchema, {
      traceParent: `00-${"d".repeat(32)}-${parent.spanId}-01`,
    });
    expect(trace.getSpanContext(getOrchestrationTraceContext([start, next]))?.traceId).toBe("d".repeat(32));
    next.eventType.value.parentTraceContext = undefined;
    expect(getOrchestrationTraceContext([start, next])).toBe(ROOT_CONTEXT);
    expect(getOrchestrationTraceContext([])).toBe(ROOT_CONTEXT);
  });
});

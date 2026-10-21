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

import { WorkflowHarness } from "@dapr/testcontainer-node";
import { Code, ConnectError, type Interceptor } from "@connectrpc/connect";
import {
  DaprWorkflowClient,
  WorkflowRuntime,
  WorkflowContext,
  WorkflowActivityContext,
  WorkflowRuntimeStatus,
  type Task,
  type TWorkflow,
} from "../../../src";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { minimumDaprRuntime } from "../helpers/runtimeVersion";

describe("workflow reliability", () => {
  let harness: WorkflowHarness;
  let client: DaprWorkflowClient;
  let runtime: WorkflowRuntime;
  let running = false;

  const options = () => ({ daprHost: harness.getHost(), daprPort: harness.getGrpcPort().toString() });
  const start = async () => {
    await runtime.start();
    running = true;
  };
  const stop = async () => {
    await runtime.stop();
    running = false;
  };
  const waitForStatus = async (id: string, status: string) => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if ((await client.getWorkflowState(id, true))?.getCustomStatus() === status) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Workflow ${id} did not reach ${status}`);
  };

  beforeEach(async () => {
    running = false;
    let starting = true;
    let startupLogs = "";
    harness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE });
    harness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withLogConsumer((stream) => {
        const capture = (chunk: Buffer) => {
          if (starting) startupLogs = (startupLogs + chunk.toString()).slice(-65536);
        };
        stream.on("data", capture);
        stream.on("err", capture);
      });
    try {
      await harness.start();
    } catch (error) {
      console.error(`Workflow sidecar startup failed (${DAPR_TEST_RUNTIME_IMAGE}):\n${startupLogs}`);
      throw error;
    } finally {
      starting = false;
    }
    client = new DaprWorkflowClient(options());
    runtime = new WorkflowRuntime(options());
  }, 180000);

  afterEach(async () => {
    try {
      if (running) await stop();
      await client?.stop();
    } finally {
      await runWithCleanupErrorSuppression(() => harness.stop());
    }
  }, 60000);

  it.each([false, true])(
    "completes empty, nested and overlapping groups through replay (async: %s)",
    async (asyncGenerator) => {
      function* composed(ctx: WorkflowContext): Generator<Task<unknown>, unknown, unknown> {
        const empty = yield ctx.whenAll([]);
        const first = ctx.callActivity<number>("echo", 1);
        const second = ctx.callActivity<number>("echo", 2);
        const joined = ctx.whenAll([first, second]);
        const race = ctx.whenAny([first, second]);
        const timer = ctx.createTimer(15);
        const winner = yield ctx.whenAny([joined, timer]);
        if (winner !== joined) throw new Error("Completed activities lost the race to the timer");
        timer.cancel();
        yield ctx.whenAll([ctx.whenAny([joined]), ctx.whenAny([race])]);
        return { empty, values: joined.getResult(), winner: race.getResult().getResult() };
      }
      const workflow: TWorkflow = asyncGenerator
        ? async function* (ctx) {
            return yield* composed(ctx);
          }
        : composed;
      runtime
        .registerWorkflowByName("composed", workflow)
        .registerActivityWithName("echo", (_ctx, input: number) => input);
      await start();
      const ids = await Promise.all([client.scheduleNewWorkflow("composed"), client.scheduleNewWorkflow("composed")]);
      for (const id of ids) {
        const state = await client.waitForWorkflowCompletion(id, true, 30);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(state?.getOutput()).toEqual({ empty: [], values: [1, 2], winner: expect.any(Number) });
        expect([1, 2]).toContain(state?.getOutput<{ winner: number }>()?.winner);
      }
    },
    60000,
  );

  it("carries queued events past abandoned waiters into the next generation", async () => {
    runtime.registerWorkflowByName("continuing", function* (ctx, continued: boolean): Generator<
      Task<unknown>,
      unknown,
      unknown
    > {
      if (!continued) {
        ctx.setCustomStatus("waiting");
        const restart = ctx.waitForExternalEvent("restart");
        const next = ctx.waitForExternalEvent("next");
        yield ctx.whenAny([restart, next]);
        ctx.continueAsNew(true, true);
        return;
      }
      const first = yield ctx.waitForExternalEvent("next");
      const second = yield ctx.waitForExternalEvent("next");
      return [first, second];
    });
    await start();
    const id = await client.scheduleNewWorkflow("continuing", false);
    await waitForStatus(id, "waiting");
    await client.suspendWorkflow(id);
    await client.raiseEvent(id, "restart");
    await client.raiseEvent(id, "next", "first");
    await client.raiseEvent(id, "next", "second");
    await client.resumeWorkflow(id);
    const state = await client.waitForWorkflowCompletion(id, true, 30);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.getOutput()).toEqual(["first", "second"]);
  }, 60000);

  it.each([
    { method: "CompleteActivityTask", injected: 1 },
    { method: "CompleteOrchestratorTask", injected: 1 },
    { method: "CompleteActivityTask", injected: 3 },
    { method: "CompleteOrchestratorTask", injected: 3 },
  ])(
    "recovers an undelivered $method response ($injected transport failure(s))",
    async ({ method, injected }) => {
      let failures = 0;
      let streams = 0;
      let activityCalls = 0;
      const interceptor: Interceptor = (next) => async (request) => {
        if (request.method.name === "GetWorkItems") streams++;
        if (request.method.name === method && failures < injected) {
          failures++;
          throw new ConnectError("Injected completion transport failure", Code.Unavailable);
        }
        return next(request);
      };
      runtime = new WorkflowRuntime({ ...options(), grpcOptions: { interceptors: [interceptor] } });
      runtime.registerActivityWithName("echo", (_ctx, input: number) => {
        activityCalls++;
        return input;
      });
      runtime.registerWorkflowByName("recovering", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
        return yield ctx.callActivity("echo", 42);
      });
      await start();
      const id = await client.scheduleNewWorkflow("recovering");
      const state = await client.waitForWorkflowCompletion(id, true, 60);
      expect(failures).toBe(injected);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.getOutput()).toBe(42);
      if (injected === 1) {
        // A transient failure is retried in place: no reconnect, no re-execution.
        expect(streams).toBe(1);
        expect(activityCalls).toBe(1);
      } else {
        // Once retries are exhausted the stream is dropped so the runtime redelivers the work item.
        expect(streams).toBeGreaterThanOrEqual(2);
        expect(activityCalls).toBeGreaterThanOrEqual(method === "CompleteActivityTask" ? 2 : 1);
      }
    },
    90000,
  );

  it("restarts while an old connection interceptor is still pending", async () => {
    let release!: () => void;
    let entered!: () => void;
    const waiting = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let hellos = 0;
    let streams = 0;
    const interceptor: Interceptor = (next) => async (request) => {
      if (request.method.name === "Hello" && ++hellos === 1) {
        entered();
        await gate;
      }
      if (request.method.name === "GetWorkItems") streams++;
      return next(request);
    };
    runtime = new WorkflowRuntime({ ...options(), grpcOptions: { interceptors: [interceptor] } });
    runtime.registerWorkflowByName("restarted", () => {
      return { done: true };
    });
    const starting = runtime.start();
    const rejected = expect(starting).rejects.toThrow("stopped before becoming ready");
    await waiting;
    await runtime.stop();
    await rejected;
    await start();
    release();
    const id = await client.scheduleNewWorkflow("restarted");
    const state = await client.waitForWorkflowCompletion(id, true, 30);
    expect(state?.getOutput()).toEqual({ done: true });
    expect(runtime.isReady).toBe(true);
    expect(streams).toBe(1);
  }, 60000);

  minimumDaprRuntime(
    "1.17.0",
    "waits the requested timer duration after a delayed start and suspension, keeping replay stable",
    async () => {
      const observations: { clock: number; guid: string; replay: boolean }[] = [];
      const timers: { clock: number; completedAt: number }[] = [];
      runtime.registerWorkflowByName("clock", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
        observations.push({
          clock: ctx.getCurrentUtcDateTime().getTime(),
          guid: ctx.newGuid(),
          replay: ctx.isReplaying(),
        });
        const initialClock = ctx.getCurrentUtcDateTime().getTime();
        yield ctx.createTimer(2);
        if (!ctx.isReplaying()) timers.push({ clock: initialClock, completedAt: Date.now() });
        ctx.setCustomStatus("waiting");
        yield ctx.waitForExternalEvent("wake");
        const resumedClock = ctx.getCurrentUtcDateTime().getTime();
        yield ctx.createTimer(2);
        if (!ctx.isReplaying()) timers.push({ clock: resumedClock, completedAt: Date.now() });
        return "done";
      });
      const scheduled = client.scheduleNewWorkflow("clock", undefined, "delayed-order");
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const workerStartedAt = Date.now();
      await start();
      const id = await scheduled;
      await waitForStatus(id, "waiting");
      await client.suspendWorkflow(id);
      await client.raiseEvent(id, "wake");
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const resumeRequestedAt = Date.now();
      await client.resumeWorkflow(id);
      const state = await client.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(timers).toHaveLength(2);
      expect(timers[0].clock).toBeGreaterThanOrEqual(workerStartedAt);
      expect(timers[1].clock).toBeGreaterThanOrEqual(resumeRequestedAt);
      for (const timer of timers) {
        // Older sidecars truncate reminder deadlines to seconds. Measure from the
        // persisted turn clock, not generator entry, which also includes delivery latency.
        expect(timer.completedAt).toBeGreaterThanOrEqual(Math.floor((timer.clock + 2000) / 1000) * 1000);
      }
      expect(observations.some((value) => value.replay)).toBe(true);
      expect(new Set(observations.map((value) => value.clock)).size).toBe(1);
      expect(new Set(observations.map((value) => value.guid)).size).toBe(1);
    },
    60000,
  );

  minimumDaprRuntime(
    "1.17.0",
    "uses unique GUID sequences for custom instance IDs and continue-as-new generations",
    async () => {
      const replayed = new Map<string, Set<string>>();
      runtime.registerWorkflowByName("identities", function* (ctx, previous: string[] = []): Generator<
        Task<unknown>,
        unknown,
        unknown
      > {
        const guid = ctx.newGuid();
        const key = `${ctx.getWorkflowInstanceId()}:${previous.length}`;
        const observed = replayed.get(key) ?? new Set<string>();
        observed.add(guid);
        replayed.set(key, observed);
        yield ctx.createTimer(0.05);
        const guids = [...previous, guid];
        if (guids.length < 3) ctx.continueAsNew(guids);
        return guids;
      });
      await start();
      const ids = await Promise.all(
        ["order-A", "order-B"].map((id) => client.scheduleNewWorkflow("identities", [], id)),
      );
      const all: string[] = [];
      for (const id of ids) {
        const state = await client.waitForWorkflowCompletion(id, true, 30);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        const guids = state?.getOutput<string[]>();
        expect(guids).toHaveLength(3);
        all.push(...guids!);
      }
      expect(new Set(all).size).toBe(6);
      expect(replayed.size).toBe(6);
      for (const values of replayed.values()) expect(values.size).toBe(1);
    },
    60000,
  );

  it.each([false, true])(
    "propagates activity errors without stalling workflows (async workflow: %s)",
    async (asyncGenerator) => {
      type FailureInput = { activity: string; message: string };
      const attempts = new Map<string, number>();
      let streams = 0;
      const interceptor: Interceptor = (next) => (request) => {
        if (request.method.name === "GetWorkItems") streams++;
        return next(request);
      };
      runtime = new WorkflowRuntime({ ...options(), grpcOptions: { interceptors: [interceptor] } });
      const fail = (_ctx: WorkflowActivityContext, message: string): never => {
        attempts.set(message, (attempts.get(message) ?? 0) + 1);
        throw new Error(message);
      };
      runtime
        .registerActivityWithName("failSync", fail)
        .registerActivityWithName("failAsync", async (ctx, message: string) => {
          await Promise.resolve();
          return fail(ctx, message);
        })
        .registerActivityWithName("recover", (_ctx, input: unknown) => input);

      function* handled(ctx: WorkflowContext, input: FailureInput): Generator<Task<unknown>, unknown, unknown> {
        try {
          return yield ctx.callActivity(input.activity, input.message);
        } catch (error) {
          if (!(error instanceof Error)) throw error;
          return yield ctx.callActivity("recover", {
            instanceId: ctx.getWorkflowInstanceId(),
            message: error.message,
          });
        }
      }
      function* unhandled(ctx: WorkflowContext, input: FailureInput): Generator<Task<unknown>, unknown, unknown> {
        return yield ctx.callActivity(input.activity, input.message);
      }
      runtime.registerWorkflowByName(
        "handled",
        asyncGenerator
          ? async function* (ctx, input: FailureInput) {
              return yield* handled(ctx, input);
            }
          : handled,
      );
      runtime.registerWorkflowByName(
        "unhandled",
        asyncGenerator
          ? async function* (ctx, input: FailureInput) {
              return yield* unhandled(ctx, input);
            }
          : unhandled,
      );
      await start();

      for (const activity of ["failSync", "failAsync"]) {
        const handledMessage = `${activity} handled failure`;
        const unhandledMessage = `${activity} unhandled failure`;
        const [handledId, unhandledId] = await Promise.all([
          client.scheduleNewWorkflow("handled", { activity, message: handledMessage }),
          client.scheduleNewWorkflow("unhandled", { activity, message: unhandledMessage }),
        ]);
        const [handledState, unhandledState] = await Promise.all([
          client.waitForWorkflowCompletion(handledId, true, 30),
          client.waitForWorkflowCompletion(unhandledId, true, 30),
        ]);

        expect(handledState?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(handledState?.workflowFailureDetails).toBeUndefined();
        expect(handledState?.getOutput()).toEqual({
          instanceId: handledId,
          message: expect.stringContaining(handledMessage),
        });
        expect(unhandledState?.runtimeStatus).toBe(WorkflowRuntimeStatus.FAILED);
        expect(unhandledState?.getOutput()).toBeUndefined();
        expect(unhandledState?.workflowFailureDetails?.getErrorType()).toBe("TaskFailedError");
        expect(unhandledState?.workflowFailureDetails?.getErrorMessage()).toContain(unhandledMessage);
        const cause = unhandledState?.workflowFailureDetails?.getInnerFailure();
        expect(cause?.getErrorType()).toBe("Error");
        expect(cause?.getErrorMessage()).toBe(unhandledMessage);
        expect(cause?.getStackTrace()).toContain(unhandledMessage);
        expect(attempts.get(handledMessage)).toBe(1);
        expect(attempts.get(unhandledMessage)).toBe(1);
      }
      expect(streams).toBe(1);
      expect(runtime.isReady).toBe(true);
    },
    60000,
  );

  it("reports nullish activity failures through the retry policy instead of reconnecting", async () => {
    const attempts = new Map<string, number>();
    let streams = 0;
    const interceptor: Interceptor = (next) => (request) => {
      if (request.method.name === "GetWorkItems") streams++;
      return next(request);
    };
    runtime = new WorkflowRuntime({ ...options(), grpcOptions: { interceptors: [interceptor] } });
    runtime.registerActivityWithName("reject", async (_ctx, input: string) => {
      attempts.set(input, (attempts.get(input) ?? 0) + 1);
      throw input === "null" ? null : undefined;
    });
    runtime.registerWorkflowByName("retry", function* (ctx, input: string): Generator<Task<unknown>, unknown, unknown> {
      return yield ctx.callActivity("reject", input, {
        retryPolicy: { firstRetryInterval: 0.1, maxNumberOfAttempts: 2 },
      });
    });
    await start();
    for (const input of ["null", "undefined"]) {
      const id = await client.scheduleNewWorkflow("retry", input);
      const state = await client.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.FAILED);
      expect(attempts.get(input)).toBe(2);
    }
    expect(streams).toBe(1);
  }, 60000);

  it("keeps GUID and clock values stable across worker restarts on every supported runtime", async () => {
    const observations: { guid: string; clock: number }[] = [];
    const workflow: TWorkflow = function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      const value = { guid: ctx.newGuid(), clock: ctx.getCurrentUtcDateTime().getTime() };
      observations.push(value);
      ctx.setCustomStatus("waiting");
      yield ctx.waitForExternalEvent("finish");
      return value;
    };
    runtime.registerWorkflowByName("stable", workflow);
    await start();
    const id = await client.scheduleNewWorkflow("stable", undefined, "order-A");
    await waitForStatus(id, "waiting");
    await stop();
    runtime = new WorkflowRuntime(options()).registerWorkflowByName("stable", workflow);
    await start();
    await client.raiseEvent(id, "finish");
    const state = await client.waitForWorkflowCompletion(id, true, 30);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(observations.length).toBeGreaterThanOrEqual(2);
    for (const value of observations) expect(value).toEqual(observations[0]);
    expect(state?.getOutput()).toEqual(observations[0]);
  }, 60000);

  it("returns strings and arrays from ordinary synchronous and asynchronous workflows", async () => {
    runtime.registerWorkflowByName("ordinary", (_ctx, input: unknown) => input);
    runtime.registerWorkflowByName("ordinaryAsync", async (_ctx, input: unknown) => input);
    await start();
    for (const name of ["ordinary", "ordinaryAsync"]) {
      for (const input of ["hello", [1, 2]]) {
        const id = await client.scheduleNewWorkflow(name, input);
        const state = await client.waitForWorkflowCompletion(id, true, 30);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(state?.getOutput()).toEqual(input);
      }
    }
  }, 60000);

  it("delivers reserved event names to registered workflows and activities with prototype names", async () => {
    runtime.registerActivityWithName("constructor", (_ctx, input: unknown) => input);
    runtime.registerWorkflowByName("__proto__", function* (ctx): Generator<Task<unknown>, unknown, unknown> {
      ctx.setCustomStatus("waiting");
      const first = yield ctx.waitForExternalEvent("constructor");
      const second = yield ctx.waitForExternalEvent("__proto__");
      return yield ctx.callActivity("constructor", [first, second]);
    });
    await start();
    const id = await client.scheduleNewWorkflow("__proto__");
    await waitForStatus(id, "waiting");
    await client.raiseEvent(id, "__proto__", "buffered");
    await client.raiseEvent(id, "constructor", "awaited");
    const state = await client.waitForWorkflowCompletion(id, true, 30);
    expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.getOutput()).toEqual(["awaited", "buffered"]);
  }, 60000);

  it("fails invalid first yields instead of leaving workflows stalled", async () => {
    runtime.registerWorkflowByName("invalid", function* () {
      yield undefined;
    });
    runtime.registerWorkflowByName("invalidAsync", async function* () {
      yield 42;
    });
    await start();
    for (const name of ["invalid", "invalidAsync"]) {
      const id = await client.scheduleNewWorkflow(name);
      const state = await client.waitForWorkflowCompletion(id, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.FAILED);
      expect(state?.workflowFailureDetails?.getErrorMessage()).toContain("yielded a non-Task object");
    }
  }, 60000);
});

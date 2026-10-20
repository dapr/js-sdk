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

import { TaskHubWorker } from "../../../src/workflow/engine";
import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import {
  type GetWorkItemsRequest,
  WorkItemSchema,
  WorkerCapability,
  type WorkItem,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";
import { CustomSerializer } from "../../fixtures/CustomSerializer";
import { newExecutionStartedEvent, newWorkflowStartedEvent } from "../../../src/workflow/engine/worker/protoHelpers";

/** A work-item stream the test feeds item by item; it ends when aborted or ended. */
class FakeWorkItemStream {
  private readonly items: WorkItem[] = [];
  private ended = false;
  private wake?: () => void;

  push(...items: WorkItem[]): void {
    this.items.push(...items);
    this.wake?.();
  }

  end(): void {
    this.ended = true;
    this.wake?.();
  }

  async *iterate(signal?: AbortSignal): AsyncGenerator<WorkItem> {
    signal?.addEventListener("abort", () => this.end());
    while (true) {
      const next = this.items.shift();
      if (next) {
        yield next;
        continue;
      }
      if (this.ended) {
        return;
      }
      await new Promise<void>((resolve) => (this.wake = resolve));
      this.wake = undefined;
    }
  }
}

const activityItem = (taskId: number) =>
  ({
    request: { case: "activityRequest", value: { name: "activity", taskId, workflowInstance: { instanceId: "wf" } } },
    completionToken: "",
  } as unknown as WorkItem);

const workflowItem = (instanceId: string) =>
  ({
    request: { case: "workflowRequest", value: { instanceId, pastEvents: [], newEvents: [] } },
    completionToken: "",
  } as unknown as WorkItem);

const healthPingItem = () =>
  ({ request: { case: "healthPing", value: {} }, completionToken: "" } as unknown as WorkItem);

/** Lets the worker's stream loop and promise callbacks run. */
const settle = async (rounds = 5) => {
  for (let i = 0; i < rounds; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

/**
 * A started worker on a fake stream whose executions stay pending until released, recording the
 * order in which work items were executed.
 */
async function startWorker() {
  const worker = new TaskHubWorker("localhost:50001");
  const stream = new FakeWorkItemStream();
  const getWorkItems = jest.fn((_req: GetWorkItemsRequest, opts?: { signal?: AbortSignal }) =>
    stream.iterate(opts?.signal),
  );
  (worker as unknown as { client: unknown }).client = {
    hello: jest.fn().mockResolvedValue({}),
    getWorkItems,
    completeOrchestratorTask: jest.fn().mockResolvedValue({}),
    completeActivityTask: jest.fn().mockResolvedValue({}),
  };

  const executed: string[] = [];
  const pending: (() => void)[] = [];
  const block = (label: string) => {
    executed.push(label);
    return new Promise<void>((resolve) => pending.push(resolve));
  };
  jest
    .spyOn(worker as never, "executeActivity")
    .mockImplementation(((req: { taskId: number }) => block(`activity:${req.taskId}`)) as never);
  jest
    .spyOn(worker as never, "executeOrchestrator")
    .mockImplementation(((req: { instanceId: string }) => block(`workflow:${req.instanceId}`)) as never);

  await worker.start();
  await settle();

  const stop = async () => {
    const stopped = worker.stop();
    pending.splice(0).forEach((release) => release());
    await stopped;
  };
  return { stream, executed, stop, getWorkItems };
}

describe("TaskHubWorker work-item dispatch", () => {
  it("retries transient capability discovery failures without failing the workflow", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    const worker = new TaskHubWorker("localhost:50001");
    const streams = [new FakeWorkItemStream(), new FakeWorkItemStream()];
    const getWorkItems = jest.fn(
      (_request: unknown, options: { signal: AbortSignal }): AsyncGenerator<WorkItem> =>
        streams[getWorkItems.mock.calls.length - 1].iterate(options.signal),
    );
    const completeOrchestratorTask = jest.fn().mockResolvedValue({});
    const getMetadata = jest
      .fn()
      .mockRejectedValueOnce(new ConnectError("temporarily unavailable", Code.Unavailable))
      .mockResolvedValue({ runtimeVersion: "1.18.4" });
    Object.defineProperty(worker, "client", {
      value: {
        hello: jest.fn().mockResolvedValue({}),
        getWorkItems,
        completeOrchestratorTask,
      },
    });
    Object.defineProperty(worker, "metadataClient", { value: { getMetadata } });
    worker.registry.addNamedOrchestrator("workflow", () => "done");
    const item = create(WorkItemSchema, {
      request: {
        case: "workflowRequest",
        value: {
          instanceId: "wf",
          newEvents: [newWorkflowStartedEvent(), newExecutionStartedEvent("workflow", "wf")],
        },
      },
    });
    try {
      await worker.start();
      streams[0].push(item);
      await settle();
      expect(completeOrchestratorTask).not.toHaveBeenCalled();
      expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(true);
      await jest.advanceTimersByTimeAsync(1500);
      streams[1].push(item);
      await settle();
      expect(getMetadata).toHaveBeenCalledTimes(2);
      expect(completeOrchestratorTask).toHaveBeenCalledTimes(1);
      expect(completeOrchestratorTask.mock.calls[0][0]).toMatchObject({
        version: { patches: ["dapr-js:workflow-semantics-v2"] },
      });
      expect(worker.isReady).toBe(true);
    } finally {
      await worker.stop();
      jest.useRealTimers();
    }
  });

  it.each(
    [
      { value: null, message: "null" },
      { value: undefined, message: "undefined" },
      { value: "failure", message: "failure" },
      { value: 42, message: "42" },
      { value: { message: "object failure", stack: "object stack" }, message: "object failure" },
      { value: Object.create(null), message: "A non-Error value was thrown" },
      {
        value: new Proxy(
          {},
          {
            getOwnPropertyDescriptor() {
              throw new Error("unsafe inspection");
            },
          },
        ),
        message: "A non-Error value was thrown and its error details could not be inspected",
      },
      {
        value: {
          toString() {
            throw new Error("unsafe conversion");
          },
        },
        message: "A non-Error value was thrown",
      },
      { value: new TypeError("typed failure"), message: "typed failure" },
    ].flatMap((testCase) => [false, true].map((asynchronous) => ({ ...testCase, asynchronous }))),
  )(
    "completes activity failures without aborting the stream: $message (async: $asynchronous)",
    async ({ value, message, asynchronous }) => {
      const worker = new TaskHubWorker("localhost:50001");
      const stream = new FakeWorkItemStream();
      const completeActivityTask = jest.fn().mockResolvedValue({});
      const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) =>
        stream.iterate(options.signal),
      );
      Object.defineProperty(worker, "client", {
        value: {
          hello: jest.fn().mockResolvedValue({}),
          getWorkItems,
          completeActivityTask,
        },
      });
      worker.registry.addNamedActivity(
        "activity",
        asynchronous
          ? async () => {
              throw value;
            }
          : () => {
              throw value;
            },
      );
      await worker.start();
      try {
        stream.push(activityItem(1));
        await settle();
        expect(completeActivityTask).toHaveBeenCalledTimes(1);
        expect(completeActivityTask.mock.calls[0][0]).toMatchObject({
          taskId: 1,
          failureDetails: { errorType: value instanceof Error ? "TypeError" : "Error", errorMessage: message },
        });
        if (value instanceof Error) {
          expect(completeActivityTask.mock.calls[0][0].failureDetails.stackTrace).toBe(value.stack);
        }
        if (message === "object failure") {
          expect(completeActivityTask.mock.calls[0][0].failureDetails.stackTrace).toBe("object stack");
        }
        expect(getWorkItems).toHaveBeenCalledTimes(1);
        expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(false);
        expect(worker.isReady).toBe(true);
      } finally {
        await worker.stop();
      }
    },
  );

  it.each(["activity", "workflow"])("reconnects after a failed %s completion and accepts redelivery", async (kind) => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    const worker = new TaskHubWorker("localhost:50001");
    const streams = [new FakeWorkItemStream(), new FakeWorkItemStream()];
    const getWorkItems = jest.fn(
      (_request: unknown, options: { signal: AbortSignal }): AsyncGenerator<WorkItem> =>
        streams[getWorkItems.mock.calls.length - 1].iterate(options.signal),
    );
    const complete = jest
      .fn()
      .mockRejectedValueOnce(new Error("response unavailable"))
      .mockRejectedValueOnce(new Error("response unavailable"))
      .mockRejectedValueOnce(new Error("response unavailable"))
      .mockResolvedValue({});
    const execute = jest.fn(() => ({ result: true }));
    worker.registry.addNamedActivity("activity", execute);
    worker.registry.addNamedOrchestrator("workflow", execute);
    (worker as unknown as { client: unknown }).client = {
      hello: jest.fn().mockResolvedValue({}),
      getWorkItems,
      completeActivityTask: complete,
      completeOrchestratorTask: complete,
    };
    const item =
      kind === "activity"
        ? activityItem(1)
        : create(WorkItemSchema, {
            request: {
              case: "workflowRequest",
              value: {
                instanceId: "wf",
                newEvents: [newExecutionStartedEvent("workflow", "wf")],
              },
            },
          });
    try {
      await worker.start();
      streams[0].push(item);
      await settle();
      expect(complete).toHaveBeenCalledTimes(1);
      // The stream survives while the completion is still being retried.
      expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(false);
      await jest.advanceTimersByTimeAsync(500);
      expect(complete).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1000);
      await settle();
      expect(complete).toHaveBeenCalledTimes(3);
      expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(true);
      expect(worker.isReady).toBe(false);
      await jest.advanceTimersByTimeAsync(1500);
      expect(getWorkItems).toHaveBeenCalledTimes(2);
      streams[1].push({ ...item, completionToken: "redelivery-token" });
      await settle();
      expect(complete).toHaveBeenCalledTimes(4);
      expect(complete.mock.calls[3][0]).toMatchObject({ completionToken: "redelivery-token" });
      if (kind === "activity") {
        expect(complete.mock.calls[3][0]).toMatchObject({ result: '{"result":true}' });
      } else {
        expect(complete.mock.calls[3][0].actions[0].workflowActionType.value).toMatchObject({
          result: '{"result":true}',
        });
      }
      expect(execute).toHaveBeenCalledTimes(2);
      expect(worker.isReady).toBe(true);
      await worker.stop();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not abort a newer stream when an old activity completion fails late", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    const worker = new TaskHubWorker("localhost:50001");
    const streams = [new FakeWorkItemStream(), new FakeWorkItemStream()];
    const getWorkItems = jest.fn(
      (_request: unknown, options: { signal: AbortSignal }): AsyncGenerator<WorkItem> =>
        streams[getWorkItems.mock.calls.length - 1].iterate(options.signal),
    );
    let rejectCompletion!: (error: Error) => void;
    const completeActivityTask = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectCompletion = reject;
          }),
      )
      .mockRejectedValue(new Error("late response failure"));
    (worker as unknown as { client: unknown }).client = {
      hello: jest.fn().mockResolvedValue({}),
      getWorkItems,
      completeActivityTask,
    };
    worker.registry.addNamedActivity("activity", () => "result");
    try {
      await worker.start();
      streams[0].push(activityItem(1));
      await settle();
      streams[0].end();
      await settle();
      await jest.advanceTimersByTimeAsync(1500);
      expect(getWorkItems).toHaveBeenCalledTimes(2);
      rejectCompletion(new Error("late response failure"));
      await settle();
      // Exhaust the completion retries so the old work item gives up entirely.
      await jest.advanceTimersByTimeAsync(1500);
      await settle();
      expect(completeActivityTask).toHaveBeenCalledTimes(3);
      expect(getWorkItems.mock.calls[1][1].signal.aborted).toBe(false);
      expect(worker.isReady).toBe(true);
      await worker.stop();
    } finally {
      jest.useRealTimers();
    }
  });

  it("retries a transiently failing completion and keeps the stream when it succeeds", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    const worker = new TaskHubWorker("localhost:50001");
    const stream = new FakeWorkItemStream();
    const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) =>
      stream.iterate(options.signal),
    );
    const completeActivityTask = jest
      .fn()
      .mockRejectedValueOnce(new ConnectError("busy", Code.Unavailable))
      .mockResolvedValue({});
    (worker as unknown as { client: unknown }).client = {
      hello: jest.fn().mockResolvedValue({}),
      getWorkItems,
      completeActivityTask,
    };
    worker.registry.addNamedActivity("activity", () => "result");
    try {
      await worker.start();
      stream.push(activityItem(1));
      await settle();
      expect(completeActivityTask).toHaveBeenCalledTimes(1);
      expect(completeActivityTask.mock.calls[0][1]).toMatchObject({ timeoutMs: 30_000 });
      await jest.advanceTimersByTimeAsync(500);
      await settle();
      expect(completeActivityTask).toHaveBeenCalledTimes(2);
      expect(getWorkItems).toHaveBeenCalledTimes(1);
      expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(false);
      expect(worker.isReady).toBe(true);
      await worker.stop();
    } finally {
      jest.useRealTimers();
    }
  });

  it.each([Code.NotFound, Code.InvalidArgument, Code.FailedPrecondition])(
    "drops a completion the sidecar definitively rejects (%s) without aborting the stream",
    async (code) => {
      const worker = new TaskHubWorker("localhost:50001");
      const stream = new FakeWorkItemStream();
      const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) =>
        stream.iterate(options.signal),
      );
      const completeOrchestratorTask = jest.fn().mockRejectedValue(new ConnectError("rejected", code));
      const completeActivityTask = jest.fn().mockResolvedValue({});
      (worker as unknown as { client: unknown }).client = {
        hello: jest.fn().mockResolvedValue({}),
        getWorkItems,
        completeOrchestratorTask,
        completeActivityTask,
      };
      worker.registry.addNamedOrchestrator("workflow", () => "done");
      worker.registry.addNamedActivity("activity", () => "result");
      try {
        await worker.start();
        stream.push(
          create(WorkItemSchema, {
            request: {
              case: "workflowRequest",
              value: { instanceId: "wf", newEvents: [newExecutionStartedEvent("workflow", "wf")] },
            },
          }),
          activityItem(1),
        );
        await settle();
        expect(completeOrchestratorTask).toHaveBeenCalledTimes(1);
        // Other work on the same stream is unaffected.
        expect(completeActivityTask).toHaveBeenCalledTimes(1);
        expect(getWorkItems).toHaveBeenCalledTimes(1);
        expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(false);
        expect(worker.isReady).toBe(true);
      } finally {
        await worker.stop();
      }
    },
  );

  it("ignores work items without an instance id instead of tearing down the stream", async () => {
    const worker = new TaskHubWorker("localhost:50001");
    const stream = new FakeWorkItemStream();
    const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) =>
      stream.iterate(options.signal),
    );
    const completeOrchestratorTask = jest.fn().mockResolvedValue({});
    const completeActivityTask = jest.fn().mockResolvedValue({});
    (worker as unknown as { client: unknown }).client = {
      hello: jest.fn().mockResolvedValue({}),
      getWorkItems,
      completeOrchestratorTask,
      completeActivityTask,
    };
    try {
      await worker.start();
      stream.push(
        workflowItem(""),
        { request: { case: "activityRequest", value: { name: "activity", taskId: 1 } } } as unknown as WorkItem,
      );
      await settle();
      expect(completeOrchestratorTask).not.toHaveBeenCalled();
      expect(completeActivityTask).not.toHaveBeenCalled();
      expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(false);
      expect(worker.isReady).toBe(true);
    } finally {
      await worker.stop();
    }
  });

  it("backs off progressively when the stream fails before delivering anything", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    const worker = new TaskHubWorker("localhost:50001");
    let failures = 0;
    const getWorkItems = jest.fn(async function* (): AsyncGenerator<WorkItem> {
      failures++;
      if (failures <= 3) throw new ConnectError("stream reset", Code.Unavailable);
      yield healthPingItem();
      await new Promise(() => undefined);
    });
    (worker as unknown as { client: unknown }).client = {
      hello: jest.fn().mockResolvedValue({}),
      getWorkItems,
    };
    try {
      await worker.start();
      await settle();
      expect(getWorkItems).toHaveBeenCalledTimes(1);
      // retryCount 0 → ≤1.5s, 1 → ≤3s, 2 → ≤6s. A reset backoff would reconnect within 1.5s every time.
      await jest.advanceTimersByTimeAsync(1500);
      expect(getWorkItems).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1500);
      expect(getWorkItems).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1500);
      expect(getWorkItems).toHaveBeenCalledTimes(3);
      await jest.advanceTimersByTimeAsync(3000);
      expect(getWorkItems).toHaveBeenCalledTimes(3);
      await jest.advanceTimersByTimeAsync(3000);
      await settle();
      expect(getWorkItems).toHaveBeenCalledTimes(4);
      expect(worker.isReady).toBe(true);
    } finally {
      await worker.stop();
      jest.useRealTimers();
    }
  });

  it.each([Code.Unimplemented, Code.Unauthenticated, Code.PermissionDenied])(
    "stops instead of retrying forever when the stream is definitively rejected (%s)",
    async (code) => {
      jest.useFakeTimers({ doNotFake: ["setImmediate"] });
      const worker = new TaskHubWorker("localhost:50001");
      const streams = [new FakeWorkItemStream()];
      const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) => {
        if (getWorkItems.mock.calls.length === 1) return streams[0].iterate(options.signal);
        // eslint-disable-next-line require-yield
        return (async function* (): AsyncGenerator<WorkItem> {
          throw new ConnectError("rejected", code);
        })();
      });
      (worker as unknown as { client: unknown }).client = {
        hello: jest.fn().mockResolvedValue({}),
        getWorkItems,
      };
      try {
        await worker.start();
        streams[0].push(healthPingItem());
        await settle();
        streams[0].end();
        await settle();
        await jest.advanceTimersByTimeAsync(1500);
        await settle();
        expect(getWorkItems).toHaveBeenCalledTimes(2);
        expect(worker.isReady).toBe(false);
        await jest.advanceTimersByTimeAsync(60_000);
        await settle();
        expect(getWorkItems).toHaveBeenCalledTimes(2);
        // The worker is no longer running, so stopping is a no-op and starting again is allowed.
        await expect(worker.stop()).resolves.toBeUndefined();
      } finally {
        jest.useRealTimers();
      }
    },
  );

  it("treats stop() as idempotent", async () => {
    const worker = new TaskHubWorker("localhost:50001");
    (worker as unknown as { client: unknown }).client = {
      hello: jest.fn().mockResolvedValue({}),
      getWorkItems: jest.fn((_request: unknown, options: { signal: AbortSignal }) =>
        new FakeWorkItemStream().iterate(options.signal),
      ),
    };
    await expect(worker.stop()).resolves.toBeUndefined();
    await worker.start();
    expect(worker.isReady).toBe(true);
    await Promise.all([worker.stop(), worker.stop()]);
    await expect(worker.stop()).resolves.toBeUndefined();
    expect(worker.isReady).toBe(false);
    // A stopped worker can be restarted.
    await worker.start();
    expect(worker.isReady).toBe(true);
    await worker.stop();
  });

  it("drains in-flight work items without polling timers", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    const { stream, executed, stop } = await startWorker();
    try {
      stream.push(activityItem(1), activityItem(2));
      await settle();
      expect(executed).toEqual(["activity:1", "activity:2"]);
      // stop() releases the pending executions; the drain must resolve without any timer advancing.
      let stopped = false;
      const stopping = stop().then(() => (stopped = true));
      await settle();
      expect(stopped).toBe(true);
      await stopping;
    } finally {
      jest.useRealTimers();
    }
  });

  it.each([undefined, new CustomSerializer()])(
    "passes execution keys from work items to activities with serializer %p",
    async (serializer) => {
      const worker = new TaskHubWorker("localhost:50001", undefined, false, undefined, undefined, serializer);
      const stream = new FakeWorkItemStream();
      const completeActivityTask = jest.fn().mockResolvedValue({});
      (worker as unknown as { client: unknown }).client = {
        hello: jest.fn().mockResolvedValue({}),
        getWorkItems: jest.fn((_req: unknown, opts?: { signal?: AbortSignal }) => stream.iterate(opts?.signal)),
        completeActivityTask,
      };
      const received: (string | undefined)[] = [];
      worker.registry.addNamedActivity("activity", (inner) => {
        const ctx = new WorkflowActivityContext(inner);
        received.push(ctx.getTaskExecutionId());
        expect(ctx.getWorkflowActivityId()).toBe(0);
        expect(ctx.getWorkflowInstanceId()).toBe("wf");
        return "done";
      });
      await worker.start();
      try {
        for (const taskExecutionId of ["opaque-key", "opaque-key", "different-key", ""]) {
          stream.push(
            create(WorkItemSchema, {
              request: {
                case: "activityRequest",
                value: { name: "activity", taskId: 0, workflowInstance: { instanceId: "wf" }, taskExecutionId },
              },
            }),
          );
        }
        await settle();
        expect(received).toEqual(["opaque-key", "opaque-key", "different-key", undefined]);
        expect(completeActivityTask).toHaveBeenCalledTimes(4);
        for (const [response] of completeActivityTask.mock.calls) {
          expect(response).toMatchObject({
            instanceId: "wf",
            taskId: 0,
            result: serializer ? serializer.serialize("done") : '"done"',
          });
          expect(response.failureDetails).toBeUndefined();
        }
      } finally {
        await worker.stop();
      }
    },
  );

  it("executes every work item as it arrives, without dropping any", async () => {
    const run = await startWorker();

    run.stream.push(...Array.from({ length: 250 }, (_, i) => activityItem(i)));
    await settle();

    expect(run.executed).toEqual(Array.from({ length: 250 }, (_, i) => `activity:${i}`));
    await run.stop();
  });

  it("does not hold back workflow work items behind pending activities", async () => {
    const run = await startWorker();

    run.stream.push(...Array.from({ length: 20 }, (_, i) => activityItem(i)), workflowItem("a"), workflowItem("b"));
    await settle();

    expect(run.executed).toContain("workflow:a");
    expect(run.executed).toContain("workflow:b");
    await run.stop();
  });

  it("advertises the health ping capability and discards pings without dispatching them", async () => {
    const run = await startWorker();

    run.stream.push(...Array.from({ length: 150 }, healthPingItem), activityItem(0));
    await settle();

    expect(run.getWorkItems.mock.calls[0][0].capabilities).toContain(WorkerCapability.HEALTH_PING);
    expect(run.executed).toEqual(["activity:0"]);
    await run.stop();
  });
});

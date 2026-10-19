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
import {
  type GetWorkItemsRequest,
  WorkItemSchema,
  WorkerCapability,
  type WorkItem,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";
import { CustomSerializer } from "../../fixtures/CustomSerializer";
import { newExecutionStartedEvent } from "../../../src/workflow/engine/worker/protoHelpers";

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
  it.each(["activity", "workflow"])("reconnects after a failed %s completion and accepts redelivery", async (kind) => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    const worker = new TaskHubWorker("localhost:50001");
    const streams = [new FakeWorkItemStream(), new FakeWorkItemStream()];
    const getWorkItems = jest.fn(
      (_request: unknown, options: { signal: AbortSignal }): AsyncGenerator<WorkItem> =>
        streams[getWorkItems.mock.calls.length - 1].iterate(options.signal),
    );
    const complete = jest.fn().mockRejectedValueOnce(new Error("response unavailable")).mockResolvedValue({});
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
      expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(true);
      expect(worker.isReady).toBe(false);
      await jest.advanceTimersByTimeAsync(1500);
      expect(getWorkItems).toHaveBeenCalledTimes(2);
      streams[1].push({ ...item, completionToken: "redelivery-token" });
      await settle();
      expect(complete).toHaveBeenCalledTimes(2);
      expect(complete.mock.calls[1][0]).toMatchObject({ completionToken: "redelivery-token" });
      if (kind === "activity") {
        expect(complete.mock.calls[1][0]).toMatchObject({ result: '{"result":true}' });
      } else {
        expect(complete.mock.calls[1][0].actions[0].workflowActionType.value).toMatchObject({
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
    const completeActivityTask = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectCompletion = reject;
        }),
    );
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
      expect(getWorkItems.mock.calls[1][1].signal.aborted).toBe(false);
      expect(worker.isReady).toBe(true);
      await worker.stop();
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

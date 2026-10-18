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

import { TaskHubWorker } from "../../../src/workflow/engine/transport/TaskHubWorker";
import type { WorkItem } from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";

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
  (worker as unknown as { client: unknown }).client = {
    hello: jest.fn().mockResolvedValue({}),
    getWorkItems: jest.fn((_req: unknown, opts?: { signal?: AbortSignal }) => stream.iterate(opts?.signal)),
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
  return { stream, executed, stop };
}

describe("TaskHubWorker work-item dispatch", () => {
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
});

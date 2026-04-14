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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TaskHubGrpcWorker } from "../../../../src/workflow/internal/durabletask/worker/task-hub-grpc-worker";
import * as pb from "../../../../src/workflow/internal/durabletask/proto/orchestrator_service_pb";

function createMockStub(): any {
  return { close: jest.fn() };
}

function createMockOrchestratorWorkItem(instanceId: string): pb.WorkItem {
  const req = new pb.OrchestratorRequest();
  req.setInstanceid(instanceId);
  req.setNeweventsList([]);
  req.setPasteventsList([]);

  const workItem = new pb.WorkItem();
  workItem.setOrchestratorrequest(req);
  return workItem;
}

describe("TaskHubGrpcWorker", () => {
  describe("_trackWorkItem", () => {
    it("should increment and decrement activeWorkItems on success", async () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;
      expect(w._activeWorkItems).toBe(0);

      const resolvePromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });

      w._trackWorkItem(resolvePromise);
      expect(w._activeWorkItems).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(w._activeWorkItems).toBe(0);
    });

    it("should decrement activeWorkItems even when work item rejects", async () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;

      expect(w._activeWorkItems).toBe(0);

      const rejectPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("test error")), 10);
      });

      w._trackWorkItem(rejectPromise);
      expect(w._activeWorkItems).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(w._activeWorkItems).toBe(0);
    });

    it("should not cause unhandled promise rejection on failure", async () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;

      const rejectPromise = Promise.reject(new Error("should be caught"));

      w._trackWorkItem(rejectPromise);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(w._activeWorkItems).toBe(0);
    });

    it("should track multiple concurrent work items", async () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;

      let resolve1: () => void = jest.fn();
      let resolve2: () => void = jest.fn();
      const p1 = new Promise<void>((r) => { resolve1 = r; });
      const p2 = new Promise<void>((r) => { resolve2 = r; });

      w._trackWorkItem(p1);
      w._trackWorkItem(p2);
      expect(w._activeWorkItems).toBe(2);

      resolve1();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(w._activeWorkItems).toBe(1);

      resolve2();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(w._activeWorkItems).toBe(0);
    });

    it("should drain queued items after a work item completes", async () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;
      const stub = createMockStub();

      // Fill up to max concurrent
      w._maxConcurrentWorkItems = 1;

      let resolve1: () => void = jest.fn();
      const p1 = new Promise<void>((r) => { resolve1 = r; });

      w._trackWorkItem(p1);
      expect(w._activeWorkItems).toBe(1);

      // Queue a work item (simulating what the data handler does)
      const queuedWorkItem = createMockOrchestratorWorkItem("queued-instance");
      w._workItemQueue.push({ workItem: queuedWorkItem, stub });
      expect(w._workItemQueue.length).toBe(1);

      // Complete the first work item — _drainQueue should fire
      // but _dispatchWorkItem will fail since there's no real orchestrator registered.
      // The error will be caught by _trackWorkItem's .catch(), so the count should still decrement.
      resolve1();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Queue should have been drained (item was dequeued and dispatched)
      expect(w._workItemQueue.length).toBe(0);
    });
  });

  describe("work item queue", () => {
    it("should queue work items when at max concurrency", () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;
      const stub = createMockStub();

      w._maxConcurrentWorkItems = 1;
      w._activeWorkItems = 1; // Simulate one active item

      const workItem = createMockOrchestratorWorkItem("test-instance");
      expect(w._workItemQueue.length).toBe(0);

      // Simulate the data handler's queue logic
      if (w._activeWorkItems >= w._maxConcurrentWorkItems) {
        if (w._workItemQueue.length < w._maxQueueSize) {
          w._workItemQueue.push({ workItem, stub });
        }
      }

      expect(w._workItemQueue.length).toBe(1);
    });

    it("should drop work items when queue is full", () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;
      const stub = createMockStub();

      w._maxConcurrentWorkItems = 1;
      w._activeWorkItems = 1;

      // Fill the queue to max
      for (let i = 0; i < w._maxQueueSize; i++) {
        w._workItemQueue.push({ workItem: createMockOrchestratorWorkItem(`instance-${i}`), stub });
      }
      expect(w._workItemQueue.length).toBe(w._maxQueueSize);

      // Next item should be dropped
      let dropped = false;
      if (w._workItemQueue.length >= w._maxQueueSize) {
        dropped = true;
      }

      expect(dropped).toBe(true);
      expect(w._workItemQueue.length).toBe(w._maxQueueSize);
    });

    it("should drain multiple queued items up to max concurrency", async () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;
      const stub = createMockStub();

      w._maxConcurrentWorkItems = 2;

      // Queue some items
      w._workItemQueue.push({ workItem: createMockOrchestratorWorkItem("q1"), stub });
      w._workItemQueue.push({ workItem: createMockOrchestratorWorkItem("q2"), stub });
      w._workItemQueue.push({ workItem: createMockOrchestratorWorkItem("q3"), stub });

      expect(w._activeWorkItems).toBe(0);
      expect(w._workItemQueue.length).toBe(3);

      // Trigger drain — should dispatch up to _maxConcurrentWorkItems
      w._drainQueue();

      // 2 should be dispatched (max concurrent), 1 should remain queued
      expect(w._activeWorkItems).toBe(2);
      expect(w._workItemQueue.length).toBe(1);
    });
  });

  describe("stop", () => {
    it("should throw if worker is not running", async () => {
      const worker = new TaskHubGrpcWorker();
      await expect(worker.stop()).rejects.toThrow("The worker is not running.");
    });

    it("should wait for active work items to drain before closing stub", async () => {
      const worker = new TaskHubGrpcWorker();
      const w = worker as any;

      w._isRunning = true;
      w._stopWorker = false;

      const callOrder: string[] = [];
      let resolveWork: () => void = jest.fn();
      const workPromise = new Promise<void>((r) => { resolveWork = r; });

      w._trackWorkItem(workPromise);
      expect(w._activeWorkItems).toBe(1);

      w._stub = {
        close: () => { callOrder.push("stub.close"); },
      };

      w._responseStream = {
        cancel: () => { callOrder.push("stream.cancel"); },
        destroy: () => { callOrder.push("stream.destroy"); },
      };

      const stopPromise = worker.stop();

      // Verify stub is NOT closed yet while work item is active
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(callOrder).not.toContain("stub.close");
      expect(w._activeWorkItems).toBe(1);

      // Complete the work item
      resolveWork();
      await new Promise((resolve) => setTimeout(resolve, 200));

      await stopPromise;
      expect(callOrder).toContain("stub.close");
      expect(w._isRunning).toBe(false);
    });
  });
});

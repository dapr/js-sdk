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

import { Code, ConnectError, createClient } from "@connectrpc/connect";
import { TaskHubWorker } from "../../../src/workflow/engine/transport/TaskHubWorker";

jest.mock("@connectrpc/connect", () => ({
  ...jest.requireActual("@connectrpc/connect"),
  createClient: jest.fn(),
}));

describe("TaskHubWorker", () => {
  const settle = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };

  const idleStream = (signal: AbortSignal) => ({
    [Symbol.asyncIterator]: () => ({
      next: () =>
        new Promise<IteratorResult<never>>((resolve) => {
          const end = () => resolve({ done: true, value: undefined as never });
          if (signal.aborted) end();
          else signal.addEventListener("abort", end, { once: true });
        }),
    }),
  });

  it.each(["resolve", "reject"])(
    "isolates a stopped connection that later %ss from a restarted worker",
    async (outcome) => {
      let resolveHello!: () => void;
      let rejectHello!: (error: Error) => void;
      const hello = jest
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<void>((resolve, reject) => {
              resolveHello = resolve;
              rejectHello = reject;
            }),
        )
        .mockResolvedValue({});
      const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) => idleStream(options.signal));
      (createClient as jest.Mock).mockReturnValue({ hello, getWorkItems });
      const worker = new TaskHubWorker("localhost:50001");
      const firstStart = worker.start();
      const rejected = expect(firstStart).rejects.toThrow("stopped before becoming ready");
      const firstSignal = hello.mock.calls[0][1].signal as AbortSignal;
      await worker.stop();
      await rejected;
      expect(firstSignal.aborted).toBe(true);
      await worker.start();
      if (outcome === "resolve") resolveHello();
      else rejectHello(new Error("late connection error"));
      await settle();
      expect(getWorkItems).toHaveBeenCalledTimes(1);
      expect(worker.isReady).toBe(true);
      await worker.stop();
      expect(getWorkItems.mock.calls[0][1].signal.aborted).toBe(true);
    },
  );

  it("does not let delayed stream cleanup clear a restarted worker's readiness", async () => {
    let endOldStream!: (result: IteratorResult<never>) => void;
    const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) => {
      if (getWorkItems.mock.calls.length === 1) {
        return {
          [Symbol.asyncIterator]: () => ({
            next: () =>
              new Promise<IteratorResult<never>>((resolve) => {
                endOldStream = resolve;
              }),
          }),
        };
      }
      return idleStream(options.signal);
    });
    (createClient as jest.Mock).mockReturnValue({ hello: jest.fn().mockResolvedValue({}), getWorkItems });
    const worker = new TaskHubWorker("localhost:50001");
    await worker.start();
    await worker.stop();
    await worker.start();
    endOldStream({ done: true, value: undefined as never });
    await settle();
    expect(worker.isReady).toBe(true);
    expect(getWorkItems).toHaveBeenCalledTimes(2);
    await worker.stop();
  });

  it("cancels reconnect backoff on stop instead of reviving the old loop after restart", async () => {
    jest.useFakeTimers();
    const getWorkItems = jest.fn((_request: unknown, options: { signal: AbortSignal }) => {
      if (getWorkItems.mock.calls.length === 1) {
        return {
          [Symbol.asyncIterator]: () => ({ next: async () => ({ done: true as const, value: undefined as never }) }),
        };
      }
      return idleStream(options.signal);
    });
    const hello = jest.fn().mockResolvedValue({});
    (createClient as jest.Mock).mockReturnValue({ hello, getWorkItems });
    const worker = new TaskHubWorker("localhost:50001");
    try {
      await worker.start();
      await settle();
      expect(jest.getTimerCount()).toBe(1);
      await Promise.all([worker.stop(), worker.stop()]);
      expect(jest.getTimerCount()).toBe(0);
      await worker.start();
      await jest.advanceTimersByTimeAsync(30000);
      expect(hello).toHaveBeenCalledTimes(2);
      expect(getWorkItems).toHaveBeenCalledTimes(2);
      expect(worker.isReady).toBe(true);
      await worker.stop();
    } finally {
      jest.useRealTimers();
    }
  });

  it("waits for the sidecar connection before resolving start", async () => {
    let resolveHello!: () => void;
    const hello = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveHello = resolve;
        }),
    );
    const getWorkItems = jest.fn((_req: unknown, opts: { signal: AbortSignal }) => ({
      [Symbol.asyncIterator]: () => ({
        next: () =>
          new Promise<IteratorResult<never>>((resolve) =>
            opts.signal.addEventListener("abort", () => resolve({ done: true, value: undefined as never })),
          ),
      }),
    }));
    (createClient as jest.Mock).mockReturnValue({ hello, getWorkItems });

    const worker = new TaskHubWorker("localhost:50001");
    let startResolved = false;
    const starting = worker.start().then(() => {
      startResolved = true;
    });

    await Promise.resolve();
    expect(startResolved).toBe(false);
    expect(worker.isReady).toBe(false);

    resolveHello();
    await starting;

    expect(getWorkItems).toHaveBeenCalledTimes(1);
    expect(startResolved).toBe(true);
    expect(worker.isReady).toBe(true);

    await worker.stop();
    expect(worker.isReady).toBe(false);
  });

  it("rejects start when the initial sidecar connection fails", async () => {
    const error = new Error("sidecar unavailable");
    (createClient as jest.Mock).mockReturnValue({ hello: jest.fn().mockRejectedValue(error) });

    const worker = new TaskHubWorker("localhost:50001");

    await expect(worker.start()).rejects.toBe(error);
    expect(worker.isReady).toBe(false);
  });

  it("does not start the work stream if stopped before the initial connection completes", async () => {
    let resolveHello!: () => void;
    const hello = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveHello = resolve;
        }),
    );
    const getWorkItems = jest.fn();
    (createClient as jest.Mock).mockReturnValue({ hello, getWorkItems });

    const worker = new TaskHubWorker("localhost:50001");
    const starting = worker.start();
    await Promise.resolve();

    await worker.stop();
    await expect(starting).rejects.toThrow("The worker stopped before becoming ready.");
    resolveHello();
    await Promise.resolve();

    expect(getWorkItems).not.toHaveBeenCalled();
    expect(worker.isReady).toBe(false);
  });

  it("reconnects when an established work item stream fails", async () => {
    const stream = (next: () => Promise<IteratorResult<never>>) => ({ [Symbol.asyncIterator]: () => ({ next }) });
    const getWorkItems = jest.fn((_req: unknown, opts: { signal: AbortSignal }) => {
      if (getWorkItems.mock.calls.length === 1) {
        // The sidecar restarted under an open stream.
        return stream(() =>
          Promise.reject(new ConnectError("http/2 stream closed with error code CANCEL (0x8)", Code.Canceled)),
        );
      }
      return stream(
        () =>
          new Promise((resolve) =>
            opts.signal.addEventListener("abort", () => resolve({ done: true, value: undefined as never })),
          ),
      );
    });
    (createClient as jest.Mock).mockReturnValue({ hello: jest.fn().mockResolvedValue({}), getWorkItems });

    const worker = new TaskHubWorker("localhost:50001");
    await worker.start();

    const deadline = Date.now() + 5000;
    while (getWorkItems.mock.calls.length < 2 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    expect(getWorkItems).toHaveBeenCalledTimes(2);
    expect(worker.isReady).toBe(true);
    await worker.stop();
    expect(worker.isReady).toBe(false);
  }, 10000);
});

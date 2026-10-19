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

import { Code, ConnectError, createRouterTransport, type HandlerContext } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { TaskHubSidecarService } from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import { TaskHubClient } from "../../../src/workflow/engine";

jest.mock("@connectrpc/connect-node", () => ({ createGrpcTransport: jest.fn() }));

describe("workflow client transport cancellation", () => {
  let client: TaskHubClient;
  let handler: jest.Mock;

  beforeEach(() => {
    handler = jest.fn();
    const transport = createRouterTransport((router) => {
      router.service(TaskHubSidecarService, {
        startInstance: handler,
        getInstance: handler,
        waitForInstanceStart: handler,
        waitForInstanceCompletion: handler,
        raiseEvent: handler,
        terminateInstance: handler,
        suspendInstance: handler,
        resumeInstance: handler,
        purgeInstances: handler,
      });
    });
    jest.mocked(createGrpcTransport).mockReturnValue(transport);
    client = new TaskHubClient("localhost:50001");
  });

  const operations = [
    (client: TaskHubClient, signal: AbortSignal) =>
      client.scheduleNewOrchestration("workflow", undefined, undefined, undefined, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.getOrchestrationState("id", true, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.waitForOrchestrationStart("id", true, 60, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.waitForOrchestrationCompletion("id", true, 60, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.raiseOrchestrationEvent("id", "event", undefined, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.terminateOrchestration("id", undefined, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.suspendOrchestration("id", undefined, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.resumeOrchestration("id", undefined, signal),
    (client: TaskHubClient, signal: AbortSignal) => client.purgeOrchestration("id", signal),
  ];

  it.each(operations.map((operation, i) => ({ operation, i })))(
    "rejects pre-aborted operation $i without sending a request",
    async ({ operation }) => {
      const controller = new AbortController();
      controller.abort(new ConnectError("custom reason", Code.NotFound));
      await expect(operation(client, controller.signal)).rejects.toMatchObject({ code: Code.Canceled });
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it.each(operations.map((operation, i) => ({ operation, i })))(
    "aborts in-flight operation $i at the transport",
    async ({ operation }) => {
      const controller = new AbortController();
      let serverSignal: AbortSignal | undefined;
      let started!: () => void;
      const ready = new Promise<void>((resolve) => (started = resolve));
      handler.mockImplementation((_request: unknown, context: HandlerContext) => {
        serverSignal = context.signal;
        started();
        return new Promise((_, reject) => {
          context.signal.addEventListener("abort", () => reject(context.signal.reason), { once: true });
        });
      });
      const pending = operation(client, controller.signal);
      const rejected = expect(pending).rejects.toMatchObject({ code: Code.Canceled });
      await ready;
      controller.abort();
      await rejected;
      expect(serverSignal?.aborted).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["start", "completion"])("aborts the %s wait RPC when its deadline expires", async (kind) => {
    let serverSignal: AbortSignal | undefined;
    handler.mockImplementation((_request: unknown, context: HandlerContext) => {
      serverSignal = context.signal;
      return new Promise((_, reject) => {
        context.signal.addEventListener("abort", () => reject(context.signal.reason), { once: true });
      });
    });
    const pending =
      kind === "start"
        ? client.waitForOrchestrationStart("id", true, 0.02)
        : client.waitForOrchestrationCompletion("id", true, 0.02);
    await expect(pending).rejects.toMatchObject({ code: Code.DeadlineExceeded });
    expect(serverSignal?.aborted).toBe(true);
  });

  it.each([0, -1, NaN, Infinity, 2_147_484])("rejects invalid wait deadline %s before sending", async (timeout) => {
    await expect(client.waitForOrchestrationStart("id", true, timeout)).rejects.toThrow(RangeError);
    await expect(client.waitForOrchestrationCompletion("id", true, timeout)).rejects.toThrow(RangeError);
    expect(handler).not.toHaveBeenCalled();
  });

  it("cleans up a successful wait's deadline and leaves subsequent requests usable", async () => {
    jest.useFakeTimers();
    try {
      handler.mockResolvedValue({ exists: false });
      await expect(client.waitForOrchestrationStart("id", true, 30)).resolves.toBeUndefined();
      expect(jest.getTimerCount()).toBe(0);
      await expect(client.getOrchestrationState("id", true)).resolves.toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it("preserves RPC errors rather than masking them as cancellation", async () => {
    handler.mockRejectedValue(new ConnectError("unavailable", Code.Unavailable));
    await expect(client.waitForOrchestrationCompletion("id", true, 30)).rejects.toMatchObject({
      code: Code.Unavailable,
    });
  });
});

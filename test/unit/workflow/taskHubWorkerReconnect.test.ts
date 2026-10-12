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
    await worker.stop();
  }, 10000);
});

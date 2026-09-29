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
import { EmptySchema } from "@bufbuild/protobuf/wkt";
import { TaskHubWorker } from "../../../src/workflow/engine/transport/TaskHubWorker";
import {
  type GetWorkItemsRequest,
  HealthPingSchema,
  type WorkItem,
  WorkItemSchema,
  WorkerCapability,
} from "../../../src/proto/dapr/proto/durabletask/v1/orchestrator_service_pb";

interface WorkerInternals {
  client: unknown;
  _activeWorkItems: number;
  _workItemQueue: WorkItem[];
}

describe("TaskHubWorker health ping", () => {
  it("advertises the capability and never queues pings, even at max concurrency", async () => {
    const pingCount = 150;
    const requests: GetWorkItemsRequest[] = [];
    let pingsSent!: () => void;
    const allPingsSent = new Promise<void>((resolve) => (pingsSent = resolve));

    const worker = new TaskHubWorker("localhost:0");
    const internals = worker as unknown as WorkerInternals;
    internals.client = {
      hello: async () => create(EmptySchema),
      getWorkItems: (req: GetWorkItemsRequest, opts: { signal: AbortSignal }) => {
        requests.push(req);
        return (async function* () {
          for (let i = 0; i < pingCount; i++) {
            yield create(WorkItemSchema, { request: { case: "healthPing", value: create(HealthPingSchema) } });
          }
          pingsSent();
          await new Promise((resolve) => opts.signal.addEventListener("abort", resolve));
        })();
      },
    };
    internals._activeWorkItems = 10;

    await worker.start();
    await allPingsSent;

    expect(internals._workItemQueue).toHaveLength(0);
    expect(requests).toHaveLength(1);
    expect(requests[0].capabilities).toContain(WorkerCapability.HEALTH_PING);

    internals._activeWorkItems = 0;
    await worker.stop();
  });
});

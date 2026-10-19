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

import { GenericContainer, Network, Wait, type StartedNetwork, type StartedTestContainer } from "testcontainers";
import { DaprContainer, DaprPlacementContainer, DaprSchedulerContainer } from "@dapr/testcontainer-node";
import {
  DaprWorkflowClient,
  WorkflowRuntime,
  WorkflowContext,
  WorkflowActivityContext,
  WorkflowRuntimeStatus,
  HistoryPropagationScope,
  type PropagatedHistory,
  type TWorkflow,
} from "../../../src";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  startRedisContainer,
  buildStateRedisComponent,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { minimumDaprRuntime } from "../helpers/runtimeVersion";

interface Input {
  childScope: HistoryPropagationScope;
  activityScope: HistoryPropagationScope;
  retry: boolean;
  alias: boolean;
}

function summarize(history?: PropagatedHistory) {
  return (
    history?.chunks.map((chunk) => ({
      appId: chunk.appId,
      instanceId: chunk.instanceId,
      workflowName: chunk.workflowName,
      outputs: chunk.events.flatMap((event) =>
        event.eventType.case === "taskCompleted" ? [event.eventType.value.result] : [],
      ),
    })) ?? []
  );
}

describe("cross-application workflow execution", () => {
  let network: StartedNetwork | undefined;
  const services: StartedTestContainer[] = [];
  const sidecars: StartedTestContainer[] = [];
  const runtimes: WorkflowRuntime[] = [];
  const clients: DaprWorkflowClient[] = [];
  const childInstances = new Set<string>();
  let activityAttempts = 0;

  const parent: TWorkflow = async function* (ctx: WorkflowContext, input: Input): any {
    yield ctx.callActivity("parentSeed");
    const options = {
      targetAppId: "cross-app-child",
      propagationScope: input.childScope,
      retryPolicy: input.retry ? { firstRetryInterval: 1, maxNumberOfAttempts: 2 } : undefined,
    };
    return yield input.alias
      ? ctx.callSubWorkflow("remoteChild", input, `${ctx.getWorkflowInstanceId()}-child`, options)
      : ctx.callChildWorkflow("remoteChild", input, `${ctx.getWorkflowInstanceId()}-child`, options);
  };

  const remoteChild: TWorkflow = async function* (ctx: WorkflowContext, input: Input): any {
    childInstances.add(ctx.getWorkflowInstanceId());
    if (input.retry && ctx.getWorkflowInstanceId().endsWith("-child")) {
      throw new Error("transient remote child failure");
    }
    const childHistory = summarize(ctx.getPropagatedHistory());
    yield ctx.callActivity("childSeed");
    const activityHistory = yield ctx.callActivity("remoteActivity", input, {
      targetAppId: "cross-app-activity",
      propagationScope: input.activityScope,
      retryPolicy: input.retry ? { firstRetryInterval: 1, maxNumberOfAttempts: 2 } : undefined,
    });
    return { childHistory, activityHistory, childInstanceId: ctx.getWorkflowInstanceId() };
  };

  beforeAll(async () => {
    network = await new Network().start();
    services.push(await startRedisContainer(network));
    services.push(
      await new DaprPlacementContainer(DAPR_TEST_PLACEMENT_IMAGE)
        .withNetwork(network)
        .withNetworkAliases("placement")
        .start(),
    );
    services.push(
      await new DaprSchedulerContainer(DAPR_TEST_SCHEDULER_IMAGE)
        .withBroadcastHost("scheduler")
        .withNetwork(network)
        .withNetworkAliases("scheduler")
        .start(),
    );
    for (const appId of ["cross-app-parent", "cross-app-child", "cross-app-activity"]) {
      const sidecar = await new GenericContainer(DAPR_TEST_RUNTIME_IMAGE)
        .withNetwork(network)
        .withExposedPorts(3500, 50001)
        .withCopyContentToContainer([
          {
            content: buildStateRedisComponent(true).toYaml(),
            target: "/components/statestore.yaml",
          },
        ])
        .withCommand([
          "./daprd",
          "--app-id",
          appId,
          "--dapr-listen-addresses",
          "0.0.0.0",
          "--placement-host-address",
          "placement:50005",
          "--scheduler-host-address",
          "scheduler:51005",
          "--resources-path",
          "/components",
        ])
        .withWaitStrategy(
          Wait.forAll([DaprContainer.outboundHealthWaitStrategy(), Wait.forLogMessage(/Workflow engine started/i)]),
        )
        .withStartupTimeout(120_000)
        .start();
      sidecars.push(sidecar);
      const options = { daprHost: sidecar.getHost(), daprPort: sidecar.getMappedPort(50001).toString() };
      runtimes.push(new WorkflowRuntime(options));
      clients.push(new DaprWorkflowClient(options));
    }
    runtimes[0].registerWorkflow(parent).registerActivity(async function parentSeed() {
      return "parent-output";
    });
    runtimes[1].registerWorkflow(remoteChild).registerActivity(async function childSeed() {
      return "child-output";
    });
    runtimes[2].registerActivity(async function remoteActivity(ctx: WorkflowActivityContext, input: Input) {
      activityAttempts++;
      if (input.retry && activityAttempts === 1) throw new Error("transient remote activity failure");
      return summarize(ctx.getPropagatedHistory());
    });
    await Promise.all(runtimes.map((runtime) => runtime.start()));
  }, 240_000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await Promise.all(runtimes.map((runtime) => runtime.stop()));
      await Promise.all(clients.map((client) => client.stop()));
      await Promise.all(sidecars.map((sidecar) => sidecar.stop()));
      await Promise.all(services.map((service) => service.stop()));
      await network?.stop();
    });
  }, 120_000);

  const cases = [
    { scope: HistoryPropagationScope.NONE, apps: [], retry: false, alias: false },
    { scope: HistoryPropagationScope.OWN_HISTORY, apps: ["cross-app-child"], retry: false, alias: true },
    {
      scope: HistoryPropagationScope.LINEAGE,
      apps: ["cross-app-parent", "cross-app-child"],
      retry: true,
      alias: false,
    },
  ];
  for (const { scope, apps, retry, alias } of cases) {
    minimumDaprRuntime(
      "1.18",
      `routes remote tasks and applies propagation scope ${scope} (retry=${retry})`,
      async () => {
        childInstances.clear();
        activityAttempts = 0;
        const id = await clients[0].scheduleNewWorkflow(parent, {
          childScope: scope,
          activityScope: scope,
          retry,
          alias,
        });
        const state = await clients[0].waitForWorkflowCompletion(id, undefined, 60);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(state?.workflowFailureDetails).toBeUndefined();
        const result = JSON.parse(state!.serializedOutput!);
        expect(result.childHistory.map((entry: { appId: string }) => entry.appId)).toEqual(
          scope === HistoryPropagationScope.NONE ? [] : ["cross-app-parent"],
        );
        expect(result.activityHistory.map((entry: { appId: string }) => entry.appId)).toEqual(apps);
        if (scope !== HistoryPropagationScope.NONE) {
          expect(result.childHistory[0]).toMatchObject({ instanceId: id, workflowName: "parent" });
          expect(result.childHistory[0].outputs).toContain('"parent-output"');
          const childEntry = result.activityHistory[result.activityHistory.length - 1];
          expect(childEntry).toMatchObject({ instanceId: result.childInstanceId, workflowName: "remoteChild" });
          expect(childEntry.outputs).toContain('"child-output"');
        }
        expect(childInstances.size).toBe(retry ? 2 : 1);
        expect(activityAttempts).toBe(retry ? 2 : 1);
      },
      65_000,
    );
  }

  minimumDaprRuntime(
    "1.19.0",
    "schedules an independent detached workflow in another application without propagating history",
    async () => {
      const detached: TWorkflow = function* detached(ctx: WorkflowContext, input: unknown): any {
        const history = summarize(ctx.getPropagatedHistory());
        yield ctx.waitForExternalEvent("complete");
        return { input, history };
      };
      const caller: TWorkflow = function* caller(ctx: WorkflowContext, input: unknown): any {
        yield ctx.callActivity("parentSeed");
        return yield ctx.scheduleNewDetachedWorkflow("remoteDetached", input, undefined, undefined, {
          targetAppId: "cross-app-child",
        });
      };
      runtimes[0].registerWorkflowByName("detachedCaller", caller);
      runtimes[1].registerWorkflowByName("remoteDetached", detached);
      const input = { value: "remote-input" };
      const callerId = await clients[0].scheduleNewWorkflow("detachedCaller", input);
      const callerState = await clients[0].waitForWorkflowCompletion(callerId, true, 30);
      expect(callerState?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      const detachedId = callerState!.getOutput<string>()!;
      await clients[1].waitForWorkflowStart(detachedId, false, 30);
      const history = await clients[1].getWorkflowHistory(detachedId);
      const start = history.find((event) => event.eventType.case === "executionStarted");
      expect(start?.eventType.case).toBe("executionStarted");
      if (start?.eventType.case === "executionStarted") {
        expect(start.eventType.value.parentInstance).toBeUndefined();
      }
      await clients[1].raiseEvent(detachedId, "complete");
      const state = await clients[1].waitForWorkflowCompletion(detachedId, true, 30);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(state?.getOutput()).toEqual({ input, history: [] });
      const callerHistory = await clients[0].getWorkflowHistory(callerId);
      expect(callerHistory.filter((event) => event.eventType.case === "detachedWorkflowInstanceCreated")).toHaveLength(
        1,
      );
    },
    100000,
  );

  minimumDaprRuntime(
    "1.18",
    "does not forward inherited history across a NONE trust boundary",
    async () => {
      const id = await clients[0].scheduleNewWorkflow(parent, {
        childScope: HistoryPropagationScope.LINEAGE,
        activityScope: HistoryPropagationScope.NONE,
        retry: false,
        alias: false,
      });
      const state = await clients[0].waitForWorkflowCompletion(id, undefined, 60);
      expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      const result = JSON.parse(state!.serializedOutput!);
      expect(result.childHistory).toHaveLength(1);
      expect(result.activityHistory).toEqual([]);
    },
    65_000,
  );
});

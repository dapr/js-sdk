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
import { Code, ConnectError } from "@connectrpc/connect";
import {
  DaprWorkflowClient,
  WorkflowRuntime,
  WorkflowActivityContext,
  WorkflowContext,
  WorkflowRuntimeStatus,
  WorkflowScheduleState,
  type TWorkflow,
} from "../../../src";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";
import { minimumDaprRuntime } from "../helpers/runtimeVersion";

describe("workflow schedules", () => {
  let workflowHarness: WorkflowHarness;
  let workflowClient: DaprWorkflowClient;
  let workflowRuntime: WorkflowRuntime;
  const names: string[] = [];

  const greet = async (_: WorkflowActivityContext, name: string) => `Hello ${name}!`;
  const greeting: TWorkflow = async function* (ctx: WorkflowContext, name: string): any {
    return yield ctx.callActivity(greet, name);
  };

  const uniqueName = (suffix: string): string => {
    const name = `sched-${Date.now() % 1e6}-${suffix}`;
    names.push(name);
    return name;
  };

  const waitForSchedule = async (name: string, state: WorkflowScheduleState) => {
    const deadline = Date.now() + 30_000;
    for (;;) {
      const schedule = await workflowClient.getWorkflowSchedule(name);
      const status = schedule.status;
      if (
        status?.state === state &&
        (state !== WorkflowScheduleState.COMPLETED || status.lastRun?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED)
      ) {
        return schedule;
      }
      if (Date.now() > deadline) {
        throw new Error(`Schedule ${name} did not reach state ${state} before timeout`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  beforeAll(async () => {
    workflowHarness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE });
    workflowHarness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
    await workflowHarness.start();
  }, 180 * 1000);

  beforeEach(async () => {
    workflowClient = new DaprWorkflowClient({
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getGrpcPort().toString(),
    });
    workflowRuntime = new WorkflowRuntime({
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getGrpcPort().toString(),
    });
    workflowRuntime.registerWorkflow(greeting).registerActivity(greet);
    await workflowRuntime.start();
  });

  afterEach(async () => {
    for (const name of names.splice(0)) {
      await workflowClient.deleteWorkflowSchedule(name).catch((error) => {
        if (!(error instanceof ConnectError && error.code === Code.NotFound)) throw error;
      });
      const { instanceIds } = await workflowClient.listWorkflowInstanceIds(undefined, undefined, `${name}_`);
      for (const id of instanceIds) {
        await workflowClient.purgeWorkflow(id).catch(() => undefined);
      }
    }
    await workflowRuntime.stop();
    await workflowClient.stop();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await workflowHarness.stop();
    });
  });

  minimumDaprRuntime(
    "1.20.0",
    "runs a schedule until its repeats are used up",
    async () => {
      const name = uniqueName("a");
      await workflowClient.createWorkflowSchedule(name, greeting, "@every 1s", { input: "Dapr", repeats: 2 });

      expect(await workflowClient.getWorkflowSchedule(name)).toMatchObject({
        name,
        workflowName: "greeting",
        schedule: "@every 1s",
        repeats: 2,
        skipMissed: false,
        serializedInput: JSON.stringify("Dapr"),
        status: { state: WorkflowScheduleState.ACTIVE },
      });

      const { status } = await waitForSchedule(name, WorkflowScheduleState.COMPLETED);
      expect(status?.runCount).toBe(2);
      expect(status?.lastRunTime).toBeInstanceOf(Date);
      expect(status?.lastRun?.instanceId.startsWith(`${name}_`)).toBe(true);
      expect(status?.lastRun?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
      expect(status?.lastRun?.serializedOutput).toBe(JSON.stringify("Hello Dapr!"));

      const { instanceIds } = await workflowClient.listWorkflowInstanceIds(undefined, undefined, `${name}_`);
      expect(instanceIds).toHaveLength(2);
      for (const id of instanceIds) {
        const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
        expect(state?.runtimeStatus).toBe(WorkflowRuntimeStatus.COMPLETED);
        expect(state?.getOutput()).toBe("Hello Dapr!");
      }

      await expect(workflowClient.triggerWorkflowSchedule(name)).rejects.toMatchObject({
        code: Code.FailedPrecondition,
      });
    },
    60_000,
  );

  minimumDaprRuntime(
    "1.20.0",
    "triggers a run outside the schedule",
    async () => {
      const name = uniqueName("a");
      await workflowClient.createWorkflowSchedule(name, greeting, "@every 1h", { input: "Dapr" });

      const id = await workflowClient.triggerWorkflowSchedule(name);
      expect(id.startsWith(`${name}_`)).toBe(true);
      expect(id.endsWith("_manual")).toBe(true);
      const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
      expect(state?.getOutput()).toBe("Hello Dapr!");

      expect((await workflowClient.getWorkflowSchedule(name)).status).toMatchObject({
        state: WorkflowScheduleState.ACTIVE,
        runCount: 1,
        lastRun: { instanceId: id },
      });

      await workflowClient.createWorkflowSchedule(name, greeting, "@every 1h", { input: "Dapr", overwrite: true });
      expect((await workflowClient.getWorkflowSchedule(name)).status?.runCount).toBe(0);
    },
    60_000,
  );

  minimumDaprRuntime(
    "1.20.0",
    "lists schedules page by page",
    async () => {
      const expected = [uniqueName("a"), uniqueName("b")];
      for (const name of expected) {
        await workflowClient.createWorkflowSchedule(name, greeting, "@daily");
      }

      const found: string[] = [];
      let continuationToken: string | undefined;
      do {
        const page = await workflowClient.listWorkflowSchedules({ pageSize: 1, continuationToken });
        expect(page.schedules).toHaveLength(1);
        found.push(...page.schedules.map((schedule) => schedule.name));
        continuationToken = page.continuationToken;
      } while (continuationToken !== undefined);

      expect(found.filter((name) => expected.includes(name)).sort()).toEqual(expected);
    },
    60_000,
  );

  minimumDaprRuntime(
    "1.20.0",
    "overwrites, deletes and rejects invalid schedules",
    async () => {
      const name = uniqueName("a");
      await workflowClient.createWorkflowSchedule(name, greeting, "@daily");
      await expect(workflowClient.createWorkflowSchedule(name, greeting, "@daily")).rejects.toMatchObject({
        code: Code.AlreadyExists,
      });

      await workflowClient.createWorkflowSchedule(name, greeting, "@hourly", { overwrite: true });
      expect((await workflowClient.getWorkflowSchedule(name)).schedule).toBe("@hourly");

      await workflowClient.deleteWorkflowSchedule(name);
      await expect(workflowClient.getWorkflowSchedule(name)).rejects.toMatchObject({ code: Code.NotFound });
      await expect(workflowClient.deleteWorkflowSchedule(name)).rejects.toMatchObject({ code: Code.NotFound });

      await expect(workflowClient.createWorkflowSchedule(name, greeting, "not a cron")).rejects.toMatchObject({
        code: Code.InvalidArgument,
      });
      await expect(
        workflowClient.createWorkflowSchedule("dapr-internal-schedule-x", greeting, "@daily"),
      ).rejects.toMatchObject({ code: Code.InvalidArgument });
    },
    60_000,
  );
});

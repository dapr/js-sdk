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

import {
  DaprWorkflowClient,
  WorkflowActivityContext,
  WorkflowContext,
  WorkflowRuntime,
  WorkflowScheduleState,
  TWorkflow,
} from "@dapr/dapr";

async function start() {
  const daprHost = "localhost";
  const daprPort = "50001";
  const workflowClient = new DaprWorkflowClient({ daprHost, daprPort });
  const workflowRuntime = new WorkflowRuntime({ daprHost, daprPort });

  const greet = async (_: WorkflowActivityContext, name: string) => `Hello ${name}!`;

  const greeting: TWorkflow = async function* (ctx: WorkflowContext, name: string): any {
    return yield ctx.callActivity(greet, name);
  };

  workflowRuntime.registerWorkflow(greeting).registerActivity(greet);
  await workflowRuntime.start();

  // A name of its own per invocation: runs outlive their schedule, so a fixed name would list earlier invocations' runs.
  const scheduleName = `greetings-${Date.now().toString(36)}`;

  // Run the workflow every 2 seconds, 3 times. Each run is a new instance with the ID "<schedule name>_<owner>_<fire time>".
  await workflowClient.createWorkflowSchedule(scheduleName, greeting, "@every 2s", {
    input: "Dapr",
    repeats: 3,
    overwrite: true,
  });

  // Start a run now. It counts towards repeats but does not move the next scheduled run.
  await workflowClient.triggerWorkflowSchedule(scheduleName);
  console.log("Triggered a manual run");

  let schedule = await workflowClient.getWorkflowSchedule(scheduleName);
  while (schedule.status?.state === WorkflowScheduleState.ACTIVE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    schedule = await workflowClient.getWorkflowSchedule(scheduleName);
  }
  console.log(`Schedule finished after ${schedule.status?.runCount} runs`);

  // A page can come back short, even empty, while more remain, so follow the token to the end.
  const runIds: string[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await workflowClient.listWorkflowInstanceIds(continuationToken, undefined, `${scheduleName}_`);
    runIds.push(...page.instanceIds);
    continuationToken = page.continuationToken;
  } while (continuationToken);

  for (const id of runIds) {
    const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
    console.log(`Run output: ${state?.serializedOutput}`);
  }

  await workflowClient.deleteWorkflowSchedule(scheduleName);
  console.log("Schedule deleted");

  // Deleting a schedule leaves its runs, so purge them.
  for (const id of runIds) {
    await workflowClient.purgeWorkflow(id);
  }
  await workflowRuntime.stop();
  await workflowClient.stop();
  process.exit(0);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

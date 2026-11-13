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

  // Run the workflow every 2 seconds, 3 times. Each run is a new instance with the ID "greetings_<owner>_<fire time>".
  await workflowClient.createWorkflowSchedule("greetings", greeting, "@every 2s", {
    input: "Dapr",
    repeats: 3,
    overwrite: true,
  });

  // Start a run now. It counts towards repeats but does not move the next scheduled run.
  await workflowClient.triggerWorkflowSchedule("greetings");
  console.log("Triggered a manual run");

  let schedule = await workflowClient.getWorkflowSchedule("greetings");
  while (schedule.status?.state === WorkflowScheduleState.ACTIVE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    schedule = await workflowClient.getWorkflowSchedule("greetings");
  }
  console.log(`Schedule finished after ${schedule.status?.runCount} runs`);

  const { instanceIds } = await workflowClient.listWorkflowInstanceIds(undefined, undefined, "greetings_");
  for (const id of instanceIds) {
    const state = await workflowClient.waitForWorkflowCompletion(id, true, 30);
    console.log(`Run output: ${state?.serializedOutput}`);
  }

  await workflowClient.deleteWorkflowSchedule("greetings");
  console.log("Schedule deleted");
  await workflowRuntime.stop();
  await workflowClient.stop();
  process.exit(0);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

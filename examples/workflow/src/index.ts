/*
Copyright 2023 The Dapr Authors
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

import { DaprClient, LogLevel } from "@dapr/dapr";

async function start() {
  const client = new DaprClient({ logger: { level: LogLevel.Debug } });

  // // Start a new workflow instance
  const instanceId = await client.workflow.start("myWorkflow", { foo: "bar" });

  // Get details about a workflow instance
  const workflow = await client.workflow.get(instanceId);
  console.log(`Workflow ${workflow.workflowName}, created at ${workflow.createdAt.toUTCString()}, has status ${workflow.runtimeStatus}`);
  console.log(`Additional properties: ${JSON.stringify(workflow.properties)}`);

  // Pause a workflow instance
  await client.workflow.pause(instanceId);

  // Resume a workflow instance
  await client.workflow.resume(instanceId);

  // Terminate a workflow instance
  await client.workflow.terminate(instanceId);

  // Purge a workflow instance
  await client.workflow.purge(instanceId);

  const workflow2 = await client.workflow.get(instanceId);
  console.log(`Workflow ${workflow2.workflowName}, created at ${workflow2.createdAt.toUTCString()}, has status ${workflow2.runtimeStatus}`);
  console.log(`Additional properties: ${JSON.stringify(workflow2.properties)}`);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

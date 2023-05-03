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

import { DaprClient } from "@dapr/dapr";

async function start() {
  const client = new DaprClient();

  // // Start a new workflow instance
  // const instanceId = await client.workflow.start("myWorkflow", { foo: "bar" });

  // Get details about a workflow instance
  const workflow = await client.workflow.get("1234");
  console.log(workflow);

  // OUTPUT:
  // {
  //   WFInfo: { instance_id: '1234' },
  //   start_time: '2023-05-03T06:02:28Z',
  //   metadata: {
  //     'dapr.workflow.custom_status': '',
  //     'dapr.workflow.input': '{"Name":"Paperclips","Quantity":1,"TotalCost":99.95}',
  //     'dapr.workflow.last_updated': '2023-05-03T06:02:42Z',
  //     'dapr.workflow.name': 'OrderProcessingWorkflow',
  //     'dapr.workflow.output': '{"Processed":true}',
  //     'dapr.workflow.runtime_status': 'COMPLETED'
  //   }
  // }

  // // Pause a workflow instance
  // await client.workflow.pause(instanceId);

  // // Resume a workflow instance
  // await client.workflow.resume(instanceId);

  // // Terminate a workflow instance
  // await client.workflow.terminate(instanceId);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

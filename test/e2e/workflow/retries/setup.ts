/*
Copyright 2022 The Dapr Authors
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
import DaprWorkflowClient from "../../../../src/workflow/client/DaprWorkflowClient";
import WorkflowRuntime from "../../../../src/workflow/runtime/WorkflowRuntime";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../../helpers/containers";

export function setupWorkflowRetryHarness(): {
  getWorkflowClient: () => DaprWorkflowClient;
  getWorkflowRuntime: () => WorkflowRuntime;
} {
  let workflowHarness: WorkflowHarness;
  let workflowClient: DaprWorkflowClient;
  let workflowRuntime: WorkflowRuntime;

  beforeAll(async () => {
    workflowHarness = new WorkflowHarness({ daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE });
    workflowHarness
      .getDaprContainer()
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE);
    await workflowHarness.start();
  }, 180 * 1000);

  beforeEach(() => {
    const options = {
      daprHost: workflowHarness.getHost(),
      daprPort: workflowHarness.getGrpcPort().toString(),
    };
    workflowClient = new DaprWorkflowClient(options);
    workflowRuntime = new WorkflowRuntime(options);
  });

  afterEach(async () => {
    await workflowRuntime.stop();
    await workflowClient.stop();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await workflowHarness.stop();
    });
  });

  return {
    getWorkflowClient: () => workflowClient,
    getWorkflowRuntime: () => workflowRuntime,
  };
}

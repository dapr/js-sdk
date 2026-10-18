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

import WorkflowContext from "../../../../src/workflow/runtime/WorkflowContext";
import type { TWorkflow } from "../../../../src/types/workflow/Workflow.type";
import { WorkflowRuntimeStatus } from "../../../../src/workflow/runtime/WorkflowRuntimeStatus";
import { setupWorkflowRetryHarness } from "./setup";

describe("workflow activity retries", () => {
  const { getWorkflowClient, getWorkflowRuntime } = setupWorkflowRetryHarness();

  it("retries failed activities according to the workflow retry policy", async () => {
    let activityAttempts = 0;
    const eventuallySuccessfulActivity = () => {
      activityAttempts++;
      if (activityAttempts < 3) {
        throw new Error(`transient failure ${activityAttempts}`);
      }
      return "completed";
    };
    const retryWorkflow: TWorkflow = async function* (ctx: WorkflowContext): any {
      return yield ctx.callActivity(eventuallySuccessfulActivity, undefined, {
        retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 3, backoffCoefficient: 1 },
      });
    };

    getWorkflowRuntime().registerWorkflow(retryWorkflow).registerActivity(eventuallySuccessfulActivity);
    await getWorkflowRuntime().start();

    const id = await getWorkflowClient().scheduleNewWorkflow(retryWorkflow);
    const state = await getWorkflowClient().waitForWorkflowCompletion(id, undefined, 30);

    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.serializedOutput).toEqual(JSON.stringify("completed"));
    expect(activityAttempts).toBe(3);
  }, 31000);

  it("fails the workflow after exhausting activity retry attempts", async () => {
    let activityAttempts = 0;
    const alwaysFailingActivity = () => {
      activityAttempts++;
      throw new Error(`permanent failure ${activityAttempts}`);
    };
    const retryWorkflow: TWorkflow = async function* (ctx: WorkflowContext): any {
      yield ctx.callActivity(alwaysFailingActivity, undefined, {
        retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
      });
    };

    getWorkflowRuntime().registerWorkflow(retryWorkflow).registerActivity(alwaysFailingActivity);
    await getWorkflowRuntime().start();

    const id = await getWorkflowClient().scheduleNewWorkflow(retryWorkflow);
    const state = await getWorkflowClient().waitForWorkflowCompletion(id, undefined, 30);

    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.FAILED);
    expect(state?.workflowFailureDetails?.getErrorMessage()).toContain("permanent failure 2");
    expect(activityAttempts).toBe(2);
  }, 31000);
});

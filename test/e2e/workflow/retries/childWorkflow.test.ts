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

describe("workflow child retries", () => {
  const { getWorkflowClient, getWorkflowRuntime } = setupWorkflowRetryHarness();

  it("retries failed child workflows according to the workflow retry policy", async () => {
    let childAttempts = 0;
    const eventuallySuccessfulChild: TWorkflow = async (): Promise<{ result: string }> => {
      childAttempts++;
      if (childAttempts === 1) {
        throw new Error("transient child workflow failure");
      }
      return { result: "child completed" };
    };
    const parentWorkflow: TWorkflow = async function* (ctx: WorkflowContext): any {
      return yield ctx.callChildWorkflow(eventuallySuccessfulChild, undefined, undefined, {
        retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 2 },
      });
    };

    getWorkflowRuntime().registerWorkflow(eventuallySuccessfulChild).registerWorkflow(parentWorkflow);
    await getWorkflowRuntime().start();

    const id = await getWorkflowClient().scheduleNewWorkflow(parentWorkflow);
    const state = await getWorkflowClient().waitForWorkflowCompletion(id, undefined, 30);

    expect(state?.runtimeStatus).toEqual(WorkflowRuntimeStatus.COMPLETED);
    expect(state?.workflowFailureDetails).toBeUndefined();
    expect(state?.serializedOutput).toEqual(JSON.stringify({ result: "child completed" }));
    expect(childAttempts).toBe(2);
  }, 31000);
});

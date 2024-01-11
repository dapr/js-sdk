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

import { OrchestrationStatus } from "@microsoft/durabletask-js/orchestration/enum/orchestration-status.enum";
import {
  WorkflowRuntimeStatus,
  fromOrchestrationStatus,
  toOrchestrationStatus,
} from "../../../src/workflow/runtime/WorkflowRuntimeStatus";
import { getFunctionName } from "../../../src/workflow/internal";
import { TWorkflow } from "../../../src/types/workflow/Workflow.type";
import WorkflowContext from "../../../src/workflow/runtime/WorkflowContext";
import WorkflowActivityContext from "../../../src/workflow/runtime/WorkflowActivityContext";

describe("Workflow Runtime Status", () => {
  describe("convert runtime status", () => {
    const testCases = [
      {
        orchestrationStatus: OrchestrationStatus.RUNNING,
        workflowRuntimeStatus: WorkflowRuntimeStatus.RUNNING,
      },

      {
        orchestrationStatus: OrchestrationStatus.COMPLETED,
        workflowRuntimeStatus: WorkflowRuntimeStatus.COMPLETED,
      },

      {
        orchestrationStatus: OrchestrationStatus.FAILED,
        workflowRuntimeStatus: WorkflowRuntimeStatus.FAILED,
      },

      {
        orchestrationStatus: OrchestrationStatus.TERMINATED,
        workflowRuntimeStatus: WorkflowRuntimeStatus.TERMINATED,
      },

      {
        orchestrationStatus: OrchestrationStatus.CONTINUED_AS_NEW,
        workflowRuntimeStatus: WorkflowRuntimeStatus.CONTINUED_AS_NEW,
      },

      {
        orchestrationStatus: OrchestrationStatus.PENDING,
        workflowRuntimeStatus: WorkflowRuntimeStatus.PENDING,
      },

      {
        orchestrationStatus: OrchestrationStatus.SUSPENDED,
        workflowRuntimeStatus: WorkflowRuntimeStatus.SUSPENDED,
      },
    ];

    testCases.forEach((testCase) => {
      test("Should be able to convert between orchestration status to workflow runtime status", () => {
        expect(fromOrchestrationStatus(testCase.orchestrationStatus)).toEqual(testCase.workflowRuntimeStatus);
        expect(toOrchestrationStatus(testCase.workflowRuntimeStatus)).toEqual(testCase.orchestrationStatus);
      });
    });
  });

  describe("getFunctionName", () => {
    it("should return the name of the function", () => {
      const namedFunction = function exampleFunction(): number {
        return 1;
      };

      const result = getFunctionName(namedFunction);

      expect(result).toBe("exampleFunction");
    });

    it("should extract the name from the string representation of the function", () => {
      const anonymousFunction = function (): number {
        return 1;
      };

      const result = getFunctionName(anonymousFunction);

      expect(result).not.toBeUndefined();
      expect(typeof result).toBe("string");
    });

    it("should handle TWorkflow type", () => {
      const emptyWorkflow: TWorkflow = async (_: WorkflowContext, __: any) => {
        return 1;
      };

      const result = getFunctionName(emptyWorkflow);

      expect(result).toBe("emptyWorkflow");
    });

    it("should handle TWorkflow type", () => {
      const emptyWorkflowActivity = async (_: WorkflowActivityContext) => {
        return 1;
      };

      const result = getFunctionName(emptyWorkflowActivity);

      expect(result).toBe("emptyWorkflowActivity");
    });
  });
});

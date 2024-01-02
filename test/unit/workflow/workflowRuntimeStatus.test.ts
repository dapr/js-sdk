import { OrchestrationStatus } from "kaibocai-durabletask-js/orchestration/enum/orchestration-status.enum"
import { WorkflowRuntimeStatus, fromOrchestrationStatus, toOrchestrationStatus } from "../../../src/workflow/runtime/WorkflowRuntimeStatus"

describe("Workflow Runtime Status", () => {
    it("should convert from orchestration status to workflow runtime status", async () => {
        expect(fromOrchestrationStatus(OrchestrationStatus.RUNNING)).toEqual(WorkflowRuntimeStatus.RUNNING);
        expect(fromOrchestrationStatus(OrchestrationStatus.COMPLETED)).toEqual(WorkflowRuntimeStatus.COMPLETED);
        expect(fromOrchestrationStatus(OrchestrationStatus.FAILED)).toEqual(WorkflowRuntimeStatus.FAILED);
        expect(fromOrchestrationStatus(OrchestrationStatus.TERMINATED)).toEqual(WorkflowRuntimeStatus.TERMINATED);
        expect(fromOrchestrationStatus(OrchestrationStatus.CONTINUED_AS_NEW)).toEqual(WorkflowRuntimeStatus.CONTINUED_AS_NEW);
        expect(fromOrchestrationStatus(OrchestrationStatus.PENDING)).toEqual(WorkflowRuntimeStatus.PENDING);
        expect(fromOrchestrationStatus(OrchestrationStatus.SUSPENDED)).toEqual(WorkflowRuntimeStatus.SUSPENDED);
    })

    it("should convert from workflow runtime status to orchestration status", async () => {
        expect(toOrchestrationStatus(WorkflowRuntimeStatus.RUNNING)).toEqual(OrchestrationStatus.RUNNING);
        expect(toOrchestrationStatus(WorkflowRuntimeStatus.COMPLETED)).toEqual(OrchestrationStatus.COMPLETED);
        expect(toOrchestrationStatus(WorkflowRuntimeStatus.FAILED)).toEqual(OrchestrationStatus.FAILED);
        expect(toOrchestrationStatus(WorkflowRuntimeStatus.TERMINATED)).toEqual(OrchestrationStatus.TERMINATED);
        expect(toOrchestrationStatus(WorkflowRuntimeStatus.CONTINUED_AS_NEW)).toEqual(OrchestrationStatus.CONTINUED_AS_NEW);
        expect(toOrchestrationStatus(WorkflowRuntimeStatus.PENDING)).toEqual(OrchestrationStatus.PENDING);
        expect(toOrchestrationStatus(WorkflowRuntimeStatus.SUSPENDED)).toEqual(OrchestrationStatus.SUSPENDED);
    })
})
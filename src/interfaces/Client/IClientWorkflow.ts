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

import { WorkflowGetResponseType } from "../../types/workflow/WorkflowGetResponse.type";

export default interface IClientWorkflow {
  /**
   * Get information about a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   */

  getWorkflowState(instanceId: string): Promise<WorkflowGetResponseType>;

  /**
   * Starts a new workflow instance.
   * @param workflowName The name of the workflow to start.
   * @param input The input to pass to the workflow, should be JSON serializable.
   * @param instanceId The unique identifier for the workflow instance, if not provided one will be generated.
   */
  scheduleNewWorkflow(workflowName: string, input?: any, instanceId?: string): Promise<string>;

  /**
   * Terminates a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   */
  terminate(instanceId: string): Promise<void>;

  /**
   * Pauses a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   */
  pause(instanceId: string): Promise<void>;

  /**
   * Resumes a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   */
  resume(instanceId: string): Promise<void>;

  /**
   * Purge a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   */
  purge(instanceId: string): Promise<void>;

  /**
   * Raise an event to a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   * @param eventName The name of the event to raise.
   * @param eventData The data associated with the event, should be JSON serializable.
   */
  raiseEvent(instanceId: string, eventName: string, eventData?: any): Promise<void>;
}

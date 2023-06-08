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
   * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
   */
  get(instanceId: string, workflowComponent?: string): Promise<WorkflowGetResponseType>;

  /**
   * Starts a new workflow instance.
   * @param workflowName The name of the workflow to start.
   * @param input The input to pass to the workflow, should be JSON serializable.
   * @param instanceId The unique identifier for the workflow instance, if not provided one will be generated.
   * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
   */
  start(workflowName: string, input?: any, instanceId?: string, workflowComponent?: string): Promise<string>;

  /**
   * Terminates a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
   */
  terminate(instanceId: string, workflowComponent?: string): Promise<void>;

  /**
   * Pauses a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
   */
  pause(instanceId: string, workflowComponent?: string): Promise<void>;

  /**
   * Resumes a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
   */
  resume(instanceId: string, workflowComponent?: string): Promise<void>;

  /**
   * Purge a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
   */
  purge(instanceId: string, workflowComponent?: string): Promise<void>;

  /**
   * Raise an event to a workflow instance.
   * @param instanceId The unique identifier for the workflow instance.
   * @param eventName The name of the event to raise.
   * @param eventData The data associated with the event, should be JSON serializable.
   * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
   */
  raise(instanceId: string, eventName: string, eventData?: any, workflowComponent?: string): Promise<void>;
}

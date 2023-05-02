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

export default interface IClientWorkflow {
    /**
     * Get information about a workflow instance.
     * @param instanceId The unique identifier for the workflow instance.
     * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
     */
    get(instanceId: string, workflowComponent?: string): Promise<any>;

    /**
     * Starts a new workflow instance.
     * @param workflowName The name of the workflow to start.
     * @param input The input to pass to the workflow, should be JSON serializable.
     * @param workflowComponent The name of the workflow component to interface with, if not provided the default "dapr" will be used.
     * @param instanceId The unique identifier for the workflow instance, if not provided one will be generated.
     */
    start(workflowName: string, input: any, workflowComponent?: string, instanceId?: string): Promise<string>;
    terminate(instanceId: string, workflowComponent?: string): Promise<any>;
    pause(instanceId: string, workflowComponent?: string): Promise<any>;
    resume(instanceId: string, workflowComponent?: string): Promise<any>;
    purge(instanceId: string, workflowComponent?: string): Promise<any>;
    raise(instanceId: string, eventName: string, workflowComponent?: string): Promise<any>;
}
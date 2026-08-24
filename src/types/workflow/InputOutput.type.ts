/*
Copyright 2024 The Dapr Authors
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

/**
 * Input parameter type for workflow activities.
 *
 * Activities receive input from orchestrator functions via this type.
 * The value is JSON-deserialized from the orchestrator's call.
 *
 * @see {@link TWorkflowActivity}
 * @see {@link WorkflowContext.callActivity}
 */
export type TInput = any;

/**
 * Return value type for workflows and activities.
 *
 * Both orchestrator functions and activities return values of this type.
 * The value must be JSON-serializable for durability and state persistence.
 *
 * @see {@link TWorkflow}
 * @see {@link TWorkflowActivity}
 */
export type TOutput = any;

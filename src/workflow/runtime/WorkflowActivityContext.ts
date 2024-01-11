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

import { ActivityContext } from "@microsoft/durabletask-js";

/**
 * Used by activity to perform actions such as getting activity's name and
 * its input.
 */
export default class WorkflowActivityContext {
  private readonly _innerContext: ActivityContext;
  constructor(innerContext: ActivityContext) {
    if (!innerContext) {
      throw new Error("ActivityContext cannot be undefined");
    }
    this._innerContext = innerContext;
  }

  /**
   * Gets the unique identifier of the workflow instance associated with the current context.
   *
   * @returns {string} The unique identifier (orchestrationId) of the workflow instance.
   */
  public getWorkflowInstanceId(): string {
    return this._innerContext.orchestrationId;
  }

  /**
   * Gets the task ID (activityId) associated with the current workflow activity context.
   *
   * @returns {number} The task ID (activityId) of the current workflow activity.
   */
  public getWorkflowActivityId(): number {
    return this._innerContext.taskId;
  }
}

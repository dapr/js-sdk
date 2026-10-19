/*
Copyright 2026 The Dapr Authors
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

import type { ActivityContext } from "../engine";
import type { PropagatedHistory } from "./PropagatedHistory";

export default class WorkflowActivityContext {
  constructor(private readonly _innerContext: ActivityContext) {
    if (!_innerContext) {
      throw new Error("ActivityContext cannot be undefined");
    }
  }

  public getWorkflowInstanceId(): string {
    return this._innerContext.orchestrationId;
  }

  public getPropagatedHistory(): PropagatedHistory | undefined {
    return this._innerContext.propagatedHistory;
  }

  public getWorkflowActivityId(): number {
    return this._innerContext.taskId;
  }

  /** The runtime-supplied execution key, or undefined when the runtime does not supply one. */
  public getTaskExecutionId(): string | undefined {
    return this._innerContext.taskExecutionId || undefined;
  }
}

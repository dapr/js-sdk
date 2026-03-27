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

import { isPromise } from "util/types";
import { ActivityContext } from "../task/context/activity-context";
import { ActivityNotRegisteredError } from "./exception/activity-not-registered-error";
import { Registry } from "./registry";

export class ActivityExecutor {
  private _registry: Registry;

  constructor(registry: Registry) {
    this._registry = registry;
  }

  public async execute(
    orchestrationId: string,
    name: string,
    taskId: number,
    encodedInput?: string,
  ): Promise<string | undefined> {
    const fn = this._registry.getActivity(name);

    if (!fn) {
      throw new ActivityNotRegisteredError(name);
    }

    const activityInput = encodedInput ? JSON.parse(encodedInput) : undefined;
    const ctx = new ActivityContext(orchestrationId, taskId);

    // Execute the activity function
    let activityOutput = fn(ctx, activityInput);

    if (isPromise(activityOutput)) {
      activityOutput = await activityOutput;
    }

    // Return the output
    const encodedOutput = activityOutput != null ? JSON.stringify(activityOutput) : undefined;

    return encodedOutput;
  }
}

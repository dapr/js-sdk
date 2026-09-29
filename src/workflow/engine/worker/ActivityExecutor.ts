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
import { ActivityContext } from "../context/ActivityContext";
import { Registry } from "./Registry";

export class ActivityExecutor {
  constructor(private readonly _registry: Registry) {}

  async execute(
    orchestrationId: string,
    name: string,
    taskId: number,
    encodedInput?: string,
  ): Promise<string | undefined> {
    const fn = this._registry.getActivity(name);

    if (!fn) {
      throw new Error(`Activity '${name}' is not registered.`);
    }

    const activityInput = encodedInput ? JSON.parse(encodedInput) : undefined;
    const ctx = new ActivityContext(orchestrationId, taskId);

    let activityOutput = fn(ctx, activityInput);

    if (isPromise(activityOutput)) {
      activityOutput = await activityOutput;
    }

    const encodedOutput = activityOutput != null ? JSON.stringify(activityOutput) : undefined;
    return encodedOutput;
  }
}

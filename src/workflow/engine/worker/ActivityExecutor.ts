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
import type { PropagatedHistory as HistoryMessage } from "../../../proto/dapr/proto/durabletask/v1/history_events_pb";
import { decodePropagatedHistory } from "./protoHelpers";
import { IDaprSerializer } from "../../../serialization/IDaprSerializer";
import { serializeWorkflowValue, deserializeWorkflowValue } from "../../../serialization/Serialization.util";

export class ActivityExecutor {
  constructor(private readonly _registry: Registry, private readonly serializer?: IDaprSerializer) {}

  async execute(
    orchestrationId: string,
    name: string,
    taskId: number,
    encodedInput?: string,
    propagatedHistory?: HistoryMessage,
  ): Promise<string | undefined> {
    const fn = this._registry.getActivity(name);

    if (!fn) {
      throw new Error(`Activity '${name}' is not registered.`);
    }

    const activityInput = encodedInput ? deserializeWorkflowValue(encodedInput, this.serializer) : undefined;
    const history = decodePropagatedHistory(propagatedHistory);
    const ctx = new ActivityContext(orchestrationId, taskId, history);

    let activityOutput = fn(ctx, activityInput);

    if (isPromise(activityOutput)) {
      activityOutput = await activityOutput;
    }

    const encodedOutput = activityOutput != null ? serializeWorkflowValue(activityOutput, this.serializer) : undefined;
    return encodedOutput;
  }
}

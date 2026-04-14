// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

import { ActivityContext } from "../../../../src/workflow/internal/durabletask/task/context/activity-context";
import { TActivity } from "../../../../src/workflow/internal/durabletask/types/activity.type";
import { ActivityExecutor } from "../../../../src/workflow/internal/durabletask/worker/activity-executor";
import { ActivityNotRegisteredError } from "../../../../src/workflow/internal/durabletask/worker/exception/activity-not-registered-error";
import { Registry } from "../../../../src/workflow/internal/durabletask/worker/registry";

// const TEST_LOGGER = shared.get_logger();
const TEST_INSTANCE_ID = "abc123";
const TEST_TASK_ID = 42;

describe("Activity Executor", () => {
  it("should validates activity function input population", async () => {
    const testActivity = (ctx: ActivityContext, testInput: any) => {
      // return all activity inputs back as the output
      return [testInput, ctx.orchestrationId, ctx.taskId];
    };

    const activityInput = "Hello, 世界!";
    const [executor, name] = getActivityExecutor(testActivity);
    const result = await executor.execute(TEST_INSTANCE_ID, name, TEST_TASK_ID, JSON.stringify(activityInput));
    expect(result).not.toBeNull();

    const [resultInput, resultOrchestrationId, resultTaskId] = JSON.parse(result ?? "[]");

    expect(activityInput).toEqual(resultInput);
    expect(TEST_INSTANCE_ID).toEqual(resultOrchestrationId);
    expect(TEST_TASK_ID).toEqual(resultTaskId);
  });

  it("It should raise a worker.ActivityNotRegisteredError exception when attempting to execute an unregistered activity", async () => {
    const testActivity = (_: ActivityContext) => {
      return;
    };

    const [executor, _] = getActivityExecutor(testActivity);

    let caughtException: Error | null = null;

    try {
      await executor.execute(TEST_INSTANCE_ID, "Bogus", TEST_TASK_ID, undefined);
    } catch (ex: any) {
      caughtException = ex;
    }

    expect(caughtException?.constructor?.name).toEqual(ActivityNotRegisteredError.name);
    expect(caughtException).not.toBeNull();
    expect(caughtException?.message).toMatch(/Bogus/);
  });
});

// Activity = Callable[[ActivityContext, TInput], TOutput]
function getActivityExecutor(fn: TActivity<any, any>): [ActivityExecutor, string] {
  const registry = new Registry();
  const name = registry.addActivity(fn);
  const executor = new ActivityExecutor(registry);
  return [executor, name];
}

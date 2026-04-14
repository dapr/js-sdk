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

import {
  DaprWorkflowClient,
  WorkflowActivityContext,
  WorkflowContext,
  WorkflowRuntime,
  WorkflowRuntimeStatus,
  TWorkflow,
} from "@dapr/dapr";
import { Task } from "@dapr/durabletask-js/task/task";

const daprHost = "localhost";
const daprPort = "50001";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  }
}

// ─── Activities ───────────────────────────────────────────────────────────────

const addOne = async (_: WorkflowActivityContext, input: number): Promise<number> => {
  return input + 1;
};

const multiply = async (_: WorkflowActivityContext, input: { a: number; b: number }): Promise<number> => {
  return input.a * input.b;
};

const greet = async (_: WorkflowActivityContext, name: string): Promise<string> => {
  return `Hello, ${name}!`;
};

const slowActivity = async (_: WorkflowActivityContext, delayMs: number): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return `waited ${delayMs}ms`;
};

const failingActivity = async (_: WorkflowActivityContext, _input: any): Promise<never> => {
  throw new Error("Activity intentionally failed!");
};

// ─── Workflows ────────────────────────────────────────────────────────────────

// 1. Activity sequence (task chaining)
const sequenceWorkflow: TWorkflow = async function* (ctx: WorkflowContext, startVal: number): any {
  let current = startVal;
  for (let i = 0; i < 5; i++) {
    current = yield ctx.callActivity(addOne, current);
  }
  return current;
};

// 2. Fan-out/fan-in (parallel execution)
const fanOutFanInWorkflow: TWorkflow = async function* (ctx: WorkflowContext, count: number): any {
  const tasks: Task<number>[] = [];
  for (let i = 1; i <= count; i++) {
    tasks.push(ctx.callActivity(multiply, { a: i, b: 10 }));
  }
  const results: number[] = yield ctx.whenAll(tasks);
  return results.reduce((sum: number, val: number) => sum + val, 0);
};

// 3. Child/sub-workflow
const childWorkflow: TWorkflow = async function* (ctx: WorkflowContext, input: string): any {
  const result = yield ctx.callActivity(greet, input);
  return result;
};

const parentWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _input: any): any {
  const r1: string = yield ctx.callChildWorkflow(childWorkflow, "Alice");
  const r2: string = yield ctx.callChildWorkflow(childWorkflow, "Bob");
  return [r1, r2];
};

// 4. External events
const externalEventWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _input: any): any {
  const event1: string = yield ctx.waitForExternalEvent("event1");
  const event2: string = yield ctx.waitForExternalEvent("event2");
  return { event1, event2 };
};

// 5. Timer with whenAny (approval pattern)
const timerWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _input: any): any {
  const approval = ctx.waitForExternalEvent("approval");
  const timeout = ctx.createTimer(2); // 2 second timeout
  const winner = yield ctx.whenAny([approval, timeout]);
  if (winner === approval) {
    return "approved";
  } else {
    return "timed_out";
  }
};

// 6. Activity error propagation (bug #708 fix test)
const errorWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _input: any): any {
  try {
    yield ctx.callActivity(failingActivity, null);
    return "should_not_reach";
  } catch (e: any) {
    return `caught: ${e.message}`;
  }
};

// 7. Continue as new (monitor pattern)
const monitorWorkflow: TWorkflow = async (ctx: WorkflowContext, counter: number) => {
  if (counter < 3) {
    ctx.continueAsNew(counter + 1, true);
  } else {
    return counter;
  }
};

// 8. Custom status workflow
const customStatusWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _input: any): any {
  ctx.setCustomStatus("step1");
  yield ctx.callActivity(addOne, 1);
  ctx.setCustomStatus("step2");
  yield ctx.callActivity(addOne, 2);
  ctx.setCustomStatus("completed");
  return "done";
};

// 9. Workflow for suspend/resume testing
const suspendResumeWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _input: any): any {
  const val: string = yield ctx.waitForExternalEvent("resume_signal");
  return `resumed with: ${val}`;
};

// 10. Workflow for terminate testing
const terminateWorkflow: TWorkflow = async function* (ctx: WorkflowContext, _input: any): any {
  yield ctx.waitForExternalEvent("never_coming");
  return "should_not_reach";
};

// ─── Test Runner ──────────────────────────────────────────────────────────────

async function runTests() {
  const workflowClient = new DaprWorkflowClient({ daprHost, daprPort });
  const workflowRuntime = new WorkflowRuntime({ daprHost, daprPort });

  // Register everything
  workflowRuntime
    .registerWorkflow(sequenceWorkflow)
    .registerWorkflow(fanOutFanInWorkflow)
    .registerWorkflow(childWorkflow)
    .registerWorkflow(parentWorkflow)
    .registerWorkflow(externalEventWorkflow)
    .registerWorkflow(timerWorkflow)
    .registerWorkflow(errorWorkflow)
    .registerWorkflow(monitorWorkflow)
    .registerWorkflow(customStatusWorkflow)
    .registerWorkflow(suspendResumeWorkflow)
    .registerWorkflow(terminateWorkflow)
    .registerActivity(addOne)
    .registerActivity(multiply)
    .registerActivity(greet)
    .registerActivity(slowActivity)
    .registerActivity(failingActivity);

  await workflowRuntime.start();
  console.log("Workflow runtime started\n");

  // ── Test 1: Activity Sequence ──────────────────────────────────────────────
  console.log("Test 1: Activity Sequence (Task Chaining)");
  {
    const id = await workflowClient.scheduleNewWorkflow(sequenceWorkflow, 10);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(state?.serializedOutput === JSON.stringify(15), `output is 15 (got ${state?.serializedOutput})`);
  }

  // ── Test 2: Fan-out/Fan-in ─────────────────────────────────────────────────
  console.log("\nTest 2: Fan-out/Fan-in (Parallel Execution)");
  {
    const id = await workflowClient.scheduleNewWorkflow(fanOutFanInWorkflow, 5);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    // 1*10 + 2*10 + 3*10 + 4*10 + 5*10 = 150
    assert(state?.serializedOutput === JSON.stringify(150), `output is 150 (got ${state?.serializedOutput})`);
  }

  // ── Test 3: Child Workflow ─────────────────────────────────────────────────
  console.log("\nTest 3: Child/Sub-Workflow");
  {
    const id = await workflowClient.scheduleNewWorkflow(parentWorkflow);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(
      state?.serializedOutput === JSON.stringify(["Hello, Alice!", "Hello, Bob!"]),
      `output matches (got ${state?.serializedOutput})`,
    );
  }

  // ── Test 4: External Events ────────────────────────────────────────────────
  console.log("\nTest 4: External Events (Raise Event)");
  {
    const id = await workflowClient.scheduleNewWorkflow(externalEventWorkflow);
    await workflowClient.waitForWorkflowStart(id, undefined, 30);

    await workflowClient.raiseEvent(id, "event1", "hello");
    await workflowClient.raiseEvent(id, "event2", "world");

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(
      state?.serializedOutput === JSON.stringify({ event1: "hello", event2: "world" }),
      `output matches (got ${state?.serializedOutput})`,
    );
  }

  // ── Test 5: Timer with whenAny (approval - approved) ──────────────────────
  console.log("\nTest 5a: Timer + WhenAny (Approved before timeout)");
  {
    const id = await workflowClient.scheduleNewWorkflow(timerWorkflow);
    await workflowClient.waitForWorkflowStart(id, undefined, 30);

    await workflowClient.raiseEvent(id, "approval", true);

    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(state?.serializedOutput === JSON.stringify("approved"), `output is "approved" (got ${state?.serializedOutput})`);
  }

  // ── Test 5b: Timer with whenAny (timeout) ─────────────────────────────────
  console.log("\nTest 5b: Timer + WhenAny (Timeout)");
  {
    const id = await workflowClient.scheduleNewWorkflow(timerWorkflow);
    // Don't raise event - let it timeout
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(
      state?.serializedOutput === JSON.stringify("timed_out"),
      `output is "timed_out" (got ${state?.serializedOutput})`,
    );
  }

  // ── Test 6: Activity Error Propagation (Bug #708) ─────────────────────────
  console.log("\nTest 6: Activity Error Propagation (Bug #708)");
  {
    const id = await workflowClient.scheduleNewWorkflow(errorWorkflow);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED (error caught in workflow)");
    const output = state?.serializedOutput;
    assert(
      output !== undefined && output.includes("caught:"),
      `error was caught by workflow (got ${output})`,
    );
  }

  // ── Test 7: Continue As New (Monitor Pattern) ─────────────────────────────
  console.log("\nTest 7: Continue As New (Monitor Pattern)");
  {
    const id = await workflowClient.scheduleNewWorkflow(monitorWorkflow, 0);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(state?.serializedOutput === JSON.stringify(3), `output is 3 (got ${state?.serializedOutput})`);
  }

  // ── Test 8: Custom Status ─────────────────────────────────────────────────
  console.log("\nTest 8: Custom Status");
  {
    const id = await workflowClient.scheduleNewWorkflow(customStatusWorkflow);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(state?.customStatus === "completed", `custom status is "completed" (got ${state?.customStatus})`);
    assert(state?.serializedOutput === JSON.stringify("done"), `output is "done" (got ${state?.serializedOutput})`);
  }

  // ── Test 9: Suspend / Resume ──────────────────────────────────────────────
  console.log("\nTest 9: Suspend / Resume");
  {
    const id = await workflowClient.scheduleNewWorkflow(suspendResumeWorkflow);
    await workflowClient.waitForWorkflowStart(id, undefined, 30);

    // Suspend
    await workflowClient.suspendWorkflow(id);
    // Give it a moment to suspend
    await new Promise((r) => setTimeout(r, 1000));
    let state = await workflowClient.getWorkflowState(id, true);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.SUSPENDED, `status is SUSPENDED (got ${state?.runtimeStatus})`);

    // Resume
    await workflowClient.resumeWorkflow(id);
    await new Promise((r) => setTimeout(r, 1000));
    state = await workflowClient.getWorkflowState(id, true);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.RUNNING, `status is RUNNING after resume (got ${state?.runtimeStatus})`);

    // Complete it
    await workflowClient.raiseEvent(id, "resume_signal", "go!");
    state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(
      state?.serializedOutput === JSON.stringify("resumed with: go!"),
      `output matches (got ${state?.serializedOutput})`,
    );
  }

  // ── Test 10: Terminate ────────────────────────────────────────────────────
  console.log("\nTest 10: Terminate");
  {
    const id = await workflowClient.scheduleNewWorkflow(terminateWorkflow);
    await workflowClient.waitForWorkflowStart(id, undefined, 30);

    await workflowClient.terminateWorkflow(id, "terminated by test");
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.TERMINATED, `status is TERMINATED (got ${state?.runtimeStatus})`);
    assert(
      state?.serializedOutput === JSON.stringify("terminated by test"),
      `output is termination reason (got ${state?.serializedOutput})`,
    );
  }

  // ── Test 11: Purge ────────────────────────────────────────────────────────
  console.log("\nTest 11: Purge");
  {
    const id = await workflowClient.scheduleNewWorkflow(sequenceWorkflow, 0);
    await workflowClient.waitForWorkflowCompletion(id, undefined, 30);

    const purged = await workflowClient.purgeWorkflow(id);
    assert(purged === true, "purge returned true");

    const state = await workflowClient.getWorkflowState(id, true);
    assert(state === undefined, "workflow state is gone after purge");
  }

  // ── Test 12: Workflow by string name ──────────────────────────────────────
  console.log("\nTest 12: Schedule Workflow by String Name");
  {
    const id = await workflowClient.scheduleNewWorkflow("sequenceWorkflow", 100);
    const state = await workflowClient.waitForWorkflowCompletion(id, undefined, 30);
    assert(state?.runtimeStatus === WorkflowRuntimeStatus.COMPLETED, "status is COMPLETED");
    assert(state?.serializedOutput === JSON.stringify(105), `output is 105 (got ${state?.serializedOutput})`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("═".repeat(60));

  await workflowRuntime.stop();
  await workflowClient.stop();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

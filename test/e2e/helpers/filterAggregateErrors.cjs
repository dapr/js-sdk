/*
Copyright 2025 The Dapr Authors
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
 * Jest `testResultsProcessor` that removes spurious "Test suite failed to run"
 * entries caused by empty-message AggregateErrors emitted by testcontainers'
 * ssh2/SubtleCrypto handles during container teardown (GC).
 *
 * These errors fire as unhandled promise rejections after the test file's
 * `afterAll` block completes but while Jest is still waiting for open handles
 * to drain.  Jest-circus catches them via its `unhandledRejection` listener
 * and marks the suite as failed even though every individual test passed.
 *
 * This processor runs after all test results are aggregated and before Jest
 * reports the final exit code.  It removes the false failures, updates the
 * suite and overall counters, and sets `results.success` so that Jest exits
 * with code 0 when the only failures were these spurious AggregateErrors.
 *
 * Detection criteria (all must be true):
 *  1. The suite is marked as `failed`.
 *  2. Every individual test in the suite has status `passed`.
 *  3. The entire failure message consists only of repeated
 *     "● Test suite failed to run\n\n    AggregateError:\n" blocks.
 */

/** Strip ANSI escape codes so we can do plain-text pattern matching. */
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
}

/**
 * Returns true when every failure in `failureMessage` is an empty-message
 * AggregateError "Test suite failed to run" block.
 */
function hasOnlyEmptyAggregateErrors(failureMessage) {
  if (!failureMessage) return false;
  const clean = stripAnsi(failureMessage);
  // Split on the "● Test suite failed to run" header
  const blocks = clean.split("● Test suite failed to run");
  // blocks[0] is whatever came before the first ●; skip it
  const errorBlocks = blocks.slice(1);
  if (errorBlocks.length === 0) return false;
  // Each error block should contain ONLY "AggregateError:" after stripping whitespace
  return errorBlocks.every((block) => block.replace(/\s/g, "") === "AggregateError:");
}

/**
 * Jest testResultsProcessor entry point.
 * @param {import('@jest/test-result').AggregatedResult} results
 * @returns {import('@jest/test-result').AggregatedResult}
 */
module.exports = function filterAggregateErrors(results) {
  let fixedCount = 0;

  results.testResults = results.testResults.map((suite) => {
    // Only touch suites explicitly marked as failed
    if (suite.status !== "failed") return suite;

    // All individual test cases must have passed
    const allTestsPassed =
      suite.testResults.length > 0 && suite.testResults.every((t) => t.status === "passed");
    if (!allTestsPassed) return suite;

    // Failure message must consist solely of empty AggregateError blocks
    if (!hasOnlyEmptyAggregateErrors(suite.failureMessage)) return suite;

    fixedCount++;
    return {
      ...suite,
      status: "passed",
      testExecError: null,
      failureMessage: null,
    };
  });

  if (fixedCount > 0) {
    results.numFailedTestSuites = Math.max(0, (results.numFailedTestSuites || 0) - fixedCount);
    results.numPassedTestSuites = (results.numPassedTestSuites || 0) + fixedCount;
    // Update top-level success flag so Jest exits with code 0
    if (results.numFailedTestSuites === 0 && (results.numFailedTests || 0) === 0) {
      results.success = true;
    }
  }

  return results;
};

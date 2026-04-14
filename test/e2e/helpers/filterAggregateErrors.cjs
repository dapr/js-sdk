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
 * `afterAll` block completes.  Jest-circus catches them via its
 * `unhandledRejection` listener, stores them in `state.unhandledErrors`, and
 * converts them into a `testExecError` on the suite result even though every
 * individual test passed.
 *
 * ## Why the simple `suite.status === "failed"` check does NOT work
 *
 * `runAndTransformResultsToJestFormat` (jest-circus) builds the suite result
 * from `createEmptyTestResult()` which has NO `status` field.  The `status`
 * field on a suite result is `undefined` – it is only defined on individual
 * test-case results.  Checking `suite.status !== "failed"` always skips the
 * suite even when it has a `testExecError`.
 *
 * ## Correct detection
 *
 * A suite result that was spoiled solely by ssh2/SubtleCrypto AggregateErrors
 * has ALL of the following characteristics:
 *  1. `suite.testExecError` is non-null (jest-circus set it from unhandled errors).
 *  2. Every line of `suite.testExecError.message` is blank or "AggregateError[:]".
 *     IMPORTANT: when jest-circus accumulates N unhandled AggregateErrors it
 *     joins their `toString()` values with "\n", giving a TRUTHY multi-line
 *     string like "AggregateError\nAggregateError\n..." — the old check
 *     `if (message) return false` incorrectly rejected these suites.
 *  3. Every line in `suite.testExecError.stack` is blank or "AggregateError[:]"
 *     (no real JS stack frames).
 *  4. `suite.numFailingTests === 0` — every individual test passed.
 *
 * ## What we fix
 *
 * We clear `testExecError` and `failureMessage` on the matching suite(s) and
 * decrement both `numFailedTestSuites` and `numRuntimeErrorTestSuites` (the
 * latter is what drives `anyTestFailures` → `results.success = false`).
 * Finally we set `results.success = true` so Jest exits with code 0.
 */

/**
 * Returns true when every non-empty line in `str` is "AggregateError" or
 * "AggregateError:" — i.e. the string came solely from empty-message
 * AggregateErrors with no real JS stack frames.
 *
 * Accepts null/undefined/empty string (absent content is considered clean).
 * Returns false when any line contains real content (a message or "at …" frame).
 *
 * @param {string|null|undefined} str
 * @returns {boolean}
 */
function isAggregateErrorOnlyContent(str) {
  if (str === null || str === undefined || str === "") return true;
  return str.split("\n").every((line) => {
    const trimmed = line.trim();
    return trimmed === "" || trimmed === "AggregateError" || trimmed === "AggregateError:";
  });
}

/**
 * Returns true if the suite result was spoiled solely by empty-message
 * AggregateErrors from testcontainers/ssh2 handle GC.
 *
 * @param {import('@jest/test-result').TestResult} suite
 */
function isSpuriousAggregateErrorSuite(suite) {
  // Must have a testExecError (this is how jest-circus records unhandled errors)
  if (!suite.testExecError) return false;
  // testExecError.message must be empty or contain only "AggregateError[:]" lines.
  // When jest-circus accumulates multiple AggregateErrors it joins them with "\n",
  // producing a truthy string — we must inspect line-by-line, not just !message.
  if (!isAggregateErrorOnlyContent(suite.testExecError.message)) return false;
  // testExecError.stack must also contain only AggregateError lines (no real frames)
  if (!suite.testExecError.stack) return false;
  if (!isAggregateErrorOnlyContent(suite.testExecError.stack)) return false;
  // All individual tests must have passed (no genuine test failures)
  if (suite.numFailingTests !== 0) return false;
  return true;
}

/**
 * Jest testResultsProcessor entry point.
 * @param {import('@jest/test-result').AggregatedResult} results
 * @returns {import('@jest/test-result').AggregatedResult}
 */
module.exports = function filterAggregateErrors(results) {
  let fixedCount = 0;

  results.testResults = results.testResults.map((suite) => {
    if (!isSpuriousAggregateErrorSuite(suite)) return suite;

    fixedCount++;
    return {
      ...suite,
      testExecError: null,
      failureMessage: null,
    };
  });

  if (fixedCount > 0) {
    results.numFailedTestSuites = Math.max(0, (results.numFailedTestSuites || 0) - fixedCount);
    results.numPassedTestSuites = (results.numPassedTestSuites || 0) + fixedCount;
    // numRuntimeErrorTestSuites is what drives anyTestFailures → results.success = false
    results.numRuntimeErrorTestSuites = Math.max(
      0,
      (results.numRuntimeErrorTestSuites || 0) - fixedCount
    );
    // Update top-level success flag so Jest exits with code 0
    if (
      results.numFailedTestSuites === 0 &&
      (results.numFailedTests || 0) === 0 &&
      results.numRuntimeErrorTestSuites === 0
    ) {
      results.success = true;
    }
  }

  return results;
};

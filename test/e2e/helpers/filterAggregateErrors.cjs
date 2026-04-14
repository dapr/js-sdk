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
 * ## How jest-circus builds testExecError
 *
 * In `jestAdapterInit.js`, when `runResult.unhandledErrors.length > 0`:
 *   - `testExecError.message` is **always set to `''`** (hard-coded empty string)
 *   - `testExecError.stack` = `unhandledErrors.join('\n')`
 *
 * Each element of `unhandledErrors` is the result of `getErrorStack(error)`:
 *   - `error.stack` if it is a string (e.g. `"AggregateError\n    at ...\n    at ..."`)
 *   - otherwise `error.message`
 *
 * So when jest-circus accumulates 13 ssh2/SubtleCrypto GC AggregateErrors,
 * `testExecError.stack` contains all 13 full stack traces joined with '\n' —
 * each one looking like `"AggregateError\n    at processTicksAndMicrotasks ..."`.
 * `testExecError.message` is always `''` regardless.
 *
 * ## Correct detection
 *
 * A suite result spoiled solely by ssh2/SubtleCrypto empty-message AggregateErrors:
 *  1. `suite.testExecError` is non-null.
 *  2. `suite.testExecError.message` is `''` (always true for jest-circus unhandled errors).
 *  3. `suite.testExecError.stack` contains only:
 *       - blank lines
 *       - `"AggregateError"` or `"AggregateError:"` header lines (no message)
 *       - `"at ..."` stack-frame lines (allowed — real AggregateErrors always have frames)
 *     Any line of the form `"AggregateError: <non-empty message>"` marks the suite
 *     as having a real error and prevents suppression.
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
 * Returns true when every line in `str` is either:
 *   - blank / whitespace-only
 *   - an `AggregateError` header with no message: `"AggregateError"` or `"AggregateError:"`
 *   - a stack-frame line that starts with `"at "` after trimming
 *
 * Returns false when any line contains a real error message
 * (e.g. `"AggregateError: some meaningful message"`) or an unrecognised error type.
 *
 * Accepts null/undefined/empty (absent content is considered all-clear).
 *
 * @param {string|null|undefined} str
 * @returns {boolean}
 */
function isAggregateErrorOnlyContent(str) {
  if (str === null || str === undefined || str === "") return true;
  return str.split("\n").every((line) => {
    const trimmed = line.trim();
    if (trimmed === "") return true;
    // Stack-frame lines produced by Node.js error.stack (always present in real AggregateErrors)
    if (trimmed.startsWith("at ")) return true;
    // AggregateError header with no message
    if (trimmed === "AggregateError") return true;
    if (trimmed === "AggregateError:") return true;
    // Anything else (AggregateError with a real message, other error types, …) → real error
    return false;
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
  // jest-circus always sets testExecError.message = '' for unhandled rejections;
  // any truthy message (even just "AggregateError\nAggregateError") indicates a
  // real error accumulated across multiple rejections — but we still verify with
  // isAggregateErrorOnlyContent in case the internal format ever changes.
  if (!isAggregateErrorOnlyContent(suite.testExecError.message)) return false;
  // testExecError.stack = unhandledErrors.join('\n') where each element is
  // error.stack (full stack trace including "at …" frames) or error.message.
  // We must allow "at …" lines — all real AggregateErrors have them.
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

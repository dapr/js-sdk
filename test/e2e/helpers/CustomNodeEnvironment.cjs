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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const NodeEnvironment = require("jest-environment-node");

/**
 * Custom Jest test environment that installs a filter on the *real* Node.js
 * `process` object to suppress spurious empty AggregateErrors emitted by
 * testcontainers' ssh2/SubtleCrypto handles during container teardown.
 *
 * ## Why a custom environment is required
 *
 * `jest.setup.js` (configured via `setupFiles`) runs inside the VM context
 * that jest-environment-node creates.  The `process` object available in that
 * context is a **deep copy** produced by jest-util's `createProcessObject()`,
 * not the real Node.js `process`.  Modifying `process.on` in `jest.setup.js`
 * therefore has no effect on jest-circus, which always receives the *real*
 * Node.js `process` as its `parentProcess` argument.
 *
 * `environment.setup()` is called in the *outer* Node.js context — the same
 * context from which `testFramework()` (jest-circus) is invoked — so any
 * modifications made here to `process.on` are visible to jest-circus when it
 * subsequently calls `injectGlobalErrorHandlers(process)`.
 *
 * ## Mechanism
 *
 * jest-circus's `injectGlobalErrorHandlers` calls
 * `process.on('unhandledRejection', uncaught)` to install its error handler.
 * By overriding `process.on` (and its aliases) here, we ensure that the
 * handler jest-circus receives is a *wrapped* version that silently drops
 * empty-message `AggregateError`s (the signature of ssh2 SubtleCrypto GC
 * noise) while forwarding all other rejections unchanged.
 *
 * The `FILTER_FLAG` symbol guard prevents double-wrapping when multiple test
 * files share the same worker process (e.g. with `--runInBand`).
 */

function isEmptyAggregateError(reason) {
  if (reason === null || typeof reason !== "object") return false;
  return Array.isArray(reason.errors) && !reason.message;
}

function wrapUnhandledRejectionHandler(handler) {
  return function filteredUnhandledRejectionHandler(reason, promise) {
    if (!isEmptyAggregateError(reason)) {
      return Reflect.apply(handler, this, [reason, promise]);
    }
    // Suppress empty AggregateErrors silently; don't forward to jest-circus.
  };
}

const FILTER_FLAG = Symbol.for("dapr.test.unhandledRejectionFiltered");

class CustomNodeEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    // Install the filter on the REAL process.on (and its EventEmitter aliases).
    // This must run before jest-circus's jestAdapterInit calls
    // injectGlobalErrorHandlers(process), which happens inside testFramework().
    if (!process[FILTER_FLAG]) {
      process[FILTER_FLAG] = true;
      for (const method of ["on", "addListener", "prependListener", "once"]) {
        const original = process[method].bind(process);
        process[method] = function filteredProcessOn(event, listener, ...rest) {
          if (event === "unhandledRejection") {
            return original(event, wrapUnhandledRejectionHandler(listener), ...rest);
          }
          return original(event, listener, ...rest);
        };
      }
    }
  }
}

module.exports = CustomNodeEnvironment;

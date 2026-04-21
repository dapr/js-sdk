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
const { TestEnvironment: NodeEnvironment } = require("jest-environment-node");

/**
 * Custom Jest test environment that installs a filter on the process object
 * used by jest-circus to suppress spurious empty AggregateErrors emitted by
 * testcontainers' ssh2/SubtleCrypto handles during container teardown.
 *
 * ## Background
 *
 * testcontainers uses ssh2 which creates SubtleCrypto key handles at
 * module-load time.  When these handles are garbage-collected during container
 * teardown they abort their pending operations and emit unhandled promise
 * rejections in the form of empty-message AggregateErrors.  Jest-circus
 * catches these via its `unhandledRejection` listener and surfaces them as
 * "Test suite failed to run" even though every individual test passes.
 *
 * ## Why patching the real `process` doesn't help
 *
 * In Jest 27, `jest-circus/runner.js` is loaded by `runtime.requireModule()`
 * inside the VM sandbox that jest-environment-node creates.  Inside that
 * sandbox, `process` resolves to `this.global.process` — the object that
 * jest-environment-node installed when it constructed the environment — which
 * is a **copy** of the real process created by jest-util's
 * `createProcessObject()`.  That copy may have its own `on` / `addListener`
 * properties (bound to the real EventEmitter but as separate function
 * references), so patching the real `process.on` has no effect on what
 * jest-circus calls.
 *
 * `jest.setup.js` (via `setupFiles`) also runs inside the sandbox, so it
 * suffers from the same problem.
 *
 * ## Mechanism
 *
 * `environment.setup()` runs in the outer Node.js context *before*
 * `testFramework()` is invoked, and `this.global` already holds the fully
 * initialised VM sandbox global.  `this.global.process` is therefore the
 * exact object that jest-circus/runner.js will see as its module-level
 * `process` and pass as `parentProcess` to `injectGlobalErrorHandlers`.
 *
 * We patch `this.global.process.on` (and its EventEmitter aliases) here so
 * that when jest-circus subsequently calls
 * `parentProcess.on('unhandledRejection', uncaught)`, the registered handler
 * is our *wrapped* version that silently drops empty-message AggregateErrors
 * while forwarding everything else unchanged.
 *
 * We also patch the real Node.js `process` as a belt-and-suspenders measure
 * for any listeners registered outside the VM sandbox (e.g. from
 * globalSetup or from code that requires process directly).
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

function patchProcessListeners(proc) {
  if (proc[FILTER_FLAG]) return; // already patched
  proc[FILTER_FLAG] = true;
  for (const method of ["on", "addListener", "prependListener", "once"]) {
    // Resolve the function to call — may be own property or inherited.
    const fn = proc[method];
    if (typeof fn !== "function") continue;
    const original = fn.bind(proc);
    proc[method] = function filteredProcessOn(event, listener, ...rest) {
      if (event === "unhandledRejection") {
        return original(event, wrapUnhandledRejectionHandler(listener), ...rest);
      }
      return original(event, listener, ...rest);
    };
  }
}

class CustomNodeEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    // Patch the process object that jest-circus will use as parentProcess.
    // In Jest 27's VM sandbox, this.global.process is the object injected by
    // jest-environment-node (potentially a createProcessObject() copy), which
    // is the exact object that jest-circus/runner.js sees as its module-level
    // `process` variable when loaded via runtime.requireModule().
    patchProcessListeners(this.global.process);

    // Also patch the real Node.js process as a belt-and-suspenders measure.
    patchProcessListeners(process);
  }
}

module.exports = CustomNodeEnvironment;

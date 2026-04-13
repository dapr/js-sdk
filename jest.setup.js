/*
Copyright 2022 The Dapr Authors
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
 * Jest 27's jest-environment-node runs tests in a sandboxed VM context that
 * does NOT automatically expose Web API globals (Blob, fetch, ReadableStream,
 * AbortController, etc.) that Node.js 18+ added to the real globalThis.
 * testcontainers → undici references these at module-load time, so we must
 * inject them (via setupFiles) before any test module is imported.
 *
 * Strategy: `require('buffer').Buffer` is a built-in object created in the
 * OUTER (non-sandboxed) Node.js realm.  Its `.constructor` property is the
 * outer realm's `Function` constructor.  Calling that constructor with the
 * string `'return globalThis'` produces a function that, when invoked, returns
 * the outer Node.js `globalThis` — which has all the Web API globals we need.
 * We then copy each one into Jest's sandboxed `global` object.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { Buffer: _Buffer } = require("buffer");
/* eslint-enable @typescript-eslint/no-require-imports */

// Reach the outer Node.js globalThis through the built-in realm's Function.
const outerGlobal = _Buffer.constructor("return globalThis")();

const webApiNames = [
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "Blob",
  "File",
  "URL",
  "URLSearchParams",
  "TextEncoder",
  "TextDecoder",
  "fetch",
  "Headers",
  "Request",
  "Response",
  "FormData",
  "AbortController",
  "AbortSignal",
  "Event",
  "EventTarget",
  "CustomEvent",
  "MessageChannel",
  "MessagePort",
  "MessageEvent",
  "crypto",
  "performance",
];

for (const name of webApiNames) {
  const outerVal = outerGlobal[name];
  if (typeof outerVal !== "undefined" && typeof global[name] === "undefined") {
    global[name] = outerVal;
  }
}

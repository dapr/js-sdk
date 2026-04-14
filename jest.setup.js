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
 * does NOT automatically expose all Web API globals (ReadableStream, fetch,
 * Blob, DOMException, etc.) that Node.js 18+ added to the real globalThis.
 * testcontainers → undici references these at module-load time, so we must
 * inject them (via setupFiles) before any test module is imported.
 *
 * NOTE: jest-environment-node v27 already injects URL, URLSearchParams,
 * TextEncoder, TextDecoder, AbortController, AbortSignal, Event, EventTarget,
 * performance, Buffer, ArrayBuffer, and Uint8Array, so we skip those.
 *
 * Strategy: use require() against Node's built-in modules (stream/web, buffer,
 * url, worker_threads, crypto, perf_hooks) and against the locally-installed
 * undici package to get every remaining Web API.  We do NOT use the
 * "outer-realm globalThis escape" trick (Buffer.constructor('return globalThis')())
 * because in Node 24 that technique crashes the process with an assertion failure
 * (isolate_data not set) when any property is read from the returned proxy.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const streamWeb = require("stream/web");
const { Blob, File } = require("buffer");
const { MessageChannel, MessagePort, BroadcastChannel } = require("worker_threads");
const { webcrypto } = require("crypto");

// ── stream/web ──────────────────────────────────────────────────────────────
// These MUST be set before requiring undici, which references ReadableStream
// at module-load time.
const streamWebNames = [
  "ReadableStream",
  "ReadableStreamDefaultController",
  "ReadableStreamDefaultReader",
  "ReadableByteStreamController",
  "ReadableStreamBYOBReader",
  "ReadableStreamBYOBRequest",
  "WritableStream",
  "WritableStreamDefaultController",
  "WritableStreamDefaultWriter",
  "TransformStream",
  "TransformStreamDefaultController",
  "ByteLengthQueuingStrategy",
  "CountQueuingStrategy",
  "TextEncoderStream",
  "TextDecoderStream",
  "CompressionStream",
  "DecompressionStream",
];

for (const name of streamWebNames) {
  if (typeof global[name] === "undefined" && streamWeb[name] !== undefined) {
    global[name] = streamWeb[name];
  }
}

// ── buffer (before undici) ────────────────────────────────────────────────────
if (typeof global.Blob === "undefined") global.Blob = Blob;
if (typeof global.File === "undefined") global.File = File;

// ── worker_threads (before undici) ───────────────────────────────────────────
if (typeof global.MessageChannel === "undefined") global.MessageChannel = MessageChannel;
if (typeof global.MessagePort === "undefined") global.MessagePort = MessagePort;
if (typeof global.BroadcastChannel === "undefined") global.BroadcastChannel = BroadcastChannel;

// ── crypto (before undici) ────────────────────────────────────────────────────
if (typeof global.crypto === "undefined") global.crypto = webcrypto;

// ── DOMException (before undici) ─────────────────────────────────────────────
// DOMException is not exported by any Node.js built-in module.  Provide a
// minimal standards-compliant shim so that undici's WebSocket implementation
// (which uses `class X extends DOMException`) can load without crashing.
if (typeof global.DOMException === "undefined") {
  class DOMException extends Error {
    constructor(message = "", name = "Error") {
      super(message);
      this.name = name;
    }
  }
  global.DOMException = DOMException;
}

// Now it is safe to require undici — all required globals are defined.
const undici = require("undici");
/* eslint-enable @typescript-eslint/no-require-imports */

// ── undici (fetch API + WebSocket) ───────────────────────────────────────────
const undiciGlobals = ["fetch", "Headers", "Request", "Response", "FormData", "WebSocket", "CloseEvent", "MessageEvent"];
for (const name of undiciGlobals) {
  if (typeof global[name] === "undefined" && undici[name] !== undefined) {
    global[name] = undici[name];
  }
}

// ── Suppress empty AggregateErrors from testcontainers/ssh2 GC ───────────────
// testcontainers uses ssh2 which creates SubtleCrypto handles.  When those
// handles are abruptly terminated during Jest's --forceExit shutdown or during
// container teardown in afterAll, Node.js fires empty AggregateError unhandled
// rejections.  Jest's circus runner captures those via
// process.on('unhandledRejection') and reports them as "Test suite failed to
// run" — even though every individual test passed.
//
// In Node.js 22+, the unhandledRejection event is dispatched using primordials
// (the original process.emit captured at Node.js startup), which bypasses any
// user-space override of process.emit.  Overriding process.emit therefore has
// no effect on the internal dispatch path.
//
// Instead, we intercept process.on / addListener / prependListener / once so
// that any 'unhandledRejection' handler that is subsequently registered (e.g.
// by jest-circus's jestAdapterInit, which runs after setupFiles) is silently
// wrapped with a filter.  The wrapper drops empty-message AggregateErrors and
// forwards everything else to the original handler unchanged.
//
// setupFiles runs before jest-circus initialises its test infrastructure, so
// our process.on override is already in place when jest-circus calls
// process.on('unhandledRejection', ...).

function isEmptyAggregateError(reason) {
  if (reason === null || typeof reason !== "object") return false;
  return Array.isArray(reason.errors) && !reason.message;
}

function wrapUnhandledRejectionHandler(handler) {
  return function filteredUnhandledRejectionHandler(reason, promise) {
    if (!isEmptyAggregateError(reason)) {
      return Reflect.apply(handler, this, [reason, promise]);
    }
  };
}

// Guard against double-wrapping when setupFiles runs once per test file in the
// same --runInBand process (the process object is shared across all test files).
if (!process["_daprTestUnhandledRejectionFiltered"]) {
  process["_daprTestUnhandledRejectionFiltered"] = true;
  ["on", "addListener", "prependListener", "once"].forEach(function (method) {
    const original = process[method];
    process[method] = function (event, listener) {
      const extraArgs = Array.prototype.slice.call(arguments, 2);
      if (event === "unhandledRejection") {
        return original.apply(this, [event, wrapUnhandledRejectionHandler(listener)].concat(extraArgs));
      }
      return original.apply(this, arguments);
    };
  });
}

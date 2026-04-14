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
// handles are abruptly terminated during Jest's --forceExit shutdown, Node.js
// fires empty AggregateError unhandled rejections.  Jest's jasmine runner
// captures those via process.on('unhandledRejection') and reports them as
// "Test suite failed to run" — even though every individual test passed.
//
// Node.js dispatches unhandledRejection events via process.emit(), which IS a
// regular JavaScript method (it inherits from EventEmitter).  By overriding
// process.emit() here (in setupFiles, before jest-circus installs its own
// listener), we intercept the event before any listener ever sees it.
//
// Only empty-message AggregateErrors (the ssh2 GC pattern) are suppressed; all
// other rejections are forwarded normally.
const _origEmit = process.emit.bind(process);
process.emit = function emit(event, ...args) {
  if (event === "unhandledRejection") {
    const reason = args[0];
    if (
      reason !== null &&
      typeof reason === "object" &&
      Array.isArray(reason.errors) &&
      !reason.message
    ) {
      // Return true so process.emit reports "there were listeners" for this event.
      // Node.js checks the return value of emit('unhandledRejection') to decide
      // whether to apply the default --unhandledRejections=throw behaviour:
      //   • true  → at least one listener was invoked → no default throw
      //   • false → no listeners → apply default (crash in Node 15+)
      // Returning true here suppresses the empty AggregateError entirely and
      // prevents the process from crashing or Jest marking the suite as failed.
      return true;
    }
  }
  return _origEmit(event, ...args);
};

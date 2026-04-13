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
 * Jest 27's jest-environment-node does not automatically expose Web API
 * globals (ReadableStream, Blob, URL, fetch, etc.) that Node.js 18+ added to
 * globalThis into the sandboxed VM context.  testcontainers → undici
 * references many of these at module-load time, so we must assign them here
 * (via setupFiles) before any test module is imported.
 */

// Web Streams API (node:stream/web)
const { ReadableStream, WritableStream, TransformStream } = require("stream/web");

const webGlobals = {
  // Streams
  ReadableStream,
  WritableStream,
  TransformStream,
  // Encoding
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder,
  // URL
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams,
  // Blob / File
  Blob: globalThis.Blob,
  File: globalThis.File,
  // Fetch API
  fetch: globalThis.fetch,
  Headers: globalThis.Headers,
  Request: globalThis.Request,
  Response: globalThis.Response,
  FormData: globalThis.FormData,
  // Abort
  AbortController: globalThis.AbortController,
  AbortSignal: globalThis.AbortSignal,
  // Events
  Event: globalThis.Event,
  EventTarget: globalThis.EventTarget,
  CustomEvent: globalThis.CustomEvent,
  MessageChannel: globalThis.MessageChannel,
  MessageEvent: globalThis.MessageEvent,
  MessagePort: globalThis.MessagePort,
};

for (const [name, value] of Object.entries(webGlobals)) {
  if (value !== undefined && typeof global[name] === "undefined") {
    global[name] = value;
  }
}

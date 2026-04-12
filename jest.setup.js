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
 * globals (ReadableStream, WritableStream, TransformStream) that were added
 * to Node.js 18+ into the sandboxed VM context.  testcontainers → undici
 * references these at module-load time, so we must assign them here
 * (via setupFiles) before any test module is imported.
 */
const { ReadableStream, WritableStream, TransformStream } = require("stream/web");

if (typeof global.ReadableStream === "undefined") {
  global.ReadableStream = ReadableStream;
}
if (typeof global.WritableStream === "undefined") {
  global.WritableStream = WritableStream;
}
if (typeof global.TransformStream === "undefined") {
  global.TransformStream = TransformStream;
}

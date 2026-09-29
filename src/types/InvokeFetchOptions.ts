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
 * HTTP fetch options for making HTTP-based service invocations.
 *
 * Internal use type that specifies the low-level HTTP request details (method, headers, body)
 * when the SDK invokes another service via HTTP. These are typically constructed internally
 * by the SDK based on higher-level invoke options.
 *
 * @internal
 */
export type InvokeFetchOptions = {
  /**
   * The HTTP method for the request (e.g., "GET", "POST", "PUT", "DELETE").
   * Determines the type of operation to perform on the target service.
   */
  method: string;

  /**
   * HTTP headers to include in the request.
   * Standard headers (content-type, authorization, etc.) and custom headers.
   *
   * @example
   * ```typescript
   * {
   *   "content-type": "application/json",
   *   "x-correlation-id": "req-123",
   *   "authorization": "Bearer token"
   * }
   * ```
   */
  headers: object;

  /**
   * Optional request body as a Buffer.
   * For GET/DELETE requests, typically omitted.
   * For POST/PUT requests, contains the serialized request payload.
   */
  body?: Buffer;
};

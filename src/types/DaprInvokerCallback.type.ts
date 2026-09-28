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

import { KeyValueType } from "./KeyValue.type";

/**
 * Metadata associated with a service invocation request/response.
 *
 * Provides optional content type information for invocation payloads.
 */
export interface DaprInvokerCallbackContentMetadata {
  /**
   * The MIME type of the request body content (e.g., "application/json", "text/plain").
   * Helps the handler understand how to parse or process the incoming data.
   */
  contentType?: string;
}

/**
 * Request content received during a service invocation callback.
 *
 * Contains the request body, query parameters, headers, and metadata from the
 * service invocation performed on this service.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/service-invocation/ | Dapr Service Invocation}
 */
export interface DaprInvokerCallbackContent {
  /**
   * The request body as a string.
   * Parse according to the contentType metadata to get the actual data.
   * For HTTP with gRPC backend, this is the request body.
   * For gRPC with gRPC backend, this is the serialized request message.
   */
  body?: string;

  /**
   * Query parameters or path arguments from the invocation.
   * In HTTP, this represents the HTTP query string (e.g., "?param1=value1&param2=value2").
   * In gRPC, this represents query parameters extracted from the gRPC request metadata.
   */
  query?: string;

  /**
   * Metadata related to the invocation request, including content type information.
   * Use contentType to deserialize the body appropriately.
   */
  metadata?: DaprInvokerCallbackContentMetadata;

  /**
   * HTTP headers from the incoming request.
   * Includes standard HTTP headers like "content-type", "authorization", etc.
   * Ignored when using the gRPC communication protocol exclusively.
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
  headers?: KeyValueType;
}

/**
 * Callback function signature for handling service invocation requests.
 *
 * This callback is invoked when another service calls a method on this service via Dapr.
 * The handler receives the invocation details including body, query parameters, headers, and metadata.
 * The handler must process the request asynchronously and can return a response (which will be
 * sent back to the caller) or void (which results in a 200 OK with no body).
 *
 * @param data - The invocation request content including body, query, headers, and metadata.
 * @returns Promise that resolves to the response to send back to the caller, or void for no-content responses.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/service-invocation/ | Dapr Service Invocation}
 *
 * @example
 * ```typescript
 * // Service method handler
 * const processOrderHandler: DaprInvokerCallbackFunction = async (content) => {
 *   const order = JSON.parse(content.body || '{}');
 *   const queryParams = new URLSearchParams(content.query);
 *   const correlationId = content.headers?.['x-correlation-id'];
 *
 *   const result = await validateAndProcessOrder(order, correlationId);
 *   return { orderId: result.id, status: result.status };
 * };
 *
 * // Register with server
 * server.invoker.handle("ProcessOrder", processOrderHandler);
 * ```
 */
export type DaprInvokerCallbackFunction = (data: DaprInvokerCallbackContent) => Promise<any | void>;

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

import { HttpMethod } from "../enum/HttpMethod.enum";

/**
 * Configuration options for listening to service invocation requests.
 *
 * Used when registering HTTP method handlers on the Dapr server to specify
 * which HTTP methods are allowed for the handler. When omitted, the handler
 * typically responds to all HTTP methods or defaults to the framework's default.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/service-invocation/ | Dapr Service Invocation}
 *
 * @example
 * ```typescript
 * // Handler for POST requests only
 * server.invoker.handle(
 *   "CreateOrder",
 *   createOrderHandler,
 *   { method: HttpMethod.POST }
 * );
 *
 * // Handler for GET requests only
 * server.invoker.handle(
 *   "GetOrderDetails",
 *   getOrderHandler,
 *   { method: HttpMethod.GET }
 * );
 * ```
 */
export type InvokerListenOptionsType = {
  /**
   * The HTTP method(s) that this handler accepts.
   * When specified, the handler only responds to requests using this method.
   * Common values: GET, POST, PUT, DELETE, PATCH.
   * When omitted, the handler may respond to any method or use framework defaults.
   *
   * @example
   * ```typescript
   * method: HttpMethod.POST
   * method: HttpMethod.GET
   * ```
   */
  method?: HttpMethod;
};

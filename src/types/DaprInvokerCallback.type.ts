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

export interface DaprInvokerCallbackContentMetadata {
  contentType?: string;
}

export interface DaprInvokerCallbackContent {
  /**
   * The body of invocation request from the response.
   */
  body?: string;

  /**
   * In HTTP, this represents the HTTP URL of the request.
   * In gRPC, this represents the HTTP querystring from the gRPC request.
   */
  query?: string;

  /**
   * Metadata related to the invocation request.
   */
  metadata?: DaprInvokerCallbackContentMetadata;

  /**
   * HTTP headers from the response.
   * Note, this is ignored when using the gRPC protocol.
   */
  headers?: KeyValueType;
}

export type DaprInvokerCallbackFunction = (data: DaprInvokerCallbackContent) => Promise<any | void>;

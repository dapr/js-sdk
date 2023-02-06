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

import { CloudEvent } from "cloudevents";
import { TextDecoder } from "util";

function tryParseJson(data: any): object | string {
  // Check if the data is a Uint8Array, then we decode it first
  if (data instanceof Uint8Array) {
    data = new TextDecoder().decode(data);
  }

  // Now try to parse the data, if it fails return the original data
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

export function deserializeGrpc(contentType: string, data: string | Uint8Array): CloudEvent | any | unknown {
  switch (contentType) {
    case "application/json":
      return tryParseJson(data) as any;
    case "application/cloudevents+json":
      return tryParseJson(data) as CloudEvent;
    case "application/octet-stream":
      return data;
    case "text/plain":
    default:
      // By default, try parsing as JSON, this will resolve objects, arrays, strings, numbers, booleans, ...
      return tryParseJson(data.toString());
  }
}

export function deserializeHttp(contentType: string, data: any): CloudEvent | any | unknown {
  switch (contentType) {
    case "application/json":
      return tryParseJson(data) as any;
    case "application/cloudevents+json":
      return tryParseJson(data) as CloudEvent;
    case "application/octet-stream":
      return Buffer.from(data);
    case "text/plain":
    default:
      // By default, try parsing as JSON, this will resolve objects, arrays, strings, numbers, booleans, ...
      return tryParseJson(data.toString());
  }
}

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

import { getContentType } from "./Client.util";
import { BodyInit } from "node-fetch";

export function serializeGrpc(data: any): { serializedData: Buffer; contentType: string } {
  let serializedData: Buffer = data;

  const contentType = getContentType(data);

  switch (contentType) {
    case "application/json":
    case "application/cloudevents+json":
      serializedData = Buffer.from(JSON.stringify(data));
      break;
    case "text/plain":
      serializedData = Buffer.from(data.toString());
      break;
    case "application/octet-stream":
    default:
      serializedData = Buffer.from(data);
      break;
  }

  return { serializedData, contentType };
}

export function serializeHttp(data: any): {
  // https://developer.mozilla.org/en-US/docs/Web/API/fetch#body
  serializedData: BodyInit;
  contentType: string;
} {
  let serializedData: BodyInit;

  const contentType = getContentType(data);

  switch (contentType) {
    case "application/json":
    case "application/cloudevents+json":
      serializedData = JSON.stringify(data);
      break;
    case "text/plain":
      serializedData = data.toString();
      break;
    case "application/octet-stream":
    default:
      serializedData = data;
      break;
  }

  return { serializedData, contentType };
}

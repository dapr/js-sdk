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

export function serializeGrpc(data: any): { serializedData: Buffer; contentType: string } {
  let serializedData = data;
  let contentType = "application/octet-stream";
  if (!(data instanceof Buffer)) {
    contentType = getContentType(data);
    if (contentType === "text/plain") {
      serializedData = Buffer.from(data, "utf-8");
    } else {
      serializedData = Buffer.from(JSON.stringify(data), "utf-8");
    }
  }

  return { serializedData, contentType };
}

/**
 * Serialize data for HTTP requests.
 * If data is a string, it is returned as is.
 * If data is an object, it is serialized as JSON.
 * @param data input data to be serialized
 * @returns serialized data and content type
 */
export function serializeHttp(data: any): { serializedData: string; contentType: string } {
  const contentType = getContentType(data);
  if (contentType === "text/plain") {
    return { serializedData: data, contentType };
  } else {
    return { serializedData: JSON.stringify(data), contentType };
  }
}

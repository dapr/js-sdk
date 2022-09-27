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

export function serializeGrpc(data: any): { serializedData: Buffer, contentType: string } {
  let serializedData = data;
  let contentType = "application/octet-stream";

  // check if the data type is a typed array
  // if so, we use application/octet-stream as this means data is Uint8Array, ...
  const type = getType(data);

  if (type) {
    contentType = "application/octet-stream";
    serializedData = Buffer.from(data, "utf-8");;
  } else if (data instanceof Buffer) {
    contentType = "application/octet-stream";
    serializedData = data;
  } else {
    contentType = "application/json";
    serializedData = Buffer.from(JSON.stringify(data), "utf-8");
  }

  return { serializedData, contentType };
}

function getType(arr: any) {
  return isTypedArray(arr) && arr.constructor.name;
}

function isTypedArray(arr: any) {
  return ArrayBuffer.isView(arr) && !(arr instanceof DataView);
}
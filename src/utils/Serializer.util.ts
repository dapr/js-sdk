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

export function serializeGrpc(data: any): {serializedData: Buffer, contentType: string} {
    let serializedData = data;
    let contentType = "application/octet-stream";
    if (!(data instanceof Buffer)) {
        serializedData = Buffer.from(JSON.stringify(data), "utf-8");
        contentType = "application/json";
    }

    return {serializedData, contentType};
}
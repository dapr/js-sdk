/*
Copyright 2026 The Dapr Authors
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

import { IDaprSerializer } from "./IDaprSerializer";

export class JsonSerializer implements IDaprSerializer {
  readonly contentType = "application/json";

  serialize<T>(value: T): string {
    const data = JSON.stringify(value);
    if (data === undefined) {
      throw new TypeError("Value cannot be serialized as JSON");
    }
    return data;
  }

  deserialize<T = unknown>(data: string): T {
    return JSON.parse(data);
  }
}

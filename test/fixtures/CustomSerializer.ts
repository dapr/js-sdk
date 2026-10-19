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

import type { IDaprSerializer } from "../../src";

/** Non-JSON wire format with bigint round-tripping, shared by unit and integration tests. */
export class CustomSerializer implements IDaprSerializer {
  readonly contentType: string = "text/plain";

  serialize<T>(value: T): string {
    const data = JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? { $bigint: item.toString() } : item,
    );
    if (data === undefined) throw new TypeError("Unsupported value");
    return `custom:${Buffer.from(data).toString("base64")}`;
  }

  deserialize<T = unknown>(data: string): T {
    if (!data.startsWith("custom:")) throw new Error("Invalid custom payload");
    return JSON.parse(Buffer.from(data.slice(7), "base64").toString(), (_key, item) =>
      item && typeof item === "object" && "$bigint" in item ? BigInt(item.$bigint) : item,
    );
  }
}

export class CustomJsonSerializer implements IDaprSerializer {
  readonly contentType = "application/json";
  private readonly inner = new CustomSerializer();

  serialize<T>(value: T): string {
    return JSON.stringify({ payload: this.inner.serialize(value) });
  }

  deserialize<T = unknown>(data: string): T {
    return this.inner.deserialize<T>(JSON.parse(data).payload);
  }
}

export class CustomBinarySerializer extends CustomSerializer {
  readonly contentType = "application/octet-stream";
}

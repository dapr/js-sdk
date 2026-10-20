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

export interface PayloadStage {
  readonly name: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Versioned, serializer-independent wire contract shared with Dapr.Workflow for .NET. */
export class PayloadReference<T = unknown> {
  static readonly sentinelProperty = "$daprRef";
  static readonly currentVersion = 1;
  private declare readonly payloadType: T;
  readonly stages: readonly PayloadStage[];

  constructor(
    readonly storeName: string,
    readonly key: string,
    readonly size: number,
    readonly contentHash: string,
    stages: readonly PayloadStage[] = [],
    readonly version = PayloadReference.currentVersion,
  ) {
    if (version !== PayloadReference.currentVersion) {
      throw new TypeError(`Workflow payload reference version ${version} is not supported`);
    }
    if (
      typeof storeName !== "string" ||
      !storeName.trim() ||
      typeof key !== "string" ||
      !key.trim() ||
      !Number.isSafeInteger(size) ||
      size < 0 ||
      typeof contentHash !== "string" ||
      !/^[0-9a-f]{64}$/.test(contentHash)
    ) {
      throw new TypeError("Invalid workflow payload reference envelope");
    }
    this.stages = Object.freeze(
      stages.map((stage) => {
        if (
          !stage ||
          typeof stage.name !== "string" ||
          !stage.name.trim() ||
          (stage.metadata !== undefined &&
            (!isRecord(stage.metadata) || Object.values(stage.metadata).some((value) => typeof value !== "string")))
        ) {
          throw new TypeError("Invalid workflow payload reference stage");
        }
        return Object.freeze({
          name: stage.name,
          ...(stage.metadata === undefined ? {} : { metadata: Object.freeze({ ...stage.metadata }) }),
        });
      }),
    );
    Object.freeze(this);
  }

  asTyped<U>(): PayloadReference<U> {
    return new PayloadReference<U>(this.storeName, this.key, this.size, this.contentHash, this.stages, this.version);
  }

  toJSON() {
    return {
      $daprRef: {
        v: this.version,
        store: this.storeName,
        key: this.key,
        size: this.size,
        sha256: this.contentHash,
        ...(this.stages.length
          ? {
              stages: this.stages.map((stage) => ({
                n: stage.name,
                ...(stage.metadata === undefined ? {} : { m: stage.metadata }),
              })),
            }
          : {}),
      },
    };
  }

  toEnvelope(): string {
    return JSON.stringify(this.toJSON());
  }

  /** Returns undefined for ordinary payloads; malformed or unsupported reserved envelopes throw. */
  static parse<T = unknown>(wire?: string): PayloadReference<T> | undefined {
    if (!wire?.trimStart().startsWith("{")) return undefined;
    let value: unknown;
    try {
      value = JSON.parse(wire);
    } catch (error) {
      if (wire.includes(PayloadReference.sentinelProperty)) throw error;
      return undefined; // Non-JSON serializers may use an opening brace.
    }
    if (!isRecord(value) || Object.keys(value).length !== 1 || !("$daprRef" in value)) return undefined;
    const body = value.$daprRef;
    if (
      !isRecord(body) ||
      typeof body.v !== "number" ||
      typeof body.store !== "string" ||
      typeof body.key !== "string" ||
      typeof body.size !== "number" ||
      typeof body.sha256 !== "string" ||
      (body.stages != null && !Array.isArray(body.stages))
    ) {
      throw new TypeError("Invalid workflow payload reference envelope");
    }
    const stages = (body.stages ?? []) as unknown[];
    return new PayloadReference<T>(
      body.store,
      body.key,
      body.size,
      body.sha256,
      stages.map((stage) => {
        if (
          !isRecord(stage) ||
          typeof stage.n !== "string" ||
          (stage.m != null && (!isRecord(stage.m) || Object.values(stage.m).some((item) => typeof item !== "string")))
        ) {
          throw new TypeError("Invalid workflow payload reference stage");
        }
        return { name: stage.n, metadata: stage.m == null ? undefined : (stage.m as Record<string, string>) };
      }),
      body.v,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

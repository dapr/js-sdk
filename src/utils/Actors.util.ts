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

import { ActorRuntimeOptions } from "../types/actors/ActorRuntimeOptions";
import { KeyValueType } from "../types/KeyValue.type";
import { Temporal } from "@js-temporal/polyfill";
import { ActorReminderType } from "../types/ActorReminder.type";

/**
 * Get response object for /dapr/config API call.
 * See https://docs.dapr.io/reference/api/actors_api/#get-registered-actors
 */
export function getRegisteredActorResponse(entities: string[], options: ActorRuntimeOptions): KeyValueType {
  return {
    entities: entities,
    ...options,
  };
}

/** Normalizes the HTTP and gRPC reminder timing fields returned by the sidecar. */
export function parseActorReminder(response: unknown): ActorReminderType {
  if (typeof response !== "object" || response === null || Array.isArray(response)) {
    throw new TypeError("Invalid actor reminder response: expected an object");
  }
  const now = Temporal.Now.instant();
  return {
    dueTime: parseReminderDuration("dueTime" in response ? response.dueTime : undefined, now),
    period: parseReminderDuration("period" in response ? response.period : undefined),
    ttl: parseReminderDuration("ttl" in response ? response.ttl : undefined, now),
    data: "data" in response ? response.data : undefined,
  };
}

function parseReminderDuration(input: unknown, relativeTo?: Temporal.Instant): Temporal.Duration | undefined {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }
  if (typeof input !== "string") {
    throw new TypeError("Invalid actor reminder duration: expected a string");
  }
  const value = relativeTo === undefined ? input.replace(/^@every /, "") : input;
  if (relativeTo !== undefined && /^\d{4}-/.test(value)) {
    return Temporal.Instant.from(value).since(relativeTo);
  }
  if (/^[+-]?P/.test(value)) {
    return Temporal.Duration.from(value);
  }
  if (/^[+-]?0$/.test(value)) {
    return Temporal.Duration.from({ seconds: 0 });
  }

  // Dapr also returns Go durations, including subsecond units not accepted by Temporal.
  const units: Record<string, bigint> = {
    h: 3_600_000_000_000n,
    m: 60_000_000_000n,
    s: 1_000_000_000n,
    ms: 1_000_000n,
    us: 1_000n,
    "\u00b5s": 1_000n,
    "\u03bcs": 1_000n,
    ns: 1n,
  };
  const duration = value.replace(/^[+-]/, "");
  const token = /(\d+(?:\.\d*)?|\.\d+)(ns|us|\u00b5s|\u03bcs|ms|s|m|h)/gy;
  let offset = 0;
  let nanoseconds = 0n;
  while (offset < duration.length) {
    const match = token.exec(duration);
    if (match === null) {
      throw new RangeError(`Actor reminder duration cannot be represented as Temporal.Duration: ${value}`);
    }
    const [whole, fraction = ""] = match[1].split(".");
    const scale = 10n ** BigInt(fraction.length);
    nanoseconds += (BigInt(`${whole || "0"}${fraction}`) * units[match[2]]) / scale;
    offset = token.lastIndex;
  }
  if (offset === 0) {
    throw new RangeError(`Invalid actor reminder duration: ${value}`);
  }
  nanoseconds *= value.startsWith("-") ? -1n : 1n;
  const seconds = Number(nanoseconds / 1_000_000_000n);
  if (!Number.isSafeInteger(seconds)) {
    throw new RangeError(`Actor reminder duration exceeds safe integer precision: ${value}`);
  }
  return Temporal.Duration.from({
    seconds,
    nanoseconds: Number(nanoseconds % 1_000_000_000n),
  });
}

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

import { AsyncLocalStorage } from "node:async_hooks";

const baggageContext = new AsyncLocalStorage<ReadonlyMap<string, string>>();
const invalidBaggageKeyPattern = /[^!#$%&'*+\-.^_`|~0-9a-zA-Z]/;

/**
 * Runs a callback with W3C baggage attached to outgoing DaprClient HTTP and gRPC requests.
 * Baggage is inherited by asynchronous work started in the callback, not by unrelated requests.
 * Nested calls merge entries, with inner values overriding matching outer keys.
 * Explicit request baggage headers take precedence over this context.
 *
 * @param entries - Baggage keys (HTTP tokens) and unencoded string values.
 * @param callback - Work to run with the baggage context.
 * @returns The callback's result, including its promise when asynchronous.
 * @throws {TypeError} If a key is invalid or a value is not a string.
 * @throws {URIError} If a value contains malformed Unicode.
 */
export function withBaggage<T>(entries: Readonly<Record<string, string>>, callback: () => T): T {
  const baggage = new Map(baggageContext.getStore());
  for (const [key, value] of Object.entries(entries)) {
    if (key.length === 0 || invalidBaggageKeyPattern.test(key)) {
      throw new TypeError(`Invalid baggage key: ${key}`);
    }
    if (typeof value !== "string") {
      throw new TypeError(`Baggage value for ${key} must be a string`);
    }
    baggage.set(key, encodeURIComponent(value));
  }
  return baggageContext.run(baggage, callback);
}

/** @internal */
export function getBaggageHeader(): string | undefined {
  const baggage = baggageContext.getStore();
  if (!baggage?.size) {
    return undefined;
  }
  return Array.from(baggage, ([key, value]) => `${key}=${value}`).join(",");
}

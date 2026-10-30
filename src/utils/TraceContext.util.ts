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
import {
  Context,
  context,
  defaultTextMapGetter,
  defaultTextMapSetter,
  isSpanContextValid,
  ROOT_CONTEXT,
  trace,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

const traceContext = new AsyncLocalStorage<Context>();
const propagator = new W3CTraceContextPropagator();

/**
 * Runs work with an incoming W3C trace context attached to outgoing Dapr HTTP and gRPC calls.
 * Accepts incoming HTTP headers or CloudEvent traceparent/tracestate attributes.
 * Missing or invalid traceparent values start an empty scope. No span is created.
 * Asynchronous work inherits the scope; nested calls replace it and restore the outer context.
 * Explicit outgoing traceparent headers take precedence over both inherited trace headers.
 * If an OpenTelemetry context manager is configured, this also activates the incoming context
 * and propagates active child spans created within the callback.
 *
 * @example
 * await withTraceContext(incomingHeaders, () => client.pubsub.publish("pubsub", "topic", data));
 *
 * @param headers - Incoming trace headers; names are case-insensitive.
 * @param callback - Work to execute with the extracted trace context.
 * @returns The callback's result, including its promise when asynchronous.
 */
export function withTraceContext<T>(
  headers: Readonly<Record<string, string | string[] | undefined>>,
  callback: () => T,
): T {
  const carrier = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  const extracted = propagator.extract(ROOT_CONTEXT, carrier, defaultTextMapGetter);
  return context.with(extracted, () => traceContext.run(extracted, callback));
}

/** @internal */
export function getTraceContextHeaders(): Record<string, string> {
  const stored = traceContext.getStore();
  if (!stored) {
    return {};
  }
  const active = context.active();
  const span = trace.getSpanContext(active);
  const headers: Record<string, string> = {};
  propagator.inject(span && isSpanContextValid(span) ? active : stored, headers, defaultTextMapSetter);
  return headers;
}

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

import { create } from "@bufbuild/protobuf";
import {
  context,
  defaultTextMapGetter,
  defaultTextMapSetter,
  ROOT_CONTEXT,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { TraceContextSchema, type TraceContext } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import type { HistoryEvent } from "../../../proto/dapr/proto/durabletask/v1/history_events_pb";

const propagator = new W3CTraceContextPropagator();

export function getWorkflowTraceContext(): TraceContext | undefined {
  const carrier: Record<string, string> = {};
  propagator.inject(context.active(), carrier, defaultTextMapSetter);
  return carrier.traceparent
    ? create(TraceContextSchema, { traceParent: carrier.traceparent, traceState: carrier.tracestate })
    : undefined;
}

function extractTraceContext(parent?: TraceContext) {
  // A work item must never inherit the worker stream's ambient context.
  return propagator.extract(
    ROOT_CONTEXT,
    { traceparent: parent?.traceParent, tracestate: parent?.traceState },
    defaultTextMapGetter,
  );
}

export function getOrchestrationTraceContext(events: HistoryEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i].eventType;
    if (event.case === "executionStarted") {
      return extractTraceContext(event.value.parentTraceContext);
    }
  }
  return ROOT_CONTEXT;
}

export async function runWithActivityTrace<T>(
  name: string,
  parent: TraceContext | undefined,
  execute: () => Promise<T>,
): Promise<T> {
  const parentContext = extractTraceContext(parent);
  if (!trace.getSpanContext(parentContext)) {
    return context.with(parentContext, execute);
  }

  return trace
    .getTracer("Dapr.Workflow")
    .startActiveSpan(`WorkflowActivity ${name}`, {}, parentContext, async (span) => {
      try {
        return await execute();
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : String(error) });
        span.recordException(error instanceof Error ? error : String(error));
        throw error;
      } finally {
        span.end();
      }
    });
}

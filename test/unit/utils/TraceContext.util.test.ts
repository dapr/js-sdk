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

import { context, ROOT_CONTEXT, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { getTraceContextHeaders, withTraceContext } from "../../../src/utils/TraceContext.util";

const parent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
const other = "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-00";

describe("trace context", () => {
  it("extracts case-insensitive incoming headers without modifying them", async () => {
    const headers = Object.freeze({ Traceparent: parent, Tracestate: "vendor=value", extra: "ignored" });
    const result = await withTraceContext(headers, async () => {
      await Promise.resolve();
      expect(getTraceContextHeaders()).toEqual({ traceparent: parent, tracestate: "vendor=value" });
      return 42;
    });
    expect(result).toBe(42);
    expect(headers).not.toHaveProperty("traceparent");
    expect(getTraceContextHeaders()).toEqual({});
  });

  it("accepts Node incoming header arrays", () => {
    withTraceContext({ traceparent: [parent], tracestate: ["a=1", "b=2"] }, () => {
      expect(getTraceContextHeaders()).toEqual({ traceparent: parent, tracestate: "a=1,b=2" });
    });
  });

  it.each([
    undefined,
    "",
    "invalid",
    "00-00000000000000000000000000000000-00f067aa0ba902b7-01",
    "00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01",
  ])("ignores missing or invalid traceparent %s", (traceparent) => {
    withTraceContext({ traceparent, tracestate: "vendor=value" }, () => expect(getTraceContextHeaders()).toEqual({}));
  });

  it("replaces nested context and restores its parent even after errors", () => {
    withTraceContext({ traceparent: parent, tracestate: "outer=value" }, () => {
      expect(() =>
        withTraceContext({ traceparent: other }, () => {
          expect(getTraceContextHeaders()).toEqual({ traceparent: other });
          throw new Error("failed");
        }),
      ).toThrow("failed");
      expect(getTraceContextHeaders()).toEqual({ traceparent: parent, tracestate: "outer=value" });
      withTraceContext({}, () => expect(getTraceContextHeaders()).toEqual({}));
    });
    expect(getTraceContextHeaders()).toEqual({});
  });

  it("isolates overlapping asynchronous requests", async () => {
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = withTraceContext({ traceparent: parent }, async () => {
      await ready;
      expect(getTraceContextHeaders()).toEqual({ traceparent: parent });
    });
    await withTraceContext({ traceparent: other }, async () => {
      release();
      await first;
      expect(getTraceContextHeaders()).toEqual({ traceparent: other });
    });
    expect(getTraceContextHeaders()).toEqual({});
  });

  it("does not leak after an asynchronous failure", async () => {
    await expect(
      withTraceContext({ traceparent: parent }, async () => {
        await Promise.resolve();
        throw new Error("failed");
      }),
    ).rejects.toThrow("failed");
    expect(getTraceContextHeaders()).toEqual({});
  });

  it("makes incoming context active and honors child spans when OpenTelemetry is configured", async () => {
    context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
    try {
      await withTraceContext({ traceparent: parent }, async () => {
        await Promise.resolve();
        expect(trace.getSpanContext(context.active())?.traceId).toBe(parent.split("-")[1]);
        const child = trace.setSpanContext(context.active(), {
          traceId: parent.split("-")[1],
          spanId: "cccccccccccccccc",
          traceFlags: 1,
        });
        context.with(child, () =>
          expect(getTraceContextHeaders().traceparent).toBe(parent.replace("00f067aa0ba902b7", "cccccccccccccccc")),
        );
        expect(getTraceContextHeaders().traceparent).toBe(parent);
      });
      context.with(
        trace.setSpanContext(ROOT_CONTEXT, {
          traceId: parent.split("-")[1],
          spanId: "cccccccccccccccc",
          traceFlags: 1,
        }),
        () => expect(getTraceContextHeaders()).toEqual({}),
      );
    } finally {
      context.disable();
    }
  });
});

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

import { validateJson } from "../../../src/utils/Json.util";

describe("validateJson", () => {
  it.each([
    ["null", null],
    ["an empty string", ""],
    ["a string", "value"],
    ["true", true],
    ["false", false],
    ["zero", 0],
    ["negative zero", -0],
    ["a fraction", -0.5],
    ["the smallest positive number", Number.MIN_VALUE],
    ["the largest finite number", Number.MAX_VALUE],
    ["an empty array", []],
    ["an empty object", {}],
    ["nested JSON", { values: [null, false, 0, "", { tags: ["a", "b"] }] }],
  ])("accepts %s", (_name, value) => {
    expect(validateJson(value, "metadata")).toBeUndefined();
  });

  it("accepts null-prototype objects without changing their properties or prototype", () => {
    const value: Record<string, unknown> = Object.assign(Object.create(null), {
      nested: Object.assign(Object.create(null), { enabled: false }),
    });
    Object.defineProperty(value, "__proto__", { value: { safe: true }, enumerable: true });

    expect(validateJson(value, "metadata")).toBeUndefined();
    expect(Object.getPrototypeOf(value)).toBeNull();
    expect(value.__proto__).toEqual({ safe: true });
    expect(value.nested).toEqual({ enabled: false });
  });

  it("accepts shared references and frozen values without mistaking siblings for cycles", () => {
    const shared = Object.freeze({ tags: Object.freeze([1, null, "tag"]) });
    const value = Object.freeze({ first: shared, second: shared, items: Object.freeze([shared, shared]) });
    const ancestor = {};
    const ancestors = new Set([ancestor]);

    expect(validateJson(value, "metadata", ancestors)).toBeUndefined();
    expect([...ancestors]).toEqual([ancestor]);
    expect(value.first).toBe(shared);
    expect(value.second).toBe(shared);
  });

  it.each([
    ["undefined", undefined],
    ["NaN", NaN],
    ["positive infinity", Infinity],
    ["negative infinity", -Infinity],
    ["a bigint", 1n],
    ["a symbol", Symbol("invalid")],
    ["a function", () => 1],
  ])("rejects %s at the root and inside arrays and objects", (_name, value) => {
    for (const candidate of [value, [value], { nested: [{ value }] }]) {
      expect(() => validateJson(candidate, "request.metadata")).toThrow(
        new TypeError("request.metadata must contain only JSON values"),
      );
    }
  });

  it.each([
    ["a date", new Date("2026-01-01T00:00:00Z")],
    ["a map", new Map([["key", "value"]])],
    ["a set", new Set([1])],
    ["a regular expression", /value/],
    ["a buffer", Buffer.from([1, 2])],
    ["a typed array", new Uint8Array([1, 2])],
    ["a custom prototype", Object.create({ inherited: true })],
  ])("rejects %s rather than silently coercing it to JSON", (_name, value) => {
    for (const candidate of [value, { nested: [value] }]) {
      expect(() => validateJson(candidate, "filter")).toThrow(
        new TypeError("filter must contain only plain JSON objects"),
      );
    }
  });

  it("does not call toJSON to turn a class instance into a plain object", () => {
    const toJSON = jest.fn(() => ({ valid: true }));
    class CustomValue {
      toJSON = toJSON;
    }

    expect(() => validateJson(new CustomValue(), "filter")).toThrow(
      new TypeError("filter must contain only plain JSON objects"),
    );
    expect(toJSON).not.toHaveBeenCalled();
  });

  it("rejects sparse arrays rather than treating holes as valid JSON nulls", () => {
    expect(() => validateJson({ values: new Array(2) }, "metadata")).toThrow(
      new TypeError("metadata must contain only JSON values"),
    );
  });

  it("rejects a direct object cycle", () => {
    const value: Record<string, unknown> = {};
    value.self = value;

    expect(() => validateJson(value, "metadata")).toThrow(
      new TypeError("metadata must not contain circular references"),
    );
  });

  it("rejects a direct array cycle", () => {
    const value: unknown[] = [];
    value.push(value);

    expect(() => validateJson(value, "metadata")).toThrow(
      new TypeError("metadata must not contain circular references"),
    );
  });

  it("rejects an indirect cycle through objects and arrays", () => {
    const value: { children: unknown[] } = { children: [] };
    value.children.push({ parent: value });

    expect(() => validateJson(value, "metadata")).toThrow(
      new TypeError("metadata must not contain circular references"),
    );
  });

  it("rejects a reference to an ancestor supplied by the caller", () => {
    const value = { valid: true };
    expect(() => validateJson({ value }, "filter", new Set([value]))).toThrow(
      new TypeError("filter must not contain circular references"),
    );
  });
});

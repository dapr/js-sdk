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
    { name: "null", value: null },
    { name: "an empty string", value: "" },
    { name: "a string", value: "Dapr" },
    { name: "true", value: true },
    { name: "false", value: false },
    { name: "zero", value: 0 },
    { name: "a negative fraction", value: -0.5 },
    { name: "the largest finite number", value: Number.MAX_VALUE },
    { name: "an empty array", value: [] },
    { name: "an empty object", value: {} },
    { name: "nested arrays and objects", value: { items: [{ value: [null, false, 0, "text"] }] } },
  ])("accepts $name", ({ value }) => {
    expect(validateJson(value, "Payload")).toBeUndefined();
  });

  it("accepts null-prototype objects without changing their properties or prototype", () => {
    const value: Record<string, unknown> = Object.create(null);
    value["__proto__"] = { nested: [1, null] };
    Object.freeze(value);

    expect(validateJson(value, "Payload")).toBeUndefined();
    expect(Object.getPrototypeOf(value)).toBeNull();
    expect(value["__proto__"]).toEqual({ nested: [1, null] });
  });

  it.each([
    { name: "undefined", value: undefined },
    { name: "NaN", value: NaN },
    { name: "positive infinity", value: Infinity },
    { name: "negative infinity", value: -Infinity },
    { name: "a bigint", value: 1n },
    { name: "a symbol", value: Symbol("value") },
    { name: "a function", value: () => "value" },
  ])("rejects $name at the root and in nested collections", ({ value }) => {
    for (const input of [value, { nested: value }, [value]]) {
      expect(() => validateJson(input, "Payload")).toThrow(new TypeError("Payload must contain only JSON values"));
    }
  });

  it.each([
    { name: "a Date", value: new Date(0) },
    { name: "a Map", value: new Map() },
    { name: "a Set", value: new Set() },
    { name: "a RegExp", value: /value/ },
    { name: "a typed array", value: Uint8Array.of(1, 2) },
    { name: "an object with a custom prototype", value: Object.create({ inherited: true }) },
  ])("does not coerce $name into JSON", ({ value }) => {
    for (const input of [value, { nested: [value] }]) {
      expect(() => validateJson(input, "Payload")).toThrow(
        new TypeError("Payload must contain only plain JSON objects"),
      );
    }
  });

  it("rejects toJSON methods instead of invoking them", () => {
    const toJSON = jest.fn(() => ({ value: 1 }));
    expect(() => validateJson({ toJSON }, "Payload")).toThrow(new TypeError("Payload must contain only JSON values"));
    expect(toJSON).not.toHaveBeenCalled();
  });

  it("rejects array holes rather than treating them as null", () => {
    const value = { items: new Array(1) };
    expect(() => validateJson(value, "Payload")).toThrow(new TypeError("Payload must contain only JSON values"));
  });

  it("rejects direct, indirect, and mixed object/array cycles", () => {
    const object: Record<string, unknown> = {};
    object.self = object;
    const array: unknown[] = [];
    array.push(array);
    const mixed: Record<string, unknown> = {};
    mixed.items = [{ parent: mixed }];

    for (const value of [object, array, mixed, { nested: object }]) {
      expect(() => validateJson(value, "Payload")).toThrow(
        new TypeError("Payload must not contain circular references"),
      );
    }
  });

  it("allows repeated object and array references outside the current ancestor chain", () => {
    const shared = Object.freeze({ value: 1 });
    const items = Object.freeze([shared, shared]);
    const value = Object.freeze({ first: items, second: items, third: shared });

    expect(validateJson(value, "Payload")).toBeUndefined();
    expect(value.first).toBe(value.second);
    expect(value.first[0]).toBe(value.third);
  });

  it("preserves supplied ancestors after a successful validation", () => {
    const ancestor = {};
    const ancestors = new Set([ancestor]);

    expect(validateJson({ nested: [1, {}] }, "Payload", ancestors)).toBeUndefined();
    expect(ancestors).toEqual(new Set([ancestor]));
    expect(() => validateJson(ancestor, "Payload", ancestors)).toThrow(
      new TypeError("Payload must not contain circular references"),
    );
  });
});

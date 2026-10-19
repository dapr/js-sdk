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

import { withBaggage } from "../../../src";
import { getBaggageHeader } from "../../../src/utils/Baggage.util";

describe("withBaggage", () => {
  it("returns the callback result and does not add a header for an empty context", () => {
    expect(getBaggageHeader()).toBeUndefined();
    expect(withBaggage({}, () => getBaggageHeader())).toBeUndefined();
    expect(withBaggage({ tenant: "acme" }, () => 42)).toBe(42);
    expect(getBaggageHeader()).toBeUndefined();
  });

  it("encodes raw values, including delimiters, percent signs, Unicode and control characters", () => {
    expect(withBaggage({ tenant: "acme", value: 'a b,c;d=e%"\\\r\n\u00e9', empty: "" }, () => getBaggageHeader())).toBe(
      "tenant=acme,value=a%20b%2Cc%3Bd%3De%25%22%5C%0D%0A%C3%A9,empty=",
    );
  });

  it("preserves context across awaits and timers, merging nested entries without mutating the parent", async () => {
    await withBaggage({ tenant: "outer", user: "123" }, async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(getBaggageHeader()).toBe("tenant=outer,user=123");
      await withBaggage({ tenant: "inner", region: "west" }, async () => {
        await Promise.resolve();
        expect(getBaggageHeader()).toBe("tenant=inner,user=123,region=west");
      });
      expect(withBaggage({}, () => getBaggageHeader())).toBe("tenant=outer,user=123");
      expect(getBaggageHeader()).toBe("tenant=outer,user=123");
    });
    expect(getBaggageHeader()).toBeUndefined();
  });

  it("isolates overlapping asynchronous callbacks", async () => {
    let releaseFirst!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = withBaggage({ tenant: "first" }, async () => {
      await gate;
      expect(getBaggageHeader()).toBe("tenant=first");
    });
    await withBaggage({ tenant: "second" }, async () => {
      await Promise.resolve();
      expect(getBaggageHeader()).toBe("tenant=second");
      releaseFirst();
      await first;
      expect(getBaggageHeader()).toBe("tenant=second");
    });
    expect(getBaggageHeader()).toBeUndefined();
  });

  it("takes a snapshot of caller-owned entries", () => {
    const entries = { tenant: "original" };
    withBaggage(entries, () => {
      entries.tenant = "changed";
      expect(getBaggageHeader()).toBe("tenant=original");
    });
  });

  it("preserves thrown errors and rejected promises while restoring the outer context", async () => {
    const error = new Error("callback failed");
    await withBaggage({ tenant: "outer" }, async () => {
      expect(() =>
        withBaggage({ tenant: "inner" }, () => {
          throw error;
        }),
      ).toThrow(error);
      await expect(
        withBaggage({ tenant: "inner" }, async () => {
          await Promise.resolve();
          throw error;
        }),
      ).rejects.toBe(error);
      expect(getBaggageHeader()).toBe("tenant=outer");
    });
    expect(getBaggageHeader()).toBeUndefined();
  });

  it.each(["", "has space", "a,b", "a=b", "a;b", "a:b", "\u00e9", "key\n", "key\r\ninjected"])(
    "rejects invalid key %j before running the callback",
    (key) => {
      const callback = jest.fn();
      expect(() => withBaggage({ [key]: "value" }, callback)).toThrow(TypeError);
      expect(callback).not.toHaveBeenCalled();
      expect(getBaggageHeader()).toBeUndefined();
    },
  );

  it("accepts every HTTP token character and treats keys as case-sensitive", () => {
    const key = "!#$%&'*+-.^_`|~0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    expect(withBaggage({ [key]: "value", Tenant: "upper", tenant: "lower" }, getBaggageHeader)).toBe(
      `${key}=value,Tenant=upper,tenant=lower`,
    );
  });

  it("rejects non-string values and malformed Unicode before running the callback", () => {
    const callback = jest.fn();
    // @ts-expect-error JavaScript callers can provide non-string values.
    expect(() => withBaggage({ tenant: 123 }, callback)).toThrow(TypeError);
    expect(() => withBaggage({ tenant: "\ud800" }, callback)).toThrow(URIError);
    expect(callback).not.toHaveBeenCalled();
    expect(getBaggageHeader()).toBeUndefined();
  });
});

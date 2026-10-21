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

import { evaluateMinimumDaprRuntime, evaluateSearchRuntime } from "../../e2e/helpers/runtimeVersion";

describe("Dapr runtime version gate", () => {
  it.each([
    ["1.16.0", "1.16.0"],
    ["1.16.0", "1.16.1"],
    ["1.16.0", "1.17.0"],
    ["1.17.0", "1.17.0"],
    ["1.17.0", "1.17.1"],
    ["1.17.0", "1.18.0"],
    ["1.16.0", "v1.16.0"],
    ["1.16.0", "1.16.0-rc.1"],
    ["1.16.0", "1.16.0+build.1"],
    ["1.16", "1.16.0"],
  ])("allows minimum %s on runtime %s", (minimumVersion, currentVersion) => {
    expect(evaluateMinimumDaprRuntime(minimumVersion, currentVersion)).toEqual({ supported: true });
  });

  describe("Search runtime version gate", () => {
    it.each(["1.18.9", "1.19.0-rc.1", "1.19.0-rc.3+build", "v1.19.0-rc04", " 1.19.0-rc.4 "])(
      "skips runtime %s without Search",
      (version) => {
        expect(evaluateSearchRuntime(version)).toMatchObject({ supported: false, reason: expect.any(String) });
      },
    );

    it.each(["edge", "latest", "1.19.0-rc.5", "1.19.0", "1.19.1", "1.20.0-rc.1"])(
      "allows Search-capable runtime %s",
      (version) => {
        expect(evaluateSearchRuntime(version)).toEqual({ supported: true });
      },
    );
  });

  it("skips a test when the runtime is older than its minimum", () => {
    expect(evaluateMinimumDaprRuntime("1.17.0", "1.16.9")).toEqual({
      supported: false,
      reason: "requires Dapr runtime >= 1.17.0; current: 1.16.9",
    });
  });

  it.each(["", "latest", "development"])("allows an unknown current runtime version '%s'", (currentVersion) => {
    expect(evaluateMinimumDaprRuntime("1.16.0", currentVersion)).toEqual({ supported: true });
  });

  it.each(["", "latest", "1", "one.sixteen"])("rejects invalid minimum version '%s'", (minimumVersion) => {
    expect(() => evaluateMinimumDaprRuntime(minimumVersion, "1.16.0")).toThrow(
      `Invalid minimum Dapr runtime version '${minimumVersion}'.`,
    );
  });
});

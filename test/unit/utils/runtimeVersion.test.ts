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

import { DAPR_VERSION } from "@dapr/testcontainer-node";
import { evaluateMinimumDaprRuntime } from "../../e2e/helpers/runtimeVersion";

jest.mock("@dapr/testcontainer-node", () => ({
  DAPR_VERSION: "1.19.0",
  DaprContainer: jest.fn(),
}));
jest.mock("testcontainers", () => ({}));

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

  it.each([
    ["1.17.0", "1.16.9"],
    ["1.17.1", "1.17.0"],
    ["2.0.0", "1.99.99"],
  ])("skips minimum %s on older runtime %s", (minimumVersion, currentVersion) => {
    expect(evaluateMinimumDaprRuntime(minimumVersion, currentVersion)).toEqual({
      supported: false,
      reason: `requires Dapr runtime >= ${minimumVersion}; current: ${currentVersion}`,
    });
  });

  it.each(["edge", "EDGE", "Edge", "eDgE", " edge "])("allows every minimum on runtime '%s'", (currentVersion) => {
    for (const minimumVersion of ["1.16.0", "1.19.0", "99.0.0"]) {
      expect(evaluateMinimumDaprRuntime(minimumVersion, currentVersion)).toEqual({ supported: true });
    }
  });

  it.each(["", "latest", "development"])("allows an unknown current runtime version '%s'", (currentVersion) => {
    expect(evaluateMinimumDaprRuntime("1.16.0", currentVersion)).toEqual({ supported: true });
  });

  it.each(["", "latest", "edge", "EDGE", "1", "one.sixteen"])(
    "rejects invalid minimum version '%s'",
    (minimumVersion) => {
      for (const currentVersion of ["1.16.0", "edge", "EDGE"]) {
        expect(() => evaluateMinimumDaprRuntime(minimumVersion, currentVersion)).toThrow(
          `Invalid minimum Dapr runtime version '${minimumVersion}'.`,
        );
      }
    },
  );
});

describe("Dapr test runtime images", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["edge", undefined, "edge"],
    ["EDGE", undefined, "edge"],
    [" Edge ", undefined, "edge"],
    [undefined, "eDgE", "edge"],
    ["", "EDGE", "edge"],
    ["1.19.0-rc.4", "edge", "1.19.0-rc.4"],
    ["edge", "1.18.0", "edge"],
    [undefined, "1.18.0", "1.18.0"],
    [undefined, undefined, DAPR_VERSION],
  ])("resolves primary %s and legacy %s to %s", (primary, legacy, expected) => {
    const env = { ...process.env };
    delete env.DAPR_RUNTIME_VERSION;
    delete env.DAPR_RUNTIME_VER;
    if (primary !== undefined) env.DAPR_RUNTIME_VERSION = primary;
    if (legacy !== undefined) env.DAPR_RUNTIME_VER = legacy;
    jest.replaceProperty(process, "env", env);

    jest.isolateModules(() => {
      const runtime = jest.requireActual<typeof import("../../e2e/helpers/runtimeVersion")>(
        "../../e2e/helpers/runtimeVersion",
      );
      const containers =
        jest.requireActual<typeof import("../../e2e/helpers/containers")>("../../e2e/helpers/containers");

      expect(runtime.DAPR_TEST_VERSION).toBe(expected);
      expect(containers.DAPR_TEST_RUNTIME_IMAGE).toBe(`daprio/daprd:${expected}`);
      expect(containers.DAPR_TEST_PLACEMENT_IMAGE).toBe(`daprio/placement:${expected}`);
      expect(containers.DAPR_TEST_SCHEDULER_IMAGE).toBe(`daprio/scheduler:${expected}`);
    });
  });
});

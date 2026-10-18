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

export const DAPR_TEST_VERSION = process.env.DAPR_RUNTIME_VERSION || process.env.DAPR_RUNTIME_VER || DAPR_VERSION;

interface RuntimeVersionGate {
  supported: boolean;
  reason?: string;
}

export function minimumDaprRuntime(
  minimumVersion: string,
  name: string,
  callback: jest.ProvidesCallback,
  timeout?: number,
): void {
  const gate = evaluateMinimumDaprRuntime(minimumVersion, DAPR_TEST_VERSION);
  const testName = gate.reason === undefined ? name : `${name} (${gate.reason})`;
  const test = gate.supported ? it : it.skip;

  test(testName, callback, timeout);
}

export function evaluateMinimumDaprRuntime(minimumVersion: string, currentVersion: string): RuntimeVersionGate {
  const minimum = parseDaprRuntimeVersion(minimumVersion);
  if (minimum === undefined) {
    throw new Error(`Invalid minimum Dapr runtime version '${minimumVersion}'.`);
  }

  if (currentVersion.trim() === "" || currentVersion.trim().toLowerCase() === "latest") {
    return { supported: true };
  }

  const current = parseDaprRuntimeVersion(currentVersion);
  if (current === undefined || compareVersions(current, minimum) >= 0) {
    return { supported: true };
  }

  return {
    supported: false,
    reason: `requires Dapr runtime >= ${minimumVersion}; current: ${currentVersion}`,
  };
}

function parseDaprRuntimeVersion(version: string): readonly [number, number, number] | undefined {
  const match = /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:[-+].*)?$/i.exec(version.trim());
  if (match === null) {
    return undefined;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

function compareVersions(left: readonly [number, number, number], right: readonly [number, number, number]): number {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }

  return 0;
}

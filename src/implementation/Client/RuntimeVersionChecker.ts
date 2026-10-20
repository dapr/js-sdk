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

import IClientMetadata from "../../interfaces/Client/IClientMetadata";

type ApiVersion = "v1.0" | "v1.0-alpha1";
type Api = "bulkPublish" | "jobs";

/** Internal metadata-based version selection, shared by HTTP and gRPC metadata clients. */
export default class RuntimeVersionChecker {
  private readonly versions = new Map<Api, Promise<ApiVersion>>();

  constructor(private readonly metadata: IClientMetadata) {}

  getBulkPublishApiVersion(): Promise<ApiVersion> {
    return this.resolve("bulkPublish");
  }

  getJobsApiVersion(): Promise<ApiVersion> {
    return this.resolve("jobs");
  }

  private resolve(api: Api): Promise<ApiVersion> {
    const cached = this.versions.get(api);
    if (cached) {
      return cached;
    }
    const pending = this.metadata.get().then(({ runtimeVersion }): ApiVersion => {
      const value = runtimeVersion?.trim() ?? "";
      if (value.toLowerCase() === "edge") {
        return "v1.0";
      }
      const match = /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9a-z.-]+))?(?:\+[0-9a-z.-]+)?$/i.exec(value);
      if (!match) {
        throw new Error(`Unable to determine Dapr runtime version from metadata: '${runtimeVersion ?? ""}'.`);
      }
      const major = Number(match[1]);
      const minor = Number(match[2]);
      if (api === "jobs" && (major < 1 || (major === 1 && minor < 16))) {
        throw new Error(`Jobs requires Dapr runtime 1.16 or later; connected to '${value}'.`);
      }

      if (api === "bulkPublish") {
        return major > 1 || (major === 1 && minor >= 17) ? "v1.0" : "v1.0-alpha1";
      }
      // Jobs keeps Alpha1 on 1.18 prereleases; bulk publish was already stable in 1.17 prereleases.
      return major > 1 || (minor >= 18 && !match[4]) || minor > 18 ? "v1.0" : "v1.0-alpha1";
    });
    this.versions.set(api, pending);
    void pending.catch(() => {
      if (this.versions.get(api) === pending) {
        this.versions.delete(api);
      }
    });
    return pending;
  }
}

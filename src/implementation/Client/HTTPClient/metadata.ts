/*
Copyright 2022 The Dapr Authors
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

import HTTPClient from "./HTTPClient";
import { GetMetadataResponse } from "../../../types/metadata/GetMetadataResponse";
import IClientMetadata from "../../../interfaces/Client/IClientMetadata";

// https://docs.dapr.io/reference/api/metadata_api
export default class HTTPClientMetadata implements IClientMetadata {
  client: HTTPClient;
  private bulkPublishApiVersion?: Promise<"v1.0" | "v1.0-alpha1">;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async get(): Promise<GetMetadataResponse> {
    const result = await this.client.execute(`/metadata`);
    return result as GetMetadataResponse;
  }

  /**
   * Resolves and caches the bulk publish endpoint without probing with a POST,
   * which older runtimes can mistake for a regular publish.
   * The stable endpoint is supported since 1.17 and on edge builds. This edge
   * policy is specific to bulk publish, not a guarantee for other APIs.
   * Failed lookups are retried on the next call; get() still returns fresh metadata.
   */
  getBulkPublishApiVersion(): Promise<"v1.0" | "v1.0-alpha1"> {
    if (!this.bulkPublishApiVersion) {
      const apiVersion = this.get().then(({ runtimeVersion }) => {
        if (runtimeVersion?.trim().toLowerCase() === "edge") {
          return "v1.0";
        }

        const version = /^v?(\d+)\.(\d+)(?:\.\d+)?(?:[-+].*)?$/i.exec(runtimeVersion?.trim() ?? "");
        if (!version) {
          throw new Error(`Unable to determine Dapr runtime version from metadata: '${runtimeVersion ?? ""}'.`);
        }

        const major = Number(version[1]);
        const minor = Number(version[2]);
        return major > 1 || (major === 1 && minor >= 17) ? "v1.0" : "v1.0-alpha1";
      });
      this.bulkPublishApiVersion = apiVersion;
      void apiVersion.catch(() => {
        if (this.bulkPublishApiVersion === apiVersion) {
          this.bulkPublishApiVersion = undefined;
        }
      });
    }

    return this.bulkPublishApiVersion;
  }

  async set(key: string, value: string): Promise<boolean> {
    await this.client.execute(`/metadata/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
      },
      body: value,
    });

    return true;
  }
}

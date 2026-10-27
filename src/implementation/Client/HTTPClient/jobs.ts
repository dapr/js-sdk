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

import { createRegistry, fromJson, JsonValue, toJson } from "@bufbuild/protobuf";
import { StructSchema, ValueSchema } from "@bufbuild/protobuf/wkt";
import HTTPClient from "./HTTPClient";
import IClientJobs from "../../../interfaces/Client/IClientJobs";
import HTTPClientMetadata from "./metadata";
import { Job, JobOptions } from "../../../types/jobs/Job";
import { JobSchema } from "../../../proto/dapr/proto/runtime/v1/jobs_pb";
import { JobFailurePolicySchema } from "../../../proto/dapr/proto/common/v1/common_pb";
import { encodeJob, decodeJob, decodeJobData, validateJobName } from "../../../jobs/Jobs.util";

export default class HTTPClientJobs implements IClientJobs {
  constructor(private readonly client: HTTPClient, private readonly metadata: HTTPClientMetadata) {}

  async schedule(name: string, options: JobOptions): Promise<void> {
    const job = encodeJob(name, options);
    if (options.data instanceof Uint8Array) {
      throw new TypeError("HTTP Jobs requires a JSON payload; use gRPC for opaque bytes");
    }
    const body = {
      schedule: job.schedule,
      dueTime: job.dueTime,
      ttl: job.ttl,
      repeats: job.repeats,
      // An omitted HTTP Value becomes an invalid empty protobuf Value on older runtimes.
      data: job.data === undefined ? null : decodeJobData(job.data),
      overwrite: options.overwrite,
      failurePolicy: job.failurePolicy ? toJson(JobFailurePolicySchema, job.failurePolicy) : undefined,
    };
    const version = await this.metadata.getJobsApiVersion();
    await this.client.executeWithApiVersion(version, `/jobs/${encodeURIComponent(name)}`, {
      method: "POST",
      body,
    });
  }

  async get(name: string): Promise<Job> {
    validateJobName(name);
    const version = await this.metadata.getJobsApiVersion();
    const response = await this.client.executeWithApiVersion(version, `/jobs/${encodeURIComponent(name)}`, {
      method: "GET",
    });
    return decodeJob(
      fromJson(JobSchema, response as JsonValue, { registry: createRegistry(StructSchema, ValueSchema) }),
    );
  }

  async delete(name: string): Promise<void> {
    validateJobName(name);
    const version = await this.metadata.getJobsApiVersion();
    await this.client.executeWithApiVersion(version, `/jobs/${encodeURIComponent(name)}`, { method: "DELETE" });
  }
}

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

import { create } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import IClientJobs from "../../../interfaces/Client/IClientJobs";
import GRPCClientMetadata from "./metadata";
import { Job, JobOptions } from "../../../types/jobs/Job";
import {
  ScheduleJobRequestSchema,
  GetJobRequestSchema,
  DeleteJobRequestSchema,
} from "../../../proto/dapr/proto/runtime/v1/jobs_pb";
import { encodeJob, decodeJob, validateJobName } from "../../../jobs/Jobs.util";

export default class GRPCClientJobs implements IClientJobs {
  constructor(private readonly client: GRPCClient, private readonly metadata: GRPCClientMetadata) {}

  async schedule(name: string, options: JobOptions): Promise<void> {
    const request = create(ScheduleJobRequestSchema, { job: encodeJob(name, options), overwrite: options.overwrite });
    const version = await this.metadata.getJobsApiVersion();
    const client = await this.client.getClient();
    if (version === "v1.0") {
      await client.scheduleJob(request);
    } else {
      await client.scheduleJobAlpha1(request);
    }
  }

  async get(name: string): Promise<Job> {
    validateJobName(name);
    const version = await this.metadata.getJobsApiVersion();
    const client = await this.client.getClient();
    const request = create(GetJobRequestSchema, { name });
    const response = version === "v1.0" ? await client.getJob(request) : await client.getJobAlpha1(request);
    return decodeJob(response.job);
  }

  async delete(name: string): Promise<void> {
    validateJobName(name);
    const version = await this.metadata.getJobsApiVersion();
    const client = await this.client.getClient();
    const request = create(DeleteJobRequestSchema, { name });
    if (version === "v1.0") {
      await client.deleteJob(request);
    } else {
      await client.deleteJobAlpha1(request);
    }
  }
}

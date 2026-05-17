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
import IClientJobs from "../../../interfaces/Client/IClientJobs";
import { Job } from "../../../types/jobs/Job";
import { JobFailurePolicy } from "../../../types/jobs/JobFailurePolicy";
import { ScheduleJobRequest } from "../../../types/jobs/ScheduleJobRequest";
import { KeyValueType } from "../../../types/KeyValue.type";

/**
 * Serialize SDK JobFailurePolicy to the HTTP API shape.
 */
function toHTTPFailurePolicy(fp: JobFailurePolicy): KeyValueType {
  if (fp.type === "drop") {
    return { drop: {} };
  }
  const constant: KeyValueType = {};
  if (fp.interval !== undefined) {
    constant.interval = fp.interval;
  }
  if (fp.maxRetries !== undefined) {
    constant.maxRetries = fp.maxRetries;
  }
  return { constant };
}

export default class HTTPClientJobs implements IClientJobs {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async schedule(job: ScheduleJobRequest): Promise<void> {
    const body: KeyValueType = {};

    if (job.schedule !== undefined) {
      body.schedule = job.schedule;
    }
    if (job.dueTime !== undefined) {
      body.dueTime = job.dueTime;
    }
    if (job.repeats !== undefined) {
      body.repeats = job.repeats;
    }
    if (job.ttl !== undefined) {
      body.ttl = job.ttl;
    }
    if (job.data !== undefined) {
      body.data = job.data;
    }
    if (job.failurePolicy !== undefined) {
      body.failurePolicy = toHTTPFailurePolicy(job.failurePolicy);
    }
    if (job.overwrite !== undefined) {
      body.overwrite = job.overwrite;
    }

    await this.client.executeWithApiVersion("v1.0-alpha1", `/jobs/${job.name}`, {
      method: "POST",
      body,
    });
  }

  async get(name: string): Promise<Job> {
    const result = await this.client.executeWithApiVersion("v1.0-alpha1", `/jobs/${name}`, {
      method: "GET",
    });

    const raw = result as KeyValueType;
    const job: Job = { name };

    if (raw.schedule !== undefined) {
      job.schedule = raw.schedule as string;
    }
    if (raw.dueTime !== undefined) {
      job.dueTime = raw.dueTime as string;
    }
    if (raw.repeats !== undefined) {
      job.repeats = raw.repeats as number;
    }
    if (raw.ttl !== undefined) {
      job.ttl = raw.ttl as string;
    }
    if (raw.data !== undefined) {
      job.data = raw.data;
    }
    if (raw.failurePolicy !== undefined) {
      const fp = raw.failurePolicy as KeyValueType;
      if (fp.drop !== undefined) {
        job.failurePolicy = { type: "drop" };
      } else if (fp.constant !== undefined) {
        const constant = fp.constant as KeyValueType;
        const policy: JobFailurePolicy & { type: "constant" } = { type: "constant" };
        if (constant.interval !== undefined) {
          policy.interval = constant.interval as string;
        }
        if (constant.maxRetries !== undefined) {
          policy.maxRetries = constant.maxRetries as number;
        }
        job.failurePolicy = policy;
      }
    }

    return job;
  }

  async delete(name: string): Promise<void> {
    await this.client.executeWithApiVersion("v1.0-alpha1", `/jobs/${name}`, {
      method: "DELETE",
    });
  }
}

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

import { create } from "@bufbuild/protobuf";
import { AnySchema, DurationSchema } from "@bufbuild/protobuf/wkt";
import GRPCClient from "./GRPCClient";
import IClientJobs from "../../../interfaces/Client/IClientJobs";
import { Job } from "../../../types/jobs/Job";
import { JobFailurePolicy } from "../../../types/jobs/JobFailurePolicy";
import { ScheduleJobRequest } from "../../../types/jobs/ScheduleJobRequest";
import {
  JobSchema,
  ScheduleJobRequestSchema,
  GetJobRequestSchema,
  DeleteJobRequestSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import {
  JobFailurePolicySchema,
  JobFailurePolicyDropSchema,
  JobFailurePolicyConstantSchema,
} from "../../../proto/dapr/proto/common/v1/common_pb";
import type { JobFailurePolicy as ProtoJobFailurePolicy } from "../../../proto/dapr/proto/common/v1/common_pb";
import type { Job as ProtoJob } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";

/**
 * Parse a duration string like "5s", "1m30s", "2h" into total seconds.
 * Supports h, m, s units.
 */
function parseDurationSeconds(duration: string): number {
  let total = 0;
  const pattern = /(\d+)(h|m|s)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(duration)) !== null) {
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case "h":
        total += value * 3600;
        break;
      case "m":
        total += value * 60;
        break;
      case "s":
        total += value;
        break;
    }
  }
  return total;
}

/**
 * Convert SDK JobFailurePolicy to proto JobFailurePolicy.
 */
function toProtoFailurePolicy(fp: JobFailurePolicy): ProtoJobFailurePolicy {
  if (fp.type === "drop") {
    return create(JobFailurePolicySchema, {
      policy: { case: "drop", value: create(JobFailurePolicyDropSchema) },
    });
  }
  const constantPolicy: Record<string, unknown> = {};
  if (fp.interval !== undefined) {
    constantPolicy.interval = create(DurationSchema, { seconds: BigInt(parseDurationSeconds(fp.interval)) });
  }
  if (fp.maxRetries !== undefined) {
    constantPolicy.maxRetries = fp.maxRetries;
  }
  return create(JobFailurePolicySchema, {
    policy: { case: "constant", value: create(JobFailurePolicyConstantSchema, constantPolicy) },
  });
}

/**
 * Convert proto Job to SDK Job type.
 */
function fromProtoJob(protoJob: ProtoJob): Job {
  const job: Job = { name: protoJob.name };

  if (protoJob.schedule !== undefined) {
    job.schedule = protoJob.schedule;
  }
  if (protoJob.dueTime !== undefined) {
    job.dueTime = protoJob.dueTime;
  }
  if (protoJob.repeats !== undefined) {
    job.repeats = protoJob.repeats;
  }
  if (protoJob.ttl !== undefined) {
    job.ttl = protoJob.ttl;
  }

  if (protoJob.data !== undefined) {
    try {
      job.data = JSON.parse(Buffer.from(protoJob.data.value).toString("utf-8"));
    } catch {
      job.data = protoJob.data.value;
    }
  }

  if (protoJob.failurePolicy !== undefined) {
    const policy = protoJob.failurePolicy.policy;
    if (policy.case === "drop") {
      job.failurePolicy = { type: "drop" };
    } else if (policy.case === "constant") {
      const constant = policy.value;
      const fp: JobFailurePolicy & { type: "constant" } = { type: "constant" };
      if (constant.interval !== undefined) {
        const secs = Number(constant.interval.seconds);
        if (secs % 3600 === 0) {
          fp.interval = `${secs / 3600}h`;
        } else if (secs % 60 === 0) {
          fp.interval = `${secs / 60}m`;
        } else {
          fp.interval = `${secs}s`;
        }
      }
      if (constant.maxRetries !== undefined) {
        fp.maxRetries = constant.maxRetries;
      }
      job.failurePolicy = fp;
    }
  }

  return job;
}

export default class GRPCClientJobs implements IClientJobs {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async schedule(job: ScheduleJobRequest): Promise<void> {
    const client = await this.client.getClient();

    const protoJobFields: Record<string, unknown> = {
      name: job.name,
    };

    if (job.schedule !== undefined) {
      protoJobFields.schedule = job.schedule;
    }
    if (job.dueTime !== undefined) {
      protoJobFields.dueTime = job.dueTime;
    }
    if (job.repeats !== undefined) {
      protoJobFields.repeats = job.repeats;
    }
    if (job.ttl !== undefined) {
      protoJobFields.ttl = job.ttl;
    }
    if (job.data !== undefined) {
      protoJobFields.data = create(AnySchema, {
        value: Buffer.from(JSON.stringify(job.data), "utf-8"),
        typeUrl: "type.googleapis.com/google.protobuf.Value",
      });
    }
    if (job.failurePolicy !== undefined) {
      protoJobFields.failurePolicy = toProtoFailurePolicy(job.failurePolicy);
    }

    const req = create(ScheduleJobRequestSchema, {
      job: create(JobSchema, protoJobFields),
      overwrite: job.overwrite ?? false,
    });

    await client.scheduleJobAlpha1(req);
  }

  async get(name: string): Promise<Job> {
    const client = await this.client.getClient();
    const res = await client.getJobAlpha1(create(GetJobRequestSchema, { name }));

    if (!res.job) {
      throw new Error(`Job '${name}' not found in response`);
    }

    return fromProtoJob(res.job);
  }

  async delete(name: string): Promise<void> {
    const client = await this.client.getClient();
    await client.deleteJobAlpha1(create(DeleteJobRequestSchema, { name }));
  }
}

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

import { create, fromJson, toJson } from "@bufbuild/protobuf";
import { Any, AnySchema, anyPack, anyUnpack, DurationSchema, StructSchema, ValueSchema } from "@bufbuild/protobuf/wkt";
import { Job, JobOptions, JobFailurePolicy } from "../types/jobs/Job";
import { Job as ProtoJob, JobSchema } from "../proto/dapr/proto/runtime/v1/jobs_pb";
import { JobFailurePolicySchema } from "../proto/dapr/proto/common/v1/common_pb";
import { CronExpressionBuilder } from "./CronExpressionBuilder";
import { validateJson } from "../utils/Json.util";

export function validateJobName(name: string): void {
  // The runtime constructs callback URLs from the name without escaping reserved URL characters.
  if (
    typeof name !== "string" ||
    !name ||
    name.trim() !== name ||
    name === "." ||
    name === ".." ||
    /[/\\?#%|]/.test(name) ||
    Array.from(name).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  ) {
    throw new TypeError(
      "Job name must be nonempty and must not contain URL delimiters, percent, pipe, or control characters",
    );
  }
}

function validateUint32(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError(`${field} must be an integer between 0 and 4294967295`);
  }
}

export function encodeJob(name: string, options: JobOptions): ProtoJob {
  validateJobName(name);
  if (!options || typeof options !== "object") {
    throw new TypeError("Job options are required");
  }
  const schedule = options.schedule instanceof CronExpressionBuilder ? options.schedule.toString() : options.schedule;
  if (schedule === undefined && options.dueTime === undefined) {
    throw new TypeError("A job requires schedule or dueTime");
  }
  for (const [field, value] of Object.entries({ schedule, dueTime: options.dueTime, ttl: options.ttl })) {
    if (value !== undefined && (typeof value !== "string" || !value.trim())) {
      throw new TypeError(`${field} must be a nonempty string`);
    }
  }
  if (options.repeats !== undefined) {
    validateUint32(options.repeats, "repeats");
  }
  if (options.overwrite !== undefined && typeof options.overwrite !== "boolean") {
    throw new TypeError("overwrite must be a boolean");
  }
  const job = create(JobSchema, {
    name,
    schedule,
    dueTime: options.dueTime,
    ttl: options.ttl,
    repeats: options.repeats,
  });
  if (options.data !== undefined) {
    if (options.data instanceof Uint8Array) {
      job.data = create(AnySchema, {
        typeUrl: "dapr.io/schedule/jobpayload",
        value: Uint8Array.from(options.data),
      });
    } else {
      validateJson(options.data, "Job data");
      job.data = anyPack(ValueSchema, fromJson(ValueSchema, options.data));
    }
  }
  if (options.failurePolicy !== undefined) {
    const policy = options.failurePolicy;
    if (policy.type === "drop") {
      job.failurePolicy = create(JobFailurePolicySchema, { policy: { case: "drop", value: {} } });
    } else if (policy.type === "constant") {
      const interval = policy.interval === undefined ? undefined : fromJson(DurationSchema, policy.interval);
      if (interval && (interval.seconds < 0n || interval.nanos < 0)) {
        throw new RangeError("Failure policy interval must not be negative");
      }
      if (policy.maxRetries !== undefined) {
        validateUint32(policy.maxRetries, "maxRetries");
      }
      job.failurePolicy = create(JobFailurePolicySchema, {
        policy: { case: "constant", value: { interval, maxRetries: policy.maxRetries } },
      });
    } else {
      throw new TypeError("Unknown job failure policy");
    }
  }
  return job;
}

export function decodeJobData(data?: Any): Job["data"] {
  if (!data) {
    return undefined;
  }
  if (data.typeUrl.endsWith("/google.protobuf.Value")) {
    const value = anyUnpack(data, ValueSchema);
    if (!value) {
      throw new TypeError("Invalid job Value payload");
    }
    return toJson(ValueSchema, value);
  }
  if (data.typeUrl.endsWith("/google.protobuf.Struct")) {
    const value = anyUnpack(data, StructSchema);
    if (!value) {
      throw new TypeError("Invalid job Struct payload");
    }
    return toJson(StructSchema, value);
  }
  return Buffer.from(data.value);
}

export function decodeJob(job?: ProtoJob): Job {
  if (!job || !job.name) {
    throw new TypeError("Invalid Jobs response: missing job or name");
  }
  let failurePolicy: JobFailurePolicy | undefined;
  const policy = job.failurePolicy?.policy;
  if (policy?.case === "drop") {
    failurePolicy = { type: "drop" };
  } else if (policy?.case === "constant") {
    failurePolicy = {
      type: "constant",
      interval: policy.value.interval ? (toJson(DurationSchema, policy.value.interval) as string) : undefined,
      maxRetries: policy.value.maxRetries,
    };
  }
  return {
    name: job.name,
    schedule: job.schedule,
    dueTime: job.dueTime,
    ttl: job.ttl,
    repeats: job.repeats,
    data: decodeJobData(job.data),
    failurePolicy,
  };
}

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

import type { JsonValue } from "@bufbuild/protobuf";
import type { CronExpressionBuilder } from "../../jobs/CronExpressionBuilder";

export type JobFailurePolicy = { type: "drop" } | { type: "constant"; interval: string; maxRetries?: number };

export type Job = {
  name: string;
  /** Six-field cron or a Dapr descriptor such as @every 5m or @daily. */
  schedule?: string;
  /** RFC3339 timestamp, Go duration, or non-repeating ISO8601 duration. */
  dueTime?: string;
  /** Expiration, in the same formats as dueTime. */
  ttl?: string;
  /** Omit to repeat indefinitely; zero is passed through to the runtime. */
  repeats?: number;
  /** JSON values work across transports. Opaque bytes require gRPC for scheduling and retrieval. */
  data?: JsonValue | Uint8Array;
  /** Constant interval uses protobuf duration syntax, for example "1.5s". */
  failurePolicy?: JobFailurePolicy;
};

export type JobOptions = Omit<Job, "name" | "schedule"> & {
  schedule?: string | CronExpressionBuilder;
  /** Defaults to false; existing jobs must be explicitly overwritten. */
  overwrite?: boolean;
};

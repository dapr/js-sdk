/*
Copyright 2025 The Dapr Authors
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

import { JobSchedule } from "../../types/jobs/JobSchedule.type";
import { Job } from "../../types/jobs/Job.type";

export default interface IClientJobs {
  schedule(
    jobName: string,
    data: object | string,
    schedule: JobSchedule | null,
    dueTime: string | Date | null,
    repeats: number | null,
    ttl: string | null,
  ): Promise<void>;

  get(jobName: string): Promise<Job>;
  get<DataType>(jobName: string): Promise<Job<DataType>>;

  delete(jobName: string): Promise<void>;
}

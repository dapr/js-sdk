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

import IClientJobs from "../../../interfaces/Client/IClientJobs";
import HTTPClient from "./HTTPClient";
import { THTTPExecuteParams } from "../../../types/http/THTTPExecuteParams.type";
import { Job } from "../../../types/jobs/Job.type";
import { JobSchedule } from "../../../types/jobs/JobSchedule.type";

export default class HTTPClientJobs implements IClientJobs {

  private static ApiVersion = "v1.0-alpha1";
  private static Path = "jobs";

  constructor(private readonly httpClient: HTTPClient) {}

  async schedule(
    jobName: string,
    data: object | string,
    schedule: JobSchedule | null = null,
    dueTime: string | Date | null = null,
    repeats: number | null = null,
    ttl: string | null = null,
  ): Promise<void> {
    await this.httpClient.executeWithApiVersion(HTTPClientJobs.ApiVersion, `/${HTTPClientJobs.Path}/${jobName}`, {
      method: "POST",
      body: {
        data,
        schedule,
        dueTime,
        repeats,
        ttl,
      },
      headers: {
        "content-type": "application/json",
      },
    } as THTTPExecuteParams);
  }

  async get<DataType>(jobName: string): Promise<Job<DataType>> {
    const result = await this.httpClient.executeWithApiVersion(HTTPClientJobs.ApiVersion, `/${HTTPClientJobs.Path}/${jobName}`, {
      method: "GET",
    });

    return result as Job<DataType>;
  }

  async delete(jobName: string): Promise<void> {
    await this.httpClient.executeWithApiVersion(HTTPClientJobs.ApiVersion, `/${HTTPClientJobs.Path}/${jobName}`, {
      method: "DELETE",
    });
  }
}

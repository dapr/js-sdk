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

// todo: remove after implementation
/* eslint-disable */

import IClientJobs from "../../../interfaces/Client/IClientJobs";
import GRPCClient from "./GRPCClient";
import { Schedule } from "../../../types/jobs/JobSchedule.type";
import { Job } from "../../../types/jobs/Job.type";


export default class GRPCClientJobs implements IClientJobs {

    private readonly grpcClient: GRPCClient;

    constructor(grpcClient: GRPCClient) {
        this.grpcClient = grpcClient;
    }

    async schedule(
        jobName: string,
        data: object | string,
        schedule: Schedule | null = null,
        dueTime: string | Date | null = null,
        repeats: number | null = null,
        ttl: string | null = null
    ): Promise<void> {
        throw new Error("Not yet!");
    }

    async get<DataType>(jobName: string): Promise<Job<DataType>> {
        throw new Error("Not yet!");
    }

    async delete(jobName: string): Promise<void> {
        throw new Error("Not yet!");
    }
}
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

export enum FixedPeriod {
    Yearly = "@yearly",
    Monthly = "@monthly",
    Weekly = "@weekly",
    Daily = "@daily",
    Hourly = "@hourly"
}

// note: This can get pretty crazy, more than TS can really handle.
type SystemDCronExpression = `${string} ${string} ${string} ${string} ${string} ${string}`;

type EveryPeriod = `@every ${string}`;

type Schedule = FixedPeriod | EveryPeriod | SystemDCronExpression;

export type JobSchedule = Schedule;

export default interface IClientJobs {

    schedule(
        jobName: string,
        data: object | string,
        schedule: JobSchedule | null,
        dueTime: string | Date | null,
        repeats: number | null,
        ttl: string | null
    ): Promise<void>;
    get(): Promise<unknown>;
    delete(): Promise<unknown>;
}

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

import IClientJobs, { JobSchedule } from "../../../interfaces/Client/IClientJobs";
import HTTPClient from "./HTTPClient";
import { Logger } from "../../../logger/Logger";
import { THTTPExecuteParams } from "../../../types/http/THTTPExecuteParams.type";

export default class HTTPClientJobs implements IClientJobs {

    private readonly logger: Logger;
    private readonly httpClient: HTTPClient;

    constructor(httpClient: HTTPClient) {
        this.logger = new Logger("HTTPClient", "Jobs", httpClient.options.logger);
        this.httpClient = httpClient;
    }

    async schedule(
        jobName: string,
        data: object | string,
        schedule: JobSchedule | null = null,
        dueTime: string | Date | null = null,
        repeats: number | null = null,
        ttl: string | null = null
    ): Promise<void> {

        try {
            await this.httpClient.executeWithApiVersion(
                "v1.0-alpha1",
                `/jobs/${jobName}`,
                {
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
                } as THTTPExecuteParams
            );
        }
        catch (e: any) {
            this.logger.error(e);
        }
    }

    get(): Promise<unknown> {
        throw new Error("Not yet!");
    }

    delete(): Promise<unknown> {
        throw new Error("Not yet!");
    }
}
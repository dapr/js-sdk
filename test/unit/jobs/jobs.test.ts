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

import HTTPClient from "../../../src/implementation/Client/HTTPClient/HTTPClient";
import HTTPClientJobs from "../../../src/implementation/Client/HTTPClient/jobs";
import { Period } from "../../../src/types/jobs/Schedule.type";
import { CronExpressionBuilder, CronPeriod, Month } from "../../../src/types/jobs/CronExpression.type";

jest.mock("../../../src/implementation/Client/HTTPClient/HTTPClient");

describe("Jobs Client", () => {

    let httpClient : HTTPClient;
    let jobsClient: HTTPClientJobs

    beforeEach(async () => {

        httpClient = new HTTPClient({});
        jobsClient = new HTTPClientJobs(httpClient)
    });

    it("Should schedule using a period constant", async () => {

        await jobsClient.schedule(
            "test",
            {
                some: "data",
            },
            Period.Daily
        );

        expect(httpClient.executeWithApiVersion).toHaveBeenCalledTimes(1);
        expect(httpClient.executeWithApiVersion).toHaveBeenCalledWith("v1.0-alpha1", "/jobs/test", {
          body: {
            data: { some: "data" },
            dueTime: null,
            repeats: null,
            schedule: "@daily",
            ttl: null,
          },
          headers: { "content-type": "application/json" },
          method: "POST",
        });
    });

    it("Should schedule at the start of every month using a cron builder", async () => {

        await jobsClient.schedule(
            "test",
            {
                some: "data",
            },
            CronExpressionBuilder
              .through(CronPeriod.Month, Month.January, Month.December)
              .on(CronPeriod.Second, 0)
              .on(CronPeriod.Minute, 0)
              .on(CronPeriod.Hour, 0)
              .on(CronPeriod.DayOfMonth, 1)
        );

        expect(httpClient.executeWithApiVersion).toHaveBeenCalledTimes(1);
        expect(httpClient.executeWithApiVersion).toHaveBeenCalledWith("v1.0-alpha1", "/jobs/test", {
            body: {
                data: { some: "data" },
                dueTime: null,
                repeats: null,
                schedule: "0 0 0 1 JAN-DEC *",
                ttl: null,
            },
            headers: { "content-type": "application/json" },
            method: "POST",
        });
    });
});
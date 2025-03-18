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
import { PrefixedPeriodExpression } from "../../../src/types/jobs/JobSchedule.type";

jest.mock("../../../src/implementation/Client/HTTPClient/HTTPClient");

describe("Jobs Client", () => {

    let httpClient : HTTPClient;
    let jobsClient: HTTPClientJobs

    beforeEach(async () => {

        httpClient = new HTTPClient({});
        jobsClient = new HTTPClientJobs(httpClient)
    });

    it("Should schedule", async () => {

        await jobsClient.schedule(
            "test",
            {
                some: "data",
            },
            PrefixedPeriodExpression.Daily
        );

        expect(httpClient.executeWithApiVersion).toHaveBeenCalledTimes(1);
    });
});